import { createFileRoute } from "@tanstack/react-router";
import {
  CLI_INSTALL_COMMAND,
  CLI_START_COMMAND,
  GITHUB_WEB_BASE,
  SITE_HOST,
} from "~/fork-identity";
import { pageMeta } from "~/meta";

const DOWNLOAD_URL = `${SITE_HOST}/download`;
const DOWNLOAD_LABEL = DOWNLOAD_URL.replace(/^https?:\/\//, "");
const RELEASES_URL = `${GITHUB_WEB_BASE}/releases`;

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: pageMeta(
      "Getting Started - PolyHive Docs",
      "Learn how to set up and use PolyHive to manage your coding agents from anywhere.",
    ),
  }),
  component: GettingStarted,
});

function GettingStarted() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium font-title mb-4">Getting Started</h1>
        <p className="text-white/60 leading-relaxed">
          {CLI_INSTALL_COMMAND
            ? "PolyHive has three main pieces: the daemon is the local macOS server that manages your agents, the web client runs in desktop and mobile browsers, and the CLI is the terminal interface that can also launch the daemon."
            : "PolyHive has two main packaged pieces in this fork: the macOS app bundles the local daemon that manages your agents, and the web client runs in desktop and mobile browsers."}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Prerequisites</h2>
        <p className="text-white/60">
          PolyHive manages existing agent CLIs. Install at least one agent and make sure it already
          works with your credentials before you set up PolyHive.
        </p>
        <ul className="text-white/60 space-y-2 list-disc list-inside">
          <li>
            <a
              href="https://docs.anthropic.com/en/docs/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/80"
            >
              Claude Code
            </a>
          </li>
          <li>
            <a
              href="https://github.com/openai/codex"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/80"
            >
              Codex
            </a>
          </li>
          <li>
            <a
              href="https://github.com/anomalyco/opencode"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/80"
            >
              OpenCode
            </a>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">macOS App</h2>
        <p className="text-white/60">
          Download the macOS app from{" "}
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            {DOWNLOAD_LABEL}
          </a>{" "}
          or the{" "}
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            GitHub releases page
          </a>
          . Open it and you're done.
        </p>
        {CLI_INSTALL_COMMAND ? (
          <p className="text-white/60">
            The macOS app bundles and manages its own daemon automatically, so you do not need a
            separate CLI install on that machine unless you want it.
          </p>
        ) : (
          <p className="text-white/60">
            The macOS app is the packaged daemon install path for this fork.
          </p>
        )}
        <p className="text-white/60">
          On first launch, you may briefly see a startup screen while the local server starts and
          the app connects to it. After that, connect from a phone browser by scanning the QR code
          in Settings if you want mobile-browser access.
        </p>
      </section>

      {CLI_INSTALL_COMMAND && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium">CLI / Headless Mac</h2>
          <p className="text-white/60">
            Use this path for headless Macs or remote macOS machines where you want the daemon
            running without the macOS app.
          </p>
          <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm">
            <span className="text-muted-foreground select-none">$ </span>
            <span>{CLI_INSTALL_COMMAND}</span>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm">
            <span className="text-muted-foreground select-none">$ </span>
            <span>{CLI_START_COMMAND}</span>
          </div>
          <p className="text-white/60">
            PolyHive prints a QR code in the terminal. Open it in a browser, including a phone
            browser, or enter the daemon address manually from another web client.
          </p>
          <p className="text-white/60">
            Configuration and local state live under <code>POLYHIVE_HOME</code>.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Voice Setup</h2>
        <p className="text-white/60">
          PolyHive includes first-class voice support with a local-first architecture and
          configurable speech providers.
        </p>
        <p className="text-white/60">
          For architecture, local model behavior, and provider configuration, see the Voice docs
          page.
        </p>
        <a href="/docs/voice" className="underline hover:text-white/80">
          Voice docs
        </a>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Next</h2>
        <ul className="text-white/60 space-y-2 list-disc list-inside">
          <li>
            <a href="/docs/updates" className="underline hover:text-white/80">
              Updates
            </a>
          </li>
          <li>
            <a href="/docs/voice" className="underline hover:text-white/80">
              Voice
            </a>
          </li>
          <li>
            <a href="/docs/providers" className="underline hover:text-white/80">
              Providers
            </a>
          </li>
          <li>
            <a href="/docs/configuration" className="underline hover:text-white/80">
              Configuration
            </a>
          </li>
          <li>
            <a href="/docs/security" className="underline hover:text-white/80">
              Security
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
