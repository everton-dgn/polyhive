import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { GITHUB_API_REPO_URL } from "./fork-identity";
import { getGitHubHeaders } from "./github";

interface GitHubRepo {
  stargazers_count: number;
}

function formatStars(count: number): string {
  if (count < 1000) return String(count);
  const k = count / 1000;
  return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
}

async function fetchStarCount(): Promise<string> {
  try {
    const res = await fetch(GITHUB_API_REPO_URL, { headers: getGitHubHeaders() });
    if (!res.ok) return "";

    const repo = (await res.json()) as GitHubRepo;
    return formatStars(repo.stargazers_count);
  } catch {
    return "";
  }
}

export const getStarCount = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    const stars = await fetchStarCount();
    return { stars };
  });
