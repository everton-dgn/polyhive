const DEFAULT_SITE_HOST = "https://polyhive.vercel.app";
const DEFAULT_GITHUB_REPO = "everton-dgn/polyhive";
const DEFAULT_WEB_APP_URL = "https://polyhive-app.vercel.app";
const DEFAULT_CLI_START_COMMAND = "paseo";

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requireForkEnv(key: string, fallback: string): string {
  const value = readEnv(key);
  if (value) return value;
  if (import.meta.env.PROD) {
    throw new Error(
      `[fork-identity] Missing required env var ${key} in production build. ` +
        `Configure it in Vercel project settings.`,
    );
  }
  console.warn(`[fork-identity] ${key} not set; using dev fallback ${fallback}`);
  return fallback;
}

export const SITE_HOST = requireForkEnv("VITE_PASEO_SITE_HOST", DEFAULT_SITE_HOST);
export const GITHUB_REPO = requireForkEnv("VITE_PASEO_GITHUB_REPO", DEFAULT_GITHUB_REPO);
export const WEB_APP_URL = requireForkEnv("VITE_PASEO_WEB_APP_URL", DEFAULT_WEB_APP_URL);
export const HOMEBREW_CASK_COMMAND = readEnv("VITE_PASEO_HOMEBREW_CASK_COMMAND") ?? "";
export const CLI_INSTALL_COMMAND = readEnv("VITE_PASEO_CLI_INSTALL_COMMAND") ?? "";
export const CLI_START_COMMAND =
  readEnv("VITE_PASEO_CLI_START_COMMAND") ?? DEFAULT_CLI_START_COMMAND;
export const CLI_HEADLESS_COMMAND = CLI_INSTALL_COMMAND
  ? `${CLI_INSTALL_COMMAND} && ${CLI_START_COMMAND}`
  : "";

export const GITHUB_WEB_BASE = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_API_REPO_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
export const GITHUB_RELEASES_API = `${GITHUB_API_REPO_URL}/releases`;
export const RELEASES_DOWNLOAD_BASE = `${GITHUB_WEB_BASE}/releases/download`;
