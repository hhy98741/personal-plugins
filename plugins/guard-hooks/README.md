# Guard Hooks Plugin

This plugin runs a `PreToolUse` guardrail hook that blocks two classes of risky tool calls before they execute:

- **Dangerous `rm` commands** — any `Bash` command matching a recursive+force `rm` (`-rf`, `-fr`, `--recursive --force`, etc.) against a path pattern (`/`, `~`, `$HOME`, `..`, `*`, or a bare `.`) is blocked.
- **`.env` file access** — `Read`, `Edit`, `MultiEdit`, and `Write` on any `.env*` file (except `.env.example`), plus `Bash` commands that `cat`, `echo >`, `touch`, `cp`, or `mv` a `.env` file, are blocked. `.env.example` is always allowed.

Blocked calls exit with code `2` and a message on stderr explaining why.

## Prerequisites

- [Bun](https://bun.sh) runtime (the hook is written in TypeScript and runs with Bun)

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/personal-plugins
/plugin install guard-hooks
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/personal-plugins
```

Start a new Claude Code session in your project. The plugin's hook will be active automatically — no setup command needed.

## Configuration

- `SKIP_HOOKS` (optional) — set to skip the hook entirely.

## Project Structure

```
plugins/guard-hooks/
  .claude-plugin/plugin.json   Plugin metadata
  hooks/
    hooks.json                 Hook configuration
    pre-tool-use.ts            Guardrail checks (dangerous rm, .env access)
```
