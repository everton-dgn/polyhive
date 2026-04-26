import { execFile, spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface ExecCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  encoding?: BufferEncoding;
  timeout?: number;
  maxBuffer?: number;
}

interface ExecCommandResult {
  stdout: string;
  stderr: string;
}

export function spawnProcess(
  command: string,
  args: string[],
  options?: SpawnOptions,
): ChildProcess {
  return spawn(command, args, {
    ...options,
    shell: options?.shell ?? false,
  });
}

export async function execCommand(
  command: string,
  args: string[],
  options?: ExecCommandOptions,
): Promise<ExecCommandResult> {
  return execFileAsync(command, args, {
    cwd: options?.cwd,
    env: options?.env,
    encoding: options?.encoding ?? "utf8",
    timeout: options?.timeout,
    maxBuffer: options?.maxBuffer,
  }) as Promise<ExecCommandResult>;
}

export function platformShell(): { command: string; flag: string[] } {
  return { command: "/bin/sh", flag: ["-lc"] };
}

export function platformBash(): { command: string; flag: string[] } {
  return { command: "/bin/bash", flag: ["-lc"] };
}
