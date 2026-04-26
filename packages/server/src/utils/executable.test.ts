import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { executableExists, findExecutable } from "./executable.js";

const originalEnv = {
  PATH: process.env.PATH,
  PATHEXT: process.env.PATHEXT,
};
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "paseo-executable-test-"));
  tempDirs.push(dir);
  return dir;
}

function prependPath(...dirs: string[]): void {
  process.env.PATH = [...dirs, originalEnv.PATH].filter(Boolean).join(path.delimiter);
}

function writeExecutable(filePath: string, content: string): string {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
  return filePath;
}

function writeInvokableFixture(dir: string, name: string): string {
  return writeExecutable(path.join(dir, name), "#!/bin/sh\necho 0.1\n");
}

function writeBrokenAbsoluteFixture(dir: string): string {
  const filePath = path.join(dir, "broken");
  writeFileSync(filePath, "not executable");
  chmodSync(filePath, 0o644);
  return filePath;
}

afterEach(() => {
  process.env.PATH = originalEnv.PATH;
  process.env.PATHEXT = originalEnv.PATHEXT;
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("findExecutable", () => {
  test("finds an extensionless executable and skips an earlier non-executable candidate", async () => {
    const executableDir = makeTempDir();
    const nonExecutableDir = makeTempDir();
    const executable = writeExecutable(path.join(executableDir, "foo"), "#!/bin/sh\necho 0.1\n");
    const nonExecutable = path.join(nonExecutableDir, "foo");
    writeFileSync(nonExecutable, "#!/bin/sh\necho broken\n");
    chmodSync(nonExecutable, 0o644);
    prependPath(nonExecutableDir, executableDir);

    await expect(findExecutable("foo")).resolves.toBe(executable);
  });

  test("returns an invokable absolute path", async () => {
    const dir = makeTempDir();
    const fixture = writeInvokableFixture(dir, "absolute-ok");

    await expect(findExecutable(fixture)).resolves.toBe(fixture);
  });

  test("returns null for an absolute path that cannot spawn", async () => {
    const dir = makeTempDir();
    const fixture = writeBrokenAbsoluteFixture(dir);

    await expect(findExecutable(fixture)).resolves.toBeNull();
  });

  test("returns null when the command is not on PATH", async () => {
    const dir = makeTempDir();
    prependPath(dir);

    await expect(findExecutable("paseo-definitely-missing-command")).resolves.toBeNull();
  });
});

describe("executableExists", () => {
  test("returns the path when it already exists", () => {
    const exists = (candidate: string) => candidate === "/usr/local/bin/codex";

    expect(executableExists("/usr/local/bin/codex", exists)).toBe("/usr/local/bin/codex");
  });

  test("returns null when no matching path exists", () => {
    expect(executableExists("/missing/codex", () => false)).toBeNull();
  });
});
