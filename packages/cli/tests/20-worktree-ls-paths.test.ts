#!/usr/bin/env npx tsx

import assert from "node:assert";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  resolvePolyHiveHomePath,
  resolvePolyHiveWorktreesDir,
} from "../src/commands/worktree/ls.js";

console.log("=== Worktree LS Path Helper Tests ===\n");

const originalPolyHiveHome = process.env.POLYHIVE_HOME;

try {
  {
    console.log("Test 1: resolves explicit POLYHIVE_HOME when set");
    process.env.POLYHIVE_HOME = "/tmp/polyhive-explicit-home";

    assert.strictEqual(resolvePolyHiveHomePath(), "/tmp/polyhive-explicit-home");
    assert.strictEqual(resolvePolyHiveWorktreesDir(), "/tmp/polyhive-explicit-home/worktrees");
    console.log("\u2713 explicit POLYHIVE_HOME is respected\n");
  }

  {
    console.log("Test 2: falls back to homedir/.polyhive when POLYHIVE_HOME is unset");
    delete process.env.POLYHIVE_HOME;

    assert.strictEqual(resolvePolyHiveHomePath(), join(homedir(), ".polyhive"));
    assert.strictEqual(resolvePolyHiveWorktreesDir(), join(homedir(), ".polyhive", "worktrees"));
    console.log("\u2713 fallback home path is derived from os.homedir()\n");
  }
} finally {
  if (originalPolyHiveHome === undefined) {
    delete process.env.POLYHIVE_HOME;
  } else {
    process.env.POLYHIVE_HOME = originalPolyHiveHome;
  }
}

console.log("=== All worktree ls path helper tests passed ===");
