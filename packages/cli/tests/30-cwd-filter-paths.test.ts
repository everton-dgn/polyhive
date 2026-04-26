#!/usr/bin/env npx tsx

/**
 * CWD Filter Path Tests
 *
 * Tests that cwd filtering in agent commands works correctly with Unix-style paths.
 */

import assert from "node:assert";
import { isSameOrDescendantPath } from "../src/utils/paths.ts";

console.log("=== CWD Filter Path Tests ===\n");

// Test 1: Unix exact match
{
  console.log("Test 1: Unix exact match");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project", "/home/user/project"),
    true,
    "exact Unix paths should match",
  );
  console.log("✓ Unix exact match\n");
}

// Test 2: Unix descendant match
{
  console.log("Test 2: Unix descendant match");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project", "/home/user/project/src"),
    true,
    "Unix descendant should match",
  );
  console.log("✓ Unix descendant match\n");
}

// Test 3: Unix non-match (sibling)
{
  console.log("Test 3: Unix non-match (sibling)");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project", "/home/user/other"),
    false,
    "sibling directories should not match",
  );
  console.log("✓ Unix non-match (sibling)\n");
}

// Test 4: Unix prefix overlap (project vs project2)
{
  console.log("Test 4: Unix prefix overlap (project vs project2)");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project", "/home/user/project2"),
    false,
    "prefix overlap without separator should not match",
  );
  console.log("✓ Unix prefix overlap\n");
}

// Test 5: Unix trailing slash on base
{
  console.log("Test 5: Unix trailing slash on base");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project/", "/home/user/project/src"),
    true,
    "trailing slash on base should still match descendants",
  );
  console.log("✓ Unix trailing slash on base\n");
}

// Test 6: Unix trailing slash on candidate
{
  console.log("Test 6: Unix trailing slash on candidate");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project", "/home/user/project/"),
    true,
    "trailing slash on candidate should match as same dir",
  );
  console.log("✓ Unix trailing slash on candidate\n");
}

// Test 7: Parent should not match
{
  console.log("Test 7: Parent should not match");
  assert.strictEqual(
    isSameOrDescendantPath("/home/user/project/src", "/home/user/project"),
    false,
    "parent directory should not match (only same-or-descendant)",
  );
  console.log("✓ Parent should not match\n");
}

console.log("=== All CWD filter path tests passed ===");
