#!/usr/bin/env npx tsx

import assert from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getDaemonHost,
  normalizeDaemonHost,
  resolveDaemonTarget,
  resolveDefaultDaemonHosts,
} from "../src/utils/client.js";

console.log("=== CLI IPC Target Helpers ===\n");

{
  console.log("Test 1: unix hosts resolve to ws+unix URLs");
  const target = resolveDaemonTarget("unix:///tmp/polyhive.sock");
  assert.deepStrictEqual(target, {
    type: "ipc",
    url: "ws+unix:///tmp/polyhive.sock:/ws",
    socketPath: "/tmp/polyhive.sock",
  });
  console.log("✓ unix hosts resolve to ws+unix URLs\n");
}

{
  console.log("Test 3: local unix socket paths normalize into IPC daemon targets");
  assert.strictEqual(normalizeDaemonHost("/tmp/polyhive.sock"), "unix:///tmp/polyhive.sock");
  console.log("✓ local unix socket paths normalize into IPC daemon targets\n");
}

{
  console.log("Test 4: default host resolution tries local IPC first, then localhost fallback");
  const polyhiveHome = mkdtempSync(path.join(os.tmpdir(), "polyhive-client-targets-"));
  try {
    mkdirSync(polyhiveHome, { recursive: true });
    writeFileSync(
      path.join(polyhiveHome, "polyhive.pid"),
      JSON.stringify({ pid: process.pid, listen: "/tmp/polyhive-from-pid.sock" }),
    );
    assert.deepStrictEqual(resolveDefaultDaemonHosts({ POLYHIVE_HOME: polyhiveHome }), [
      "unix:///tmp/polyhive-from-pid.sock",
      "localhost:6767",
    ]);
    const previousHome = process.env.POLYHIVE_HOME;
    const previousHost = process.env.POLYHIVE_HOST;
    process.env.POLYHIVE_HOME = polyhiveHome;
    delete process.env.POLYHIVE_HOST;
    assert.strictEqual(getDaemonHost(), "unix:///tmp/polyhive-from-pid.sock");
    if (previousHome === undefined) delete process.env.POLYHIVE_HOME;
    else process.env.POLYHIVE_HOME = previousHome;
    if (previousHost === undefined) delete process.env.POLYHIVE_HOST;
    else process.env.POLYHIVE_HOST = previousHost;
  } finally {
    rmSync(polyhiveHome, { recursive: true, force: true });
  }
  console.log("✓ default host resolution tries local IPC first, then localhost fallback\n");
}

{
  console.log("Test 5: configured TCP host is preserved before the localhost fallback");
  const polyhiveHome = mkdtempSync(path.join(os.tmpdir(), "polyhive-client-targets-tcp-"));
  try {
    assert.deepStrictEqual(
      resolveDefaultDaemonHosts({
        POLYHIVE_HOME: polyhiveHome,
        POLYHIVE_LISTEN: "127.0.0.1:7777",
      }),
      ["127.0.0.1:7777", "localhost:6767"],
    );
  } finally {
    rmSync(polyhiveHome, { recursive: true, force: true });
  }
  console.log("✓ configured TCP host is preserved before the localhost fallback\n");
}

{
  console.log("Test 6: local IPC still takes priority over configured TCP hosts");
  const polyhiveHome = mkdtempSync(path.join(os.tmpdir(), "polyhive-client-targets-order-"));
  try {
    mkdirSync(polyhiveHome, { recursive: true });
    writeFileSync(
      path.join(polyhiveHome, "polyhive.pid"),
      JSON.stringify({ pid: process.pid, listen: "/tmp/polyhive-priority.sock" }),
    );
    assert.deepStrictEqual(
      resolveDefaultDaemonHosts({
        POLYHIVE_HOME: polyhiveHome,
        POLYHIVE_LISTEN: "127.0.0.1:7777",
      }),
      ["unix:///tmp/polyhive-priority.sock", "127.0.0.1:7777", "localhost:6767"],
    );
  } finally {
    rmSync(polyhiveHome, { recursive: true, force: true });
  }
  console.log("✓ local IPC still takes priority over configured TCP hosts\n");
}

console.log("=== All CLI IPC target tests passed ===");
