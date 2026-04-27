import { describe, expect, it } from "vitest";
import {
  createNodeEntrypointInvocation,
  parseCliPassthroughArgsFromArgv,
  type NodeEntrypointSpec,
} from "./node-entrypoint-launcher";

const CLI_ENTRYPOINT: NodeEntrypointSpec = {
  entryPath: "/tmp/polyhive-cli.js",
  execArgv: ["--import", "tsx"],
};

describe("node-entrypoint-launcher", () => {
  describe("parseCliPassthroughArgsFromArgv", () => {
    it("returns null when no CLI args are provided", () => {
      expect(
        parseCliPassthroughArgsFromArgv({
          argv: ["/Applications/PolyHive.app/Contents/MacOS/PolyHive"],
          isDefaultApp: false,
          forceCli: false,
        }),
      ).toBeNull();
    });

    it("ignores macOS GUI launch arguments", () => {
      expect(
        parseCliPassthroughArgsFromArgv({
          argv: ["/Applications/PolyHive.app/Contents/MacOS/PolyHive", "-psn_0_12345"],
          isDefaultApp: false,
          forceCli: false,
        }),
      ).toBeNull();
    });

    it("preserves CLI flags for direct app invocations", () => {
      expect(
        parseCliPassthroughArgsFromArgv({
          argv: ["/Applications/PolyHive.app/Contents/MacOS/PolyHive", "--version"],
          isDefaultApp: false,
          forceCli: false,
        }),
      ).toEqual(["--version"]);
    });

    it("passes --open-project through as a normal CLI arg", () => {
      expect(
        parseCliPassthroughArgsFromArgv({
          argv: [
            "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
            "--open-project",
            "/tmp/project",
          ],
          isDefaultApp: false,
          forceCli: false,
        }),
      ).toEqual(["--open-project", "/tmp/project"]);
    });

    it("forces CLI mode for shim launches even without args", () => {
      expect(
        parseCliPassthroughArgsFromArgv({
          argv: ["/Applications/PolyHive.app/Contents/MacOS/PolyHive"],
          isDefaultApp: false,
          forceCli: true,
        }),
      ).toEqual([]);
    });
  });

  describe("createNodeEntrypointInvocation", () => {
    it("uses the packaged runner when the desktop app is packaged", () => {
      expect(
        createNodeEntrypointInvocation({
          execPath: "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
          isPackaged: true,
          packagedRunnerPath:
            "/Applications/PolyHive.app/Contents/Resources/app.asar/dist/daemon/node-entrypoint-runner.js",
          entrypoint: CLI_ENTRYPOINT,
          argvMode: "node-script",
          args: ["ls", "--json"],
          baseEnv: { PATH: "/usr/bin" },
        }),
      ).toEqual({
        command: "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
        args: [
          "--disable-warning=DEP0040",
          "/Applications/PolyHive.app/Contents/Resources/app.asar/dist/daemon/node-entrypoint-runner.js",
          "node-script",
          "/tmp/polyhive-cli.js",
          "ls",
          "--json",
        ],
        env: {
          PATH: "/usr/bin",
          ELECTRON_RUN_AS_NODE: "1",
          NODE_ENV: "production",
        },
      });
    });

    it("uses the entrypoint directly in development", () => {
      expect(
        createNodeEntrypointInvocation({
          execPath: "/opt/homebrew/bin/electron",
          isPackaged: false,
          packagedRunnerPath: null,
          entrypoint: CLI_ENTRYPOINT,
          argvMode: "node-script",
          args: ["ls"],
          baseEnv: { PATH: "/usr/bin" },
        }),
      ).toEqual({
        command: "/opt/homebrew/bin/electron",
        args: ["--import", "tsx", "/tmp/polyhive-cli.js", "ls"],
        env: {
          PATH: "/usr/bin",
          ELECTRON_RUN_AS_NODE: "1",
        },
      });
    });

    it("forces packaged launches to production even when NODE_ENV is inherited as development", () => {
      expect(
        createNodeEntrypointInvocation({
          execPath: "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
          isPackaged: true,
          packagedRunnerPath:
            "/Applications/PolyHive.app/Contents/Resources/app.asar/dist/daemon/node-entrypoint-runner.js",
          entrypoint: CLI_ENTRYPOINT,
          argvMode: "node-script",
          args: [],
          baseEnv: { PATH: "/usr/bin", NODE_ENV: "development" },
        }).env,
      ).toMatchObject({
        PATH: "/usr/bin",
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: "production",
      });
    });

    it("keeps node-style argv for packaged script entrypoints", () => {
      expect(
        createNodeEntrypointInvocation({
          execPath: "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
          isPackaged: true,
          packagedRunnerPath:
            "/Applications/PolyHive.app/Contents/Resources/app.asar/dist/daemon/node-entrypoint-runner.js",
          entrypoint: CLI_ENTRYPOINT,
          argvMode: "node-script",
          args: ["--dev"],
          baseEnv: { PATH: "/usr/bin" },
        }),
      ).toEqual({
        command: "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
        args: [
          "--disable-warning=DEP0040",
          "/Applications/PolyHive.app/Contents/Resources/app.asar/dist/daemon/node-entrypoint-runner.js",
          "node-script",
          "/tmp/polyhive-cli.js",
          "--dev",
        ],
        env: {
          PATH: "/usr/bin",
          ELECTRON_RUN_AS_NODE: "1",
          NODE_ENV: "production",
        },
      });
    });
  });
});
