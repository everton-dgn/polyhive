import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/components/landing-page";
import { pageMeta } from "~/meta";

export const Route = createFileRoute("/opencode")({
  head: () => ({
    meta: pageMeta(
      "OpenCode Web - Code from your browser | PolyHive",
      "Run OpenCode on your Mac and control it from a browser. Launch agents, watch them work, and keep your code local.",
    ),
  }),
  component: OpenCodePage,
});

function OpenCodePage() {
  return (
    <LandingPage
      title="Run OpenCode from your browser"
      subtitle="Launch agents, check on builds, and keep the same local setup. Same machine, browser-based control."
    />
  );
}
