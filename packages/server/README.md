# @evertondgn/polyhive-server

The PolyHive daemon: agent process orchestration, WebSocket API, and an MCP server. Internal package — installed automatically as a transitive dependency of `@evertondgn/polyhive-cli` and the desktop app.

You normally do not depend on this package directly. To use PolyHive:

```bash
npm install -g @evertondgn/polyhive-cli
polyhive daemon start
```

The daemon exposes a WebSocket API on port `6767` (default) that the CLI, desktop app, and web app connect to. Agent state is persisted under `$POLYHIVE_HOME` (default: `~/.polyhive`). Logs are written to `$POLYHIVE_HOME/daemon.log`.

For the full architecture, WebSocket protocol, and configuration reference, see [github.com/everton-dgn/polyhive](https://github.com/everton-dgn/polyhive) and [docs/ARCHITECTURE.md](https://github.com/everton-dgn/polyhive/blob/main/docs/ARCHITECTURE.md).

## License

AGPL-3.0-or-later
