import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/components/landing-page";
import { pageMeta } from "~/meta";

export const Route = createFileRoute("/claude-code")({
  head: () => ({
    meta: pageMeta(
      "Claude Code Web - Ship from your browser | PolyHive",
      "Run Claude Code on your Mac and control it from a browser. Launch agents, check progress, review diffs, and merge while your code stays on your machine.",
    ),
  }),
  component: ClaudeCodePage,
});

function ClaudeCodePage() {
  return (
    <LandingPage
      title="Ship with Claude Code from your browser"
      subtitle="Launch agents, check progress, and merge from the macOS app or a browser. Your Claude Code setup, your machine."
    />
  );
}
