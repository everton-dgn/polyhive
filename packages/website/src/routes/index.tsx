import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/components/landing-page";
import { pageMeta } from "~/meta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMeta(
      "Paseo - Run Claude Code, Codex, and OpenCode from your Mac",
      "A self-hosted daemon for Claude Code, Codex, and OpenCode. Agents run on your Mac with your full dev environment. Connect from the macOS app, browser, phone browser, or terminal.",
    ),
  }),
  component: Home,
});

function Home() {
  return (
    <LandingPage
      title={
        <>
          Orchestrate coding agents
          <br />
          from your Mac and browser
        </>
      }
      subtitle="Run coding agents on your Mac from the macOS app, any browser, or the terminal. Self-hosted, multi-provider, open source."
    />
  );
}
