---
name: polyhive
description: PolyHive CLI reference for managing agents. Load this skill whenever you need to use polyhive commands.
---

## Agent Commands

```bash
# List agents (directory-scoped by default)
polyhive ls                 # Only shows agents for current directory
polyhive ls -g              # All agents across all projects (global)
polyhive ls --json          # JSON output for parsing

# Create and run an agent (blocks until completion by default, no timeout)
polyhive run --mode bypassPermissions "<prompt>"
polyhive run --mode bypassPermissions --name "task-name" "<prompt>"
polyhive run --mode bypassPermissions --provider claude/opus "<prompt>"
polyhive run --mode full-access --provider codex/gpt-5.4 "<prompt>"

# Wait timeout - limit how long run blocks (default: no limit)
polyhive run --wait-timeout 30m "<prompt>"   # Wait up to 30 minutes
polyhive run --wait-timeout 1h "<prompt>"    # Wait up to 1 hour

# Detached mode - runs in background, returns agent ID immediately
polyhive run --detach "<prompt>"
polyhive run -d "<prompt>"  # Short form

# Structured output - agent returns only matching JSON
polyhive run --output-schema '{"type":"object","properties":{"summary":{"type":"string"}},"required":["summary"]}' "<prompt>"
# NOTE: --output-schema blocks until completion (cannot be used with --detach)

# Worktrees - isolated git worktree for parallel feature development
polyhive run --worktree feature-x "<prompt>"

# Check agent logs/output
polyhive logs <agent-id>
polyhive logs <agent-id> -f               # Follow (stream)
polyhive logs <agent-id> --tail 10        # Last 10 entries
polyhive logs <agent-id> --filter tools   # Only tool calls

# Wait for agent to complete or need permission
polyhive wait <agent-id>
polyhive wait <agent-id> --timeout 60     # 60 second timeout

# Send follow-up prompt to running agent
polyhive send <agent-id> "<prompt>"
polyhive send <agent-id> --image screenshot.png "<prompt>"  # With image
polyhive send <agent-id> --no-wait "<prompt>"               # Queue without waiting

# Inspect agent details
polyhive inspect <agent-id>

# Interrupt an agent's current run
polyhive stop <agent-id>

# Archive an agent (soft-delete, removes from UI)
polyhive archive <agent-id>
polyhive archive <agent-id> --force  # Force archive running agent (interrupts first)

# Hard-delete an agent (interrupts first if needed)
polyhive delete <agent-id>

# Attach to agent output stream (Ctrl+C to detach without stopping)
polyhive attach <agent-id>

# Permissions management
polyhive permit ls                # List pending permission requests
polyhive permit allow <agent-id>  # Allow all pending for agent
polyhive permit deny <agent-id> --all  # Deny all pending

# Output formats
polyhive ls --json          # JSON output
polyhive ls -q              # IDs only (quiet mode, useful for scripting)
```

## Loop Commands

Iterative worker loops: launch a worker agent, verify its output, repeat until done.

```bash
# Start a loop
polyhive loop run "<worker prompt>" [options]
  --verify "<verifier prompt>"      # Verifier agent prompt
  --verify-check "<command>"        # Shell command that must exit 0 (repeatable)
  --name <name>                     # Optional loop name
  --sleep <duration>                # Delay between iterations (30s, 5m)
  --max-iterations <n>              # Maximum number of iterations
  --max-time <duration>             # Maximum total runtime (1h, 30m)
  --provider <provider/model>        # Worker agent provider/model (e.g. codex/gpt-5.4)
  --verify-provider <provider/model> # Verifier agent provider/model (e.g. claude/opus)
  --archive                         # Archive agents after each iteration

# Manage loops
polyhive loop ls                       # List all loops
polyhive loop inspect <id>             # Show loop details and iterations
polyhive loop logs <id>                # Stream loop logs
polyhive loop stop <id>                # Stop a running loop
```

## Schedule Commands

Recurring time-based execution: run a prompt on a cron or interval schedule.

```bash
# Create a schedule
polyhive schedule create "<prompt>" [options]
  --every <duration>                # Fixed interval (5m, 1h)
  --cron <expr>                     # Cron expression
  --name <name>                     # Optional schedule name
  --target <self|new-agent|id>      # Run target
  --max-runs <n>                    # Maximum number of runs
  --expires-in <duration>           # Time to live for schedule

# Manage schedules
polyhive schedule ls                   # List schedules
polyhive schedule inspect <id>         # Inspect a schedule
polyhive schedule logs <id>            # Show recent run logs
polyhive schedule pause <id>           # Pause a schedule
polyhive schedule resume <id>          # Resume a paused schedule
polyhive schedule delete <id>          # Delete a schedule
```

## Chat Commands

Asynchronous agent coordination through persistent chat rooms.

```bash
# Create a chat room
polyhive chat create <name> --purpose "<description>"

# List and inspect rooms
polyhive chat ls
polyhive chat inspect <name-or-id>

# Post a message
polyhive chat post <room> "<message>"
polyhive chat post <room> "<message>" --reply-to <msg-id>
polyhive chat post <room> "@<agent-id> <message>"
polyhive chat post <room> "@everyone <message>"

# Read messages
polyhive chat read <room>
polyhive chat read <room> --limit <n>
polyhive chat read <room> --since <duration-or-timestamp>
polyhive chat read <room> --agent <agent-id>

# Wait for new messages
polyhive chat wait <room>
polyhive chat wait <room> --timeout <duration>

# Delete a room
polyhive chat delete <name-or-id>
```

## Terminal Commands

Manage workspace terminals: create, inspect, send keystrokes, capture output.

```bash
# List terminals (scoped to current directory by default)
polyhive terminal ls                    # Terminals in current directory
polyhive terminal ls --all              # All terminals across all workspaces
polyhive terminal ls --cwd ~/dev/myapp  # Terminals in a specific directory

# Create a terminal
polyhive terminal create                          # In current directory
polyhive terminal create --cwd ~/dev/myapp        # In a specific directory
polyhive terminal create --name "build-runner"    # With a custom name

# Kill a terminal (supports short ID prefixes and name matching)
polyhive terminal kill <terminal-id>
polyhive terminal kill abc123           # Short prefix
polyhive terminal kill build-runner     # By name

# Capture terminal output as plain text (like tmux capture-pane -p)
polyhive terminal capture <terminal-id>               # Visible pane only, ANSI stripped
polyhive terminal capture <terminal-id> --scrollback   # Full scrollback + visible
polyhive terminal capture <terminal-id> -S             # Short form of --scrollback
polyhive terminal capture <terminal-id> --start 0 --end 10   # Line range (tmux-style)
polyhive terminal capture <terminal-id> --start -5     # Last 5 lines
polyhive terminal capture <terminal-id> --ansi         # Preserve ANSI escape codes
polyhive terminal capture <terminal-id> --json         # JSON output with metadata

# Send keystrokes (like tmux send-keys)
polyhive terminal send-keys <terminal-id> "ls -la" Enter
polyhive terminal send-keys <terminal-id> "echo hello" Enter
polyhive terminal send-keys <terminal-id> C-c          # Ctrl+C
polyhive terminal send-keys <terminal-id> C-d          # Ctrl+D
polyhive terminal send-keys <terminal-id> --literal "raw text"  # No special token interpretation
```

**Special key tokens** (interpreted by default, use `--literal` to send raw):
`Enter`, `Tab`, `Escape`, `Space`, `BSpace`, `C-c`, `C-d`, `C-z`, `C-l`, `C-a`, `C-e`

**Common pattern — launch a process and interact with it:**
```bash
id=$(polyhive terminal create --name "my-shell" -q)
polyhive terminal send-keys "$id" "claude" Enter
sleep 5
polyhive terminal capture "$id" --scrollback   # See what happened
polyhive terminal send-keys "$id" "Hello!" Enter
sleep 10
polyhive terminal capture "$id" --scrollback   # See the response
polyhive terminal send-keys "$id" "/exit" Enter
polyhive terminal kill "$id"
```

## Available Models

**Claude (default provider):**
- `--provider claude/haiku` — Fast/cheap, ONLY for tests (not for real work)
- `--provider claude/sonnet` — Good for most tasks
- `--provider claude/opus` — For harder reasoning, complex debugging

**Codex:**
- `--provider codex/gpt-5.4` — Latest frontier agentic coding model (preferred for all engineering tasks)
- `--provider codex/gpt-5.4-mini` — Cheaper, faster, but less capable

## Permissions

Always launch agents fully permissioned. Use `--mode bypassPermissions` for Claude and `--mode full-access` for Codex. Always specify the model: `--provider claude/opus`, `--provider codex/gpt-5.4`, etc. Control behavior through **strict prompting**, not permission modes.

## Waiting for Agents

Both `polyhive run` and `polyhive wait` block until the agent completes. Trust them.

- `polyhive run` waits **forever** by default (no timeout). Use `--wait-timeout` to set a limit.
- `polyhive wait` also waits forever by default. Use `--timeout` to set a limit.
- Agent tasks can legitimately take 10, 20, or even 30+ minutes. This is normal.
- When a wait times out, **just re-run `polyhive wait <id>`** — don't panic, don't start checking logs.
- Do NOT poll with `polyhive ls`, `polyhive inspect`, or `polyhive logs` in a loop to "check on" the agent.
- **Never launch a duplicate agent** because a wait timed out. The original is still running.

## Composing Agents in Bash

`polyhive run` blocks by default and `--output-schema` returns structured JSON, making it easy to compose agents in bash loops and pipelines.

**Detach + wait pattern for parallel work:**
```bash
api_id=$(polyhive run -d --name "impl-api" "implement the API" -q)
ui_id=$(polyhive run -d --name "impl-ui" "implement the UI" -q)

polyhive wait "$api_id"
polyhive wait "$ui_id"
```
