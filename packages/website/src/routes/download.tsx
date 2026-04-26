import { Link, createFileRoute } from "@tanstack/react-router";
import { CommandDialog } from "~/components/command-dialog";
import { GITHUB_WEB_BASE } from "~/fork-identity";
import { pageMeta } from "~/meta";
import {
  AppleIcon,
  GlobeIcon,
  TerminalIcon,
  downloadUrls,
  useDetectedPlatform,
  webAppUrl,
} from "~/downloads";
import { useRelease } from "~/routes/__root";
import "~/styles.css";

const GITHUB_URL = GITHUB_WEB_BASE;
const RELEASES_URL = `${GITHUB_WEB_BASE}/releases`;

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: pageMeta(
      "Download - Paseo",
      "Download Paseo for macOS or open the web app from any browser (including mobile).",
    ),
  }),
  component: Download,
});

function Download() {
  const { version } = useRelease();
  const urls = downloadUrls(version);
  const detectedPlatform = useDetectedPlatform();
  const emphasizeWebApp = detectedPlatform === "web";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 md:p-12">
        <header className="flex items-center justify-between gap-4 mb-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Paseo" className="w-6 h-6" />
            <span className="text-lg font-medium">Paseo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/changelog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Changelog
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.484 0 12.252c0 5.418 3.438 10.013 8.205 11.637.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.738-4.042-1.61-4.042-1.61-.546-1.403-1.333-1.776-1.333-1.776-1.089-.756.084-.741.084-.741 1.205.087 1.838 1.262 1.838 1.262 1.07 1.87 2.809 1.33 3.495 1.017.108-.79.417-1.33.76-1.636-2.665-.31-5.467-1.35-5.467-6.005 0-1.327.465-2.413 1.235-3.262-.124-.31-.535-1.556.117-3.243 0 0 1.008-.33 3.3 1.248a11.2 11.2 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.578 3.297-1.248 3.297-1.248.653 1.687.242 2.933.118 3.243.77.85 1.233 1.935 1.233 3.262 0 4.667-2.807 5.692-5.48 5.995.43.38.823 1.133.823 2.285 0 1.65-.015 2.98-.015 3.386 0 .315.218.694.825.576C20.565 22.26 24 17.667 24 12.252 24 5.484 18.627 0 12 0z" />
              </svg>
            </a>
          </div>
        </header>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">Download</h1>
        <p className="text-muted-foreground mb-10">v{version}</p>

        {emphasizeWebApp && (
          <section className="rounded-xl border border-border bg-card/40 p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Open in browser</h2>
              <GlobeIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-6">
              Paseo runs in any modern browser — including mobile. No install needed.
            </p>
            <a
              href={webAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-foreground/85 transition-colors"
            >
              Open Web App
            </a>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card/40 p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">macOS App</h2>
            <MonitorIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <AppleIcon className="h-5 w-5 text-foreground" />
                <span className="font-medium">macOS</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DownloadPill href={urls.macAppleSilicon} label="Apple Silicon" />
                <CommandDialog
                  trigger={
                    <span className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:bg-foreground/85 transition-colors">
                      Homebrew
                    </span>
                  }
                  title="Install via Homebrew"
                  command="brew install --cask paseo"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/40 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">Web App & macOS CLI</h2>
            <TerminalIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <GlobeIcon className="h-5 w-5 text-foreground" />
                <span className="font-medium">Web App</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <DownloadPill href={webAppUrl} label="Open" external />
              </div>
            </div>

            <div className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <TerminalIcon className="h-5 w-5 text-foreground" />
                <span className="font-medium">CLI</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <code className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-lg">
                  npm install -g @getpaseo/cli
                </code>
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All releases are available on{" "}
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function DownloadPill({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:bg-foreground/85 transition-colors"
    >
      {label}
      {external && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1.5 h-3 w-3"
          aria-hidden="true"
        >
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      )}
    </a>
  );
}

function MonitorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
