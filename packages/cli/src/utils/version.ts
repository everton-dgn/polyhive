import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type CliPackageJson = {
  version?: unknown;
};

export function resolveCliVersion(): string {
  const packageJson = require("../../package.json") as CliPackageJson;
  if (typeof packageJson.version === "string" && packageJson.version.trim().length > 0) {
    return packageJson.version.trim();
  }
  throw new Error("Unable to resolve polyhive version from package.json.");
}

export function resolveCliVersionOrUnknown(): string {
  try {
    return resolveCliVersion();
  } catch {
    return "unknown";
  }
}

let cachedCliVersion: string | null | undefined;

export function getCliVersionOrNull(): string | null {
  if (cachedCliVersion !== undefined) return cachedCliVersion;
  try {
    cachedCliVersion = resolveCliVersion();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[polyhive-cli] Could not resolve CLI version: ${message}. The daemon may filter out non-legacy providers.`,
    );
    cachedCliVersion = null;
  }
  return cachedCliVersion;
}
