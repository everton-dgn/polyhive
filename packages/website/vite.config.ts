import path from "node:path";
import { defineConfig, type UserConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoRoot = path.resolve(__dirname, "../..");
const siteHost = process.env.VITE_POLYHIVE_SITE_HOST?.trim() || "https://polyhive.vercel.app";
const sitemapPages = [
  "/",
  "/changelog",
  "/claude-code",
  "/codex",
  "/docs",
  "/download",
  "/opencode",
  "/privacy",
  "/docs/best-practices",
  "/docs/cli",
  "/docs/configuration",
  "/docs/providers",
  "/docs/skills",
  "/docs/security",
  "/docs/updates",
  "/docs/voice",
  "/docs/worktrees",
].map((routePath) => ({
  path: routePath,
}));

export default defineConfig((): UserConfig => {
  return {
    server: {
      port: 8083,
      fs: {
        allow: [repoRoot],
      },
    },
    plugins: [
      tsConfigPaths(),
      tanstackStart({
        router: {
          quoteStyle: "double",
          semicolons: true,
        },
        pages: sitemapPages,
        sitemap: {
          host: siteHost,
        },
        prerender: {
          enabled: true,
          crawlLinks: true,
          autoStaticPathsDiscovery: true,
        },
      }),
      nitro({
        preset: "vercel",
      }),
      react(),
      tailwindcss(),
    ],
  };
});
