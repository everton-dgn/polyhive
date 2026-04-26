# CLAUDE.md

Paseo is a web app for monitoring and controlling your local AI coding agents from anywhere. This fork supports **macOS (Electron) and any browser (including mobile)**. Connects directly to your actual development environment — your code stays on your machine.

**Supported agents:** Claude Code, Codex, and OpenCode.

## Repository map

This is an npm workspace monorepo:

- `packages/server` — Daemon: agent lifecycle, WebSocket API, MCP server
- `packages/app` — Web client (Expo, browser-targeted)
- `packages/cli` — Docker-style CLI (`paseo run/ls/logs/wait`)
- `packages/relay` — E2E encrypted relay for remote access
- `packages/desktop` — Electron desktop wrapper (macOS only)
- `packages/website` — Marketing site (Vercel; URLs via `VITE_PASEO_*` env vars)

## Documentation

| Doc | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, package layering, WebSocket protocol, agent lifecycle, data flow |
| [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) | Type hygiene, error handling, state design, React patterns, file organization |
| [docs/TESTING.md](docs/TESTING.md) | TDD workflow, determinism, real dependencies over mocks, test organization |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Dev server, build sync gotchas, CLI reference, agent state, Playwright MCP |
| [docs/RELEASE.md](docs/RELEASE.md) | Release playbook, draft releases, completion checklist |
| [docs/CUSTOM-PROVIDERS.md](docs/CUSTOM-PROVIDERS.md) | Custom provider config: Z.AI, Alibaba/Qwen, ACP agents, profiles, custom binaries |
| [docs/DESIGN.md](docs/DESIGN.md) | How to design features before implementation |
| [SECURITY.md](SECURITY.md) | Relay threat model, E2E encryption, DNS rebinding, agent auth |

## Quick start

```bash
npm run dev                          # Start daemon + Expo in Tmux
npm run cli -- ls -a -g              # List all agents
npm run cli -- daemon status         # Check daemon status
npm run typecheck                    # Always run after changes
npm run format                       # Auto-format with Biome
npm run format:check                 # Check formatting without writing
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full setup, build sync requirements, and debugging.

## Critical rules

- **NEVER restart the main Paseo daemon on port 6767 without permission** — it manages all running agents. If you're an agent, restarting it kills your own process.
- **NEVER assume a timeout means the service needs restarting** — timeouts can be transient.
- **NEVER add auth checks to tests** — agent providers handle their own auth.
- **NEVER run the full test suite locally.** The test suites are heavy and will freeze the machine, especially if multiple agents run them in parallel. Rules:
  - Run only the specific test file you changed: `npx vitest run <file> --bail=1`
  - Never run `npm run test` for an entire workspace unless explicitly asked.
  - If you must run a broad suite, pipe output to a file and read it afterward: `npx vitest run <file> --bail=1 > /tmp/test-output.txt 2>&1` then read the file.
  - Never re-run a test suite that another agent already ran and reported green — trust the result.
  - For full suite verification, push to CI and check GitHub Actions instead.
- **Always run typecheck after every change.**
- **Run `npm run format` before committing.** This repo uses Biome for formatting. Do not manually fix formatting — let the formatter handle it.
- **NEVER make breaking changes to WebSocket or message schemas.** The primary compatibility path is old clients talking to newly updated daemons. Users update desktop and daemon first, then keep running the old web client for a while. Every schema change MUST be backward-compatible for old clients against new daemons:
  - New fields: always `.optional()` with a sensible default or `.transform()` fallback.
  - Never change a field from optional to required.
  - Never remove a field — deprecate it (keep accepting it, stop sending it).
  - Never narrow a field's type (e.g. `string` → `enum`, `nullable` → non-null).
  - Test with: "does a 6-month-old client still parse this?" and "does a 6-month-old daemon still send something this client accepts?"

## Platform gating

The app runs on web (browsers, including mobile browsers) and the Electron desktop wrapper. Code is cross-platform by default. Gate only when you must. Import gates from `@/constants/platform`.

### The three gates

| Gate | Type | When to use |
|---|---|---|
| `isWeb` | constant | Always `true` in this fork. Kept for readability when the intent is "web code path"; you rarely need to branch on it. |
| `getIsElectron()` | cached fn | Desktop wrapper features — file dialogs, titlebar drag region, daemon management, app updates, dock badges. |
| `useIsCompactFormFactor()` | hook | Layout decisions — sidebar overlay vs pinned, modal vs full screen, single-panel vs split. From `@/constants/layout`. Drives the mobile-browser UX. |

### Decision matrix

| I need to... | Use |
|---|---|
| Access DOM (`document`, `window`, `<div>`, `addEventListener`) | Just write it — web is the only runtime |
| Use an Electron bridge (file dialog, titlebar, updates) | `if (getIsElectron())` |
| Switch layout between phone-width and tablet/desktop viewports | `useIsCompactFormFactor()` |
| Show something on hover, always-visible on touch | `isHovered \|\| isCompact` (hover works, but touch viewports need the control visible) |

### Rules

- **Default is web-only.** DOM APIs are safe to use directly; there is no native runtime to protect against.
- **Compact viewport UX is first-class.** The fork is used heavily from mobile browsers. Never regress behavior behind `useIsCompactFormFactor()` or `isMobile` — those branches are load-bearing.
- **Prefer Metro file extensions over `if` statements for large branches.** When a module has fundamentally different implementations for Electron vs browser, use split files and let Metro resolve. Reserve inline `if (getIsElectron())` for small checks.
  ```
  hooks/
    use-updater.web.ts       ← browser no-op
    use-updater.electron.ts  ← IPC bridge
  ```
- **Don't use Platform.OS as a proxy for layout capabilities.** Use breakpoints via `useIsCompactFormFactor()` for layout decisions.
- **Import `isWeb`/`getIsElectron` from `@/constants/platform`.** Do not read `Platform.OS` directly.

## Debugging


Find the complete daemon logs and traces in the $PASEO_HOME/daemon.log
