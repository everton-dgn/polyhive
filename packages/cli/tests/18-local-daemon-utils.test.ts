#!/usr/bin/env npx tsx

/**
 * Phase 18: Local daemon utility tests.
 *
 * Tests pure helpers that do not require a running daemon.
 */

import assert from "node:assert";
import {
  buildChildEnv,
  buildRunnerArgs,
  resolveTcpHostFromListen,
} from "../src/commands/daemon/local-daemon.js";

console.log("=== Local Daemon Utility Helpers ===\n");

{
  console.log("Test 1: resolves numeric listen values to localhost host:port");
  assert.strictEqual(resolveTcpHostFromListen("6768"), "127.0.0.1:6768");
  assert.strictEqual(resolveTcpHostFromListen("  7777  "), "127.0.0.1:7777");
  console.log("✓ resolves numeric listen values\n");
}

{
  console.log("Test 2: preserves explicit host:port listen values");
  assert.strictEqual(resolveTcpHostFromListen("localhost:6768"), "localhost:6768");
  assert.strictEqual(resolveTcpHostFromListen("0.0.0.0:8080"), "0.0.0.0:8080");
  console.log("✓ preserves explicit host:port values\n");
}

{
  console.log("Test 3: rejects unix socket listen values");
  assert.strictEqual(resolveTcpHostFromListen("/tmp/polyhive.sock"), null);
  assert.strictEqual(resolveTcpHostFromListen("unix:///tmp/polyhive.sock"), null);
  assert.strictEqual(resolveTcpHostFromListen("pipe://\\\\.\\pipe\\polyhive-managed-test"), null);
  assert.strictEqual(resolveTcpHostFromListen("\\\\.\\pipe\\polyhive-managed-test"), null);
  console.log("✓ rejects unix socket listen values\n");
}

{
  console.log("Test 4: rejects empty and non-host listen values");
  assert.strictEqual(resolveTcpHostFromListen(""), null);
  assert.strictEqual(resolveTcpHostFromListen("   "), null);
  assert.strictEqual(resolveTcpHostFromListen("localhost"), null);
  console.log("✓ rejects empty and non-host listen values\n");
}

{
  console.log("Test 5: relay TLS flag maps to runner args");
  assert.deepStrictEqual(buildRunnerArgs({ relayUseTls: true }), ["--relay-use-tls"]);
  assert.deepStrictEqual(buildRunnerArgs({}), []);
  assert.deepStrictEqual(buildRunnerArgs({ relayUseTls: false }), []);
  console.log("✓ relay TLS flag maps to runner args\n");
}

{
  console.log("Test 6: relay TLS flag maps to child env");
  assert.strictEqual(buildChildEnv({ relayUseTls: true }).POLYHIVE_RELAY_USE_TLS, "true");
  console.log("✓ relay TLS flag maps to child env\n");
}

console.log("=== All local daemon utility tests passed ===");
