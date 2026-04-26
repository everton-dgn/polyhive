const DEFAULT_SITE_HOST = "https://polyhive.vercel.app";
const DEFAULT_GITHUB_REPO = "everton-dgn/polyhive";
const DEFAULT_WEB_APP_URL = "https://polyhive-app.vercel.app";

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export const SITE_HOST = readEnv("EXPO_PUBLIC_PASEO_SITE_HOST") ?? DEFAULT_SITE_HOST;
export const GITHUB_REPO = readEnv("EXPO_PUBLIC_PASEO_GITHUB_REPO") ?? DEFAULT_GITHUB_REPO;
export const WEB_APP_URL = readEnv("EXPO_PUBLIC_PASEO_WEB_APP_URL") ?? DEFAULT_WEB_APP_URL;

export const DOCS_BASE_URL = `${SITE_HOST}/docs`;
export const DOCS_CONFIGURATION_URL = `${DOCS_BASE_URL}/configuration`;
export const DOCS_CLI_URL = `${DOCS_BASE_URL}/cli`;
export const DOCS_SKILLS_URL = `${DOCS_BASE_URL}/skills`;
export const GITHUB_WEB_BASE = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_ISSUES_URL = `${GITHUB_WEB_BASE}/issues/new`;
export const CHANGELOG_URL = `${SITE_HOST}/changelog`;
