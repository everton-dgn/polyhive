import { createFileRoute } from "@tanstack/react-router";
import { GITHUB_WEB_BASE, WEB_APP_URL } from "~/fork-identity";
import { pageMeta } from "~/meta";

const WEB_APP_LABEL = WEB_APP_URL.replace(/^https?:\/\//, "");
const RELEASES_URL = `${GITHUB_WEB_BASE}/releases`;

export const Route = createFileRoute("/docs/updates")({
  head: () => ({
    meta: pageMeta(
      "Updates - Paseo Docs",
      "How to update the Paseo daemon, web client, and macOS app.",
    ),
  }),
  component: UpdatesDocs,
});

function UpdatesDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium font-title mb-4">Updates</h1>
        <p className="text-white/60 leading-relaxed">
          Keep your daemon and clients current to get the latest fixes and features.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Version compatibility</h2>
        <p className="text-white/60">
          For now, daemon and app versions should be kept in lockstep. If your daemon is version X,
          make sure your clients are also version X.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Update the daemon</h2>
        <p className="text-white/60">Install the latest CLI/daemon package globally:</p>
        <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm">
          <span className="text-muted-foreground select-none">$ </span>
          <span>npm install -g @getpaseo/cli@latest</span>
        </div>
        <p className="text-white/60">Then restart the daemon:</p>
        <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm">
          <span className="text-muted-foreground select-none">$ </span>
          <span>paseo daemon restart</span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Web app</h2>
        <p className="text-white/60">
          <a
            href={WEB_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            {WEB_APP_LABEL}
          </a>{" "}
          is always up to date. No manual update needed.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">macOS app</h2>
        <p className="text-white/60">
          Download the latest macOS build from the GitHub releases page and install it over your
          current version.
        </p>
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/80"
        >
          Paseo releases
        </a>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Mobile browsers</h2>
        <p className="text-white/60">
          Open the web app from Safari or Chrome on your phone. It stays in sync with the daemon
          automatically, so there is nothing to update on the device.
        </p>
      </section>
    </div>
  );
}
