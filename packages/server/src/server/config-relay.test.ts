import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { loadConfig } from "./config.js";

const roots: string[] = [];

async function createPolyHiveHome(config: unknown): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "polyhive-config-relay-"));
  roots.push(root);
  const polyhiveHome = path.join(root, ".polyhive");
  await mkdir(polyhiveHome, { recursive: true });
  await writeFile(path.join(polyhiveHome, "config.json"), JSON.stringify(config, null, 2));
  return polyhiveHome;
}

describe("daemon relay config", () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  test("loads relay TLS from persisted config", async () => {
    const home = await createPolyHiveHome({
      daemon: {
        relay: {
          endpoint: "relay.example.com:443",
          useTls: true,
        },
      },
    });
    expect(loadConfig(home, { env: {} }).relayUseTls).toBe(true);
  });

  test("env POLYHIVE_RELAY_USE_TLS overrides persisted config", async () => {
    const home = await createPolyHiveHome({
      daemon: {
        relay: {
          endpoint: "relay.example.com:443",
          useTls: false,
        },
      },
    });
    expect(loadConfig(home, { env: { POLYHIVE_RELAY_USE_TLS: "true" } }).relayUseTls).toBe(true);
  });

  test("falls back to TLS for the default hosted relay endpoint", async () => {
    const home = await createPolyHiveHome({ daemon: { relay: {} } });
    expect(loadConfig(home, { env: {} }).relayUseTls).toBe(true);
  });

  test("defaults to non-TLS for a self-hosted relay without explicit useTls", async () => {
    const home = await createPolyHiveHome({
      daemon: {
        relay: {
          endpoint: "relay.example.com:8080",
        },
      },
    });
    expect(loadConfig(home, { env: {} }).relayUseTls).toBe(false);
  });
});
