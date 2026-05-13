import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { resolvePolyHiveHome } from "./polyhive-home.js";
import { PRIVATE_DIRECTORY_MODE } from "./private-files.js";

const MODE_MASK = 0o777;

function modeOf(filePath: string): number {
  return statSync(filePath).mode & MODE_MASK;
}

describe.skipIf(process.platform === "win32")("resolvePolyHiveHome permissions", () => {
  test("creates POLYHIVE_HOME with private permissions", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "polyhive-home-parent-"));
    const polyhiveHome = path.join(parent, "home");
    try {
      expect(resolvePolyHiveHome({ POLYHIVE_HOME: polyhiveHome })).toBe(polyhiveHome);
      expect(modeOf(polyhiveHome)).toBe(PRIVATE_DIRECTORY_MODE);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});
