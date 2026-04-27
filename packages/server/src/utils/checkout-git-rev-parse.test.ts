import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "polyhive-checkout-git-"));
  tempDirs.push(dir);
  return dir;
}

function gitCanonicalize(dir: string): string {
  return execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
}

describe("checkout git rev-parse path handling", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("resolves the worktree root from a nested real git checkout", async () => {
    const repoRoot = makeTempDir();
    const nested = join(repoRoot, "packages", "server", "src");
    mkdirSync(nested, { recursive: true });
    execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });

    const { getCheckoutStatus } = await import("./checkout-git.js");
    const status = await getCheckoutStatus(nested);

    expect(status.isGit).toBe(true);
    if (!status.isGit) {
      throw new Error("Expected nested checkout to be detected as a git repository");
    }
    expect(status.repoRoot).toBe(gitCanonicalize(repoRoot));
  });
});
