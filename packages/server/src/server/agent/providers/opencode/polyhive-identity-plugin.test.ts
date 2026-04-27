import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  buildOpenCodeServerConfig,
  installIdentityPlugin,
  POLYHIVE_IDENTITY_PLUGIN_FILE,
  POLYHIVE_IDENTITY_PLUGIN_ID,
  POLYHIVE_IDENTITY_PLUGIN_SOURCE,
  POLYHIVE_SESSION_MAP_ENV_VAR,
} from "./polyhive-identity-plugin.js";

interface PluginHooks {
  "shell.env"?: (
    input: { cwd?: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> },
  ) => Promise<void>;
}

type PluginServer = () => Promise<PluginHooks>;
type PluginModuleShape = {
  id: string;
  server: PluginServer;
  default: { id: string; server: PluginServer };
};

async function loadPluginModule(filePath: string): Promise<PluginModuleShape> {
  const moduleUrl = `${pathToFileURL(filePath).href}?v=${Math.random().toString(36).slice(2)}`;
  return (await import(moduleUrl)) as PluginModuleShape;
}

async function loadPluginHooks(filePath: string): Promise<PluginHooks> {
  const mod = await loadPluginModule(filePath);
  return mod.server();
}

describe("polyhive-identity-plugin installation", () => {
  let tmpHome: string;

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), "polyhive-plugin-install-"));
  });

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true });
  });

  test("writes source to $POLYHIVE_HOME/polyhive-identity-plugin.mjs", () => {
    const result = installIdentityPlugin(tmpHome);
    expect(result.filePath).toBe(join(tmpHome, POLYHIVE_IDENTITY_PLUGIN_FILE));
    expect(readFileSync(result.filePath, "utf8")).toBe(POLYHIVE_IDENTITY_PLUGIN_SOURCE);
    expect(result.fileUrl.startsWith("file://")).toBe(true);
  });

  test("skips write when existing file is byte-identical", () => {
    const { filePath } = installIdentityPlugin(tmpHome);
    const statBefore = readFileSync(filePath, "utf8");
    const mtimeBefore = statSync(filePath).mtimeMs;

    installIdentityPlugin(tmpHome);
    const mtimeAfter = statSync(filePath).mtimeMs;
    expect(readFileSync(filePath, "utf8")).toBe(statBefore);
    expect(mtimeAfter).toBe(mtimeBefore);
  });

  test("plugin module exports id and server in PluginModule shape", async () => {
    const { filePath } = installIdentityPlugin(tmpHome);
    const mod = await loadPluginModule(filePath);
    expect(mod.id).toBe(POLYHIVE_IDENTITY_PLUGIN_ID);
    expect(typeof mod.server).toBe("function");
    expect(mod.default).toEqual({ id: POLYHIVE_IDENTITY_PLUGIN_ID, server: mod.server });
  });

  test("rewrites file when content differs", () => {
    const { filePath } = installIdentityPlugin(tmpHome);
    writeFileSync(filePath, "// stale content", "utf8");
    installIdentityPlugin(tmpHome);
    expect(readFileSync(filePath, "utf8")).toBe(POLYHIVE_IDENTITY_PLUGIN_SOURCE);
  });
});

describe("polyhive-identity-plugin shell.env hook", () => {
  let tmpHome: string;
  let sessionMapPath: string;
  let previousEnvValue: string | undefined;

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), "polyhive-plugin-run-"));
    sessionMapPath = join(tmpHome, "session-map.json");
    previousEnvValue = process.env[POLYHIVE_SESSION_MAP_ENV_VAR];
    process.env[POLYHIVE_SESSION_MAP_ENV_VAR] = sessionMapPath;
  });

  afterEach(() => {
    if (previousEnvValue === undefined) {
      delete process.env[POLYHIVE_SESSION_MAP_ENV_VAR];
    } else {
      process.env[POLYHIVE_SESSION_MAP_ENV_VAR] = previousEnvValue;
    }
    rmSync(tmpHome, { recursive: true, force: true });
  });

  test("injects POLYHIVE_AGENT_ID for known sessionID", async () => {
    writeFileSync(sessionMapPath, JSON.stringify({ "session-a": "agent-a" }), "utf8");
    const { filePath } = installIdentityPlugin(tmpHome);
    const hooks = await loadPluginHooks(filePath);

    const output: { env: Record<string, string> } = { env: {} };
    await hooks["shell.env"]?.({ cwd: "/tmp", sessionID: "session-a" }, output);
    expect(output.env.POLYHIVE_AGENT_ID).toBe("agent-a");
  });

  test("does not inject when sessionID is unknown", async () => {
    writeFileSync(sessionMapPath, JSON.stringify({ "session-a": "agent-a" }), "utf8");
    const { filePath } = installIdentityPlugin(tmpHome);
    const hooks = await loadPluginHooks(filePath);

    const output: { env: Record<string, string> } = { env: {} };
    await hooks["shell.env"]?.({ cwd: "/tmp", sessionID: "session-other" }, output);
    expect(output.env.POLYHIVE_AGENT_ID).toBeUndefined();
  });

  test("does not inject when sessionID is absent", async () => {
    writeFileSync(sessionMapPath, JSON.stringify({ "session-a": "agent-a" }), "utf8");
    const { filePath } = installIdentityPlugin(tmpHome);
    const hooks = await loadPluginHooks(filePath);

    const output: { env: Record<string, string> } = { env: {} };
    await hooks["shell.env"]?.({ cwd: "/tmp" }, output);
    expect(output.env.POLYHIVE_AGENT_ID).toBeUndefined();
  });

  test("tolerates missing session map file", async () => {
    const { filePath } = installIdentityPlugin(tmpHome);
    const hooks = await loadPluginHooks(filePath);

    const output: { env: Record<string, string> } = { env: {} };
    await hooks["shell.env"]?.({ cwd: "/tmp", sessionID: "session-any" }, output);
    expect(output.env.POLYHIVE_AGENT_ID).toBeUndefined();
  });

  test("tolerates malformed session map json", async () => {
    writeFileSync(sessionMapPath, "{not json]", "utf8");
    const { filePath } = installIdentityPlugin(tmpHome);
    const hooks = await loadPluginHooks(filePath);

    const output: { env: Record<string, string> } = { env: {} };
    await hooks["shell.env"]?.({ cwd: "/tmp", sessionID: "session-a" }, output);
    expect(output.env.POLYHIVE_AGENT_ID).toBeUndefined();
  });
});

describe("buildOpenCodeServerConfig", () => {
  test("emits only the plugin URL, leaving project/global config to OpenCode merge", () => {
    const config = buildOpenCodeServerConfig("file:///tmp/polyhive-identity-plugin.mjs");
    expect(config).toEqual({ plugin: ["file:///tmp/polyhive-identity-plugin.mjs"] });
  });

  test("does not include unrelated keys that would overwrite project/global config", () => {
    const config = buildOpenCodeServerConfig("file:///x.mjs") as Record<string, unknown>;
    expect(Object.keys(config)).toEqual(["plugin"]);
  });
});
