import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/components/landing-page";
import { pageMeta } from "~/meta";

export const Route = createFileRoute("/codex")({
  head: () => ({
    meta: pageMeta(
      "Codex Web - Run Codex from your browser | PolyHive",
      "Run OpenAI Codex on your Mac and control it from a browser. Kick off agents, monitor progress, and ship code while your code stays on your machine.",
    ),
  }),
  component: CodexPage,
});

function CodexPage() {
  return (
    <LandingPage
      title="Run Codex from your browser"
      subtitle="Kick off Codex agents on your Mac from the web client. Check progress, review output, and follow up without staying in the terminal."
    />
  );
}
