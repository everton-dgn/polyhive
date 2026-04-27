<p align="center">
  <img src="packages/website/public/logo.svg" width="64" height="64" alt="PolyHive logo">
</p>

<h1 align="center">PolyHive</h1>

<p align="center">
  <a href="https://github.com/everton-dgn/polyhive/stargazers">
    <img src="https://img.shields.io/github/stars/everton-dgn/polyhive?style=flat&logo=github" alt="GitHub stars">
  </a>
  <a href="https://github.com/everton-dgn/polyhive/releases">
    <img src="https://img.shields.io/github/v/release/everton-dgn/polyhive?style=flat&logo=github" alt="GitHub release">
  </a>
</p>

<p align="center">One interface for all your Claude Code, Codex and OpenCode agents.</p>

---

Run agents in parallel on your own Mac. Ship from your desk or from a mobile browser.

This fork targets **macOS (Electron) + web (any browser, including mobile)**.

- **Self-hosted:** Agents run on your Mac with your full dev environment. Use your tools, your configs, and your skills.
- **Multi-provider:** Claude Code, Codex, and OpenCode through the same interface. Pick the right model for each job.
- **Voice control:** Dictate tasks or talk through problems in voice mode. Hands-free when you need it.
- **Cross-device:** macOS desktop app (Electron), web (desktop and mobile browsers), and CLI. Start work at your desk, check in from any browser, script it from the terminal.
- **Privacy-first:** PolyHive doesn't have any telemetry, tracking, or forced log-ins.

## Getting Started

PolyHive runs a local server called the daemon that manages your coding agents. Clients like the desktop app, web app, and CLI connect to it.

### Prerequisites

You need at least one agent CLI installed and configured with your credentials:

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Codex](https://github.com/openai/codex)
- [OpenCode](https://github.com/anomalyco/opencode)

### Desktop app (recommended, macOS)

Download it from the [GitHub releases page](https://github.com/everton-dgn/polyhive/releases). Open the app and the daemon starts automatically. Nothing else to install.

To connect from another device (e.g. a mobile browser on your phone), scan the QR code shown in Settings.

### CLI / headless

This fork does not currently advertise a fork-specific npm CLI package. Do not use
`polyhive` if you need this fork; that package installs upstream PolyHive.

For local development from this checkout:

```bash
npm install
npm run build:daemon
npm run cli -- daemon start
```

This shows a QR code in the terminal. Connect from any client. This path is useful for servers and remote machines.

For full setup and configuration, see the docs in this repository.

## CLI

Everything you can do in the app, you can do from the terminal.

```bash
polyhive run --provider claude/opus-4.6 "implement user authentication"
polyhive run --provider codex/gpt-5.4 --worktree feature-x "implement feature X"

polyhive ls                           # list running agents
polyhive attach abc123                # stream live output
polyhive send abc123 "also add tests" # follow-up task

# run on a remote daemon
polyhive --host workstation.local:6767 run "run the full test suite"
```

See the CLI docs in this repository for more.

## Orchestration skills (Unstable)

Experimental skills that teach agents how to use the PolyHive CLI to orchestrate other agents. I am updating these very frequently as I learn new things, expect changes without notice, might be coupled to my own setup, use at your own risk.

```bash
npx skills add everton-dgn/polyhive
```

Then use them in any agent conversation:

```bash
# Use handoff when you discuss something with an agent but want another one to implement.
# I use this to plan with Claude and then handoff to Codex to implement.
/polyhive-handoff hand off the authentication fix to codex 5.4 in a worktree

# Use loops when you have clear acceptance criteria (aka Ralph loops).
/polyhive-loop loop a codex agent to fix the backend tests, use sonnet to verify, max 10 iterations

# Orchestrator teaches the agent how to create teams and manage them via a chat room.
# Very opinionated and expects both Codex and Claude to work.
/polyhive-orchestrator spin up a team to implement the database refactor, use chat to coordinate. use claude to plan and codex to implement and review
```

## Development

Quick monorepo package map:
- `packages/server`: PolyHive daemon (agent process orchestration, WebSocket API, MCP server)
- `packages/app`: Expo client (web, runs in browsers including mobile)
- `packages/cli`: `polyhive` CLI for daemon and agent workflows
- `packages/desktop`: Electron desktop app
- `packages/relay`: Relay package for remote connectivity
- `packages/website`: Marketing site and documentation (deploys via Vercel; override URLs with `VITE_POLYHIVE_*` env vars)

Common commands:

```bash
# run all local dev services
npm run dev

# run individual surfaces
npm run dev:server
npm run dev:app
npm run dev:desktop
npm run dev:website

# build the daemon
npm run build:daemon

# repo-wide checks
npm run typecheck
```

## License

AGPL-3.0
