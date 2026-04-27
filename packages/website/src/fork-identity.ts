const DEFAULT_SITE_HOST = "https://polyhive.vercel.app";
const DEFAULT_GITHUB_REPO = "everton-dgn/polyhive";
const DEFAULT_WEB_APP_URL = "https://polyhive-app.vercel.app";
const DEFAULT_CLI_INSTALL_COMMAND = "npm install -g polyhive";
const DEFAULT_CLI_START_COMMAND = "polyhive";

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function requireForkEnv(key: string, fallback: string): string {
  const value = readEnv(key);
  if (value) return value;
  console.warn(`[fork-identity] ${key} not set; using fallback ${fallback}`);
  return fallback;
}

export const SITE_HOST = requireForkEnv("VITE_POLYHIVE_SITE_HOST", DEFAULT_SITE_HOST);
export const GITHUB_REPO = requireForkEnv("VITE_POLYHIVE_GITHUB_REPO", DEFAULT_GITHUB_REPO);
export const WEB_APP_URL = requireForkEnv("VITE_POLYHIVE_WEB_APP_URL", DEFAULT_WEB_APP_URL);
export const HOMEBREW_CASK_COMMAND = readEnv("VITE_POLYHIVE_HOMEBREW_CASK_COMMAND") ?? "";
export const CLI_INSTALL_COMMAND =
  readEnv("VITE_POLYHIVE_CLI_INSTALL_COMMAND") ?? DEFAULT_CLI_INSTALL_COMMAND;
export const CLI_START_COMMAND =
  readEnv("VITE_POLYHIVE_CLI_START_COMMAND") ?? DEFAULT_CLI_START_COMMAND;
export const CLI_HEADLESS_COMMAND = CLI_INSTALL_COMMAND
  ? `${CLI_INSTALL_COMMAND} && ${CLI_START_COMMAND}`
  : "";

export const GITHUB_WEB_BASE = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_API_REPO_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
export const GITHUB_RELEASES_API = `${GITHUB_API_REPO_URL}/releases`;
export const RELEASES_DOWNLOAD_BASE = `${GITHUB_WEB_BASE}/releases/download`;
