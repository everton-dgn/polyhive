import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { GITHUB_RELEASES_API } from "./fork-identity";
import { getGitHubHeaders } from "./github";
import websitePackage from "../package.json";

interface GitHubAsset {
  name: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
  prerelease: boolean;
  draft: boolean;
}

const REQUIRED_ASSET_PATTERNS = [
  /Paseo-.*-arm64\.dmg$/, // Mac Apple Silicon
];

function hasRequiredAssets(release: GitHubRelease): boolean {
  return REQUIRED_ASSET_PATTERNS.every((pattern) =>
    release.assets.some((asset) => pattern.test(asset.name)),
  );
}

function versionFromTag(tag: string): string {
  return tag.replace(/^v/, "");
}

const GITHUB_RELEASES_URL = `${GITHUB_RELEASES_API}?per_page=10`;

async function fetchLatestReadyRelease(): Promise<string> {
  const fallback = websitePackage.version.replace(/-.*$/, "");

  try {
    const res = await fetch(GITHUB_RELEASES_URL, { headers: getGitHubHeaders() });
    if (!res.ok) return fallback;

    const releases = (await res.json()) as GitHubRelease[];
    const ready = releases.find((r) => !r.prerelease && !r.draft && hasRequiredAssets(r));
    return ready ? versionFromTag(ready.tag_name) : fallback;
  } catch {
    return fallback;
  }
}

export const getLatestRelease = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    const version = await fetchLatestReadyRelease();
    return { version };
  });
