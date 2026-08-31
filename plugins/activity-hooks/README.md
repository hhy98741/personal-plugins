# Activity Hooks Plugin

This plugin includes hooks for logging and session management. Dangerous `rm` command and `.env` file guardrails have moved to the [guard-hooks](../guard-hooks/) plugin.

### Skills (Slash Commands)

| Command | Description |
|---|---|
| `/activity-hooks:setup` | Configures plugin settings (log level) |

## Prerequisites

- [Bun](https://bun.sh) runtime (hooks are written in TypeScript and run with Bun)

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/personal-plugins
/plugin install activity-hooks
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/personal-plugins
```

Start a new Claude Code session in your project. The plugin's hooks, skills, and agents will be available automatically.

## Setup

After installing, run the setup command to configure the plugin:

```
/activity-hooks:setup
```

This will:
1. Ask for your preferred log level
2. Create `.claude/logs` and `.claude/data` directories
3. Add a `.gitignore` for those directories
4. Save settings to `.env.example`

After setup, copy the variables to your `.env` file:

```bash
cp .env.example .env
```

Or if you already have a `.env`, manually copy the `activity-hooks` block into it.

See the [setup command](commands/setup.md) for manual setup instructions.

## Project Structure

```
plugins/activity-hooks/
  .claude-plugin/plugin.json   Plugin metadata
  commands/
    setup.md                   Setup command definition
  hooks/
    hooks.json                 Hook configuration and permissions
    *.ts                       Hook scripts (TypeScript/Bun)
    utils/                     Shared utilities (logging, session, dirs)
```
