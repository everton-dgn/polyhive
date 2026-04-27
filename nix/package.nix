{
  lib,
  buildNpmPackage,
  nodejs_22,
  python3,
  makeWrapper,
}:

buildNpmPackage rec {
  pname = "polyhive";
  version = (builtins.fromJSON (builtins.readFile ../package.json)).version;

  src = lib.cleanSourceWith {
    src = ./..;
    filter = path: type:
      let
        baseName = builtins.baseNameOf path;
        relPath = lib.removePrefix (toString ./..) path;
      in
      # Exclude non-daemon workspace contents (keep package.json for workspace resolution)
      !(lib.hasPrefix "/packages/app/src" relPath)
      && !(lib.hasPrefix "/packages/app/assets" relPath)
      && !(lib.hasPrefix "/packages/website/src" relPath)
      && !(lib.hasPrefix "/packages/website/public" relPath)
      && !(lib.hasPrefix "/packages/desktop/src" relPath)
      && !(lib.hasPrefix "/packages/desktop/src-tauri" relPath)
      # Exclude test fixtures and debug files
      && !(lib.hasSuffix ".test.ts" baseName)
      && !(lib.hasSuffix ".e2e.test.ts" baseName)
      && baseName != "node_modules"
      && baseName != ".git"
      && baseName != ".polyhive"
      && baseName != ".DS_Store";
  };

  nodejs = nodejs_22;

  # To update: run `nix build` with lib.fakeHash, copy the `got:` hash.
  # CI auto-updates this when package-lock.json changes (see .github/workflows/).
  npmDepsHash = "sha256-YVlVAZ3PA6fw2aILQn2pvEiSNpBbSg6BniBE7Wnfar0=";

  # Prevent onnxruntime-node's install script from running during automatic
  # npm rebuild (it tries to download from api.nuget.org, which fails in the sandbox).
  # We manually rebuild only node-pty in buildPhase.
  npmRebuildFlags = [ "--ignore-scripts" ];

  nativeBuildInputs = [
    python3 # for node-gyp (node-pty compilation)
    makeWrapper
  ];

  # Don't use the default npm build hook — we need a custom build sequence
  dontNpmBuild = true;

  buildPhase = ''
    runHook preBuild

    # Rebuild only node-pty (native addon for terminal emulation).
    # Speech-related native modules (sherpa-onnx, onnxruntime-node) are
    # intentionally left unbuilt — they're lazily loaded and gracefully
    # degrade when unavailable.
    npm rebuild node-pty

    # Build all daemon packages in dependency order (defined in package.json)
    npm run build:daemon

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/polyhive

    # Copy root package metadata
    cp package.json $out/lib/polyhive/

    # Copy node_modules (preserving workspace symlinks)
    cp -a node_modules $out/lib/polyhive/

    # Auto-detect which PolyHive workspace packages were built by build:daemon
    # (they'll have a dist/ directory). Copy those and remove the rest.
    for spec in \
      polyhive:cli \
      polyhive-highlight:highlight \
      polyhive-relay:relay \
      polyhive-server:server; do
      package_name=''${spec%%:*}
      workspace_name=''${spec#*:}
      link="$out/lib/polyhive/node_modules/$package_name"
      [ -e "$link" ] || continue
      if [ -d "packages/$workspace_name/dist" ]; then
        mkdir -p "$out/lib/polyhive/packages/$workspace_name"
        cp "packages/$workspace_name/package.json" "$out/lib/polyhive/packages/$workspace_name/"
        cp -a "packages/$workspace_name/dist" "$out/lib/polyhive/packages/$workspace_name/"
        if [ -d "packages/$workspace_name/node_modules" ]; then
          cp -a "packages/$workspace_name/node_modules" "$out/lib/polyhive/packages/$workspace_name/"
        fi
      else
        rm -f "$link"
      fi
    done

    # Copy CLI bin entry
    mkdir -p $out/lib/polyhive/packages/cli/bin
    cp packages/cli/bin/polyhive $out/lib/polyhive/packages/cli/bin/

    # Copy extra server files referenced at runtime
    for f in agent-prompt.md .env.example; do
      if [ -f packages/server/$f ]; then
        cp packages/server/$f $out/lib/polyhive/packages/server/
      fi
    done

    # Copy server scripts (including supervisor-entrypoint) needed by CLI
    if [ -d packages/server/dist/scripts ]; then
      mkdir -p $out/lib/polyhive/packages/server/dist/scripts
      cp -a packages/server/dist/scripts/* $out/lib/polyhive/packages/server/dist/scripts/
    fi

    # Create wrapper for the server entry point (for systemd / direct use)
    mkdir -p $out/bin
    makeWrapper ${nodejs}/bin/node $out/bin/polyhive-server \
      --add-flags "$out/lib/polyhive/packages/server/dist/server/server/index.js" \
      --set NODE_ENV production

    # Create wrapper for the CLI
    makeWrapper ${nodejs}/bin/node $out/bin/polyhive \
      --add-flags "$out/lib/polyhive/packages/cli/dist/index.js" \
      --set NODE_PATH "$out/lib/polyhive/node_modules"

    runHook postInstall
  '';

  meta = {
    description = "Self-hosted daemon for Claude Code, Codex, and OpenCode";
    homepage = "https://github.com/everton-dgn/polyhive";
    license = lib.licenses.agpl3Plus;
    mainProgram = "polyhive";
    platforms = [ "aarch64-darwin" ];
  };
}
