import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

type Which = (command: string, options: { all: true }) => Promise<string[]>;

const require = createRequire(import.meta.url);
const which = require("which") as Which;
const PROBE_TIMEOUT_MS = 2000;

function hasPathSeparator(value: string): boolean {
  return value.includes("/");
}

async function enumerateCandidates(name: string): Promise<string[]> {
  let candidates: string[];
  try {
    candidates = await which(name, { all: true });
  } catch (error) {
    // `which` throws ENOENT when the command is absent from PATH.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }
    seen.add(candidate);
    return true;
  });
}

async function probeExecutable(executablePath: string): Promise<boolean> {
  return await new Promise((resolve) => {
    let settled = false;
    let started = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (result: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      resolve(result);
    };

    let child: ChildProcess;
    try {
      child = spawn(executablePath, ["--version"], {
        stdio: "ignore",
      });
    } catch {
      settle(false);
      return;
    }

    timer = setTimeout(() => {
      if (started) {
        child.kill();
        settle(true);
        return;
      }
      settle(false);
    }, PROBE_TIMEOUT_MS);
    timer.unref?.();

    child.once("spawn", () => {
      started = true;
    });
    child.once("error", () => {
      // ENOENT/EACCES/EPERM/UNKNOWN here means the OS could not start the candidate.
      settle(started);
    });
    child.once("exit", () => {
      settle(started);
    });
  });
}

/**
 * Check a literal executable path. PATH search is handled by findExecutable().
 */
export function executableExists(
  executablePath: string,
  exists: typeof existsSync = existsSync,
): string | null {
  if (exists(executablePath)) return executablePath;
  return null;
}

export async function findExecutable(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  if (hasPathSeparator(trimmed)) {
    return (await probeExecutable(trimmed)) ? trimmed : null;
  }

  const candidates = await enumerateCandidates(trimmed);
  for (const candidate of candidates) {
    if (await probeExecutable(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function isCommandAvailable(command: string): Promise<boolean> {
  return (await findExecutable(command)) !== null;
}
