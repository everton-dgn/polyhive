import { execCommand } from "@evertondgn/polyhive-server";

export interface NodePathFromPidResult {
  nodePath: string | null;
  error?: string;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function resolveNodePathFromPidUnix(pid: number): Promise<NodePathFromPidResult> {
  try {
    const { stdout } = await execCommand("ps", ["-o", "comm=", "-p", String(pid)]);
    const resolved = stdout.trim();
    return resolved
      ? { nodePath: resolved }
      : { nodePath: null, error: "ps returned an empty command path" };
  } catch (error) {
    return { nodePath: null, error: `ps failed: ${normalizeError(error)}` };
  }
}

export async function resolveNodePathFromPid(pid: number): Promise<NodePathFromPidResult> {
  return resolveNodePathFromPidUnix(pid);
}
