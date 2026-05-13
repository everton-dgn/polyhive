# @evertondgn/polyhive-cli

The PolyHive command-line client. Control your local AI coding agents from any terminal.

## Install

```bash
npm install -g @evertondgn/polyhive-cli
```

This puts the `polyhive` binary on your `$PATH` and pulls the daemon (`@evertondgn/polyhive-server`) and relay (`@evertondgn/polyhive-relay`) automatically.

## Quick start

```bash
polyhive daemon start                       # start the local daemon
polyhive run --provider claude/opus-4.6 \
  "implement user authentication"           # spawn an agent
polyhive ls                                 # list agents
polyhive attach <agent-id>                  # stream an agent's output
polyhive --host workstation.local:6768 ls   # talk to a remote daemon
```

## What is PolyHive?

PolyHive runs a local daemon that supervises Claude Code, Codex, and OpenCode agents on your machine. The CLI, the desktop app, and the web app are all clients of that daemon.

For the desktop app and full documentation, see [github.com/everton-dgn/polyhive](https://github.com/everton-dgn/polyhive).

## License

AGPL-3.0-or-later
