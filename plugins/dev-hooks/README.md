# Dev Hooks Plugin

This plugin includes hooks for logging, safety checks (blocks dangerous `rm` commands and `.env` file access), TTS voice notifications on task completion, and session management.

### Skills (Slash Commands)

| Command | Description |
|---|---|
| `/dev-hooks:setup` | Configures plugin settings (engineer name, log level) |

## Prerequisites

- [Bun](https://bun.sh) runtime (hooks are written in TypeScript and run with Bun)

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/personal-plugins
/plugin install dev-hooks
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/personal-plugins
```

Start a new Claude Code session in your project. The plugin's hooks, skills, and agents will be available automatically.

## Setup

After installing, run the setup command to configure the plugin:

```
/dev-hooks:setup
```

This will:
1. Ask for your name (used in TTS announcements)
2. Ask for your preferred log level
3. Create `.claude/logs` and `.claude/data` directories
4. Add a `.gitignore` for those directories
5. Save settings to `.env.example`

After setup, copy the variables to your `.env` file:

```bash
cp .env.example .env
```

Or if you already have a `.env`, manually copy the `dev-hooks` block into it.

See the [setup command](commands/setup.md) for manual setup instructions.

## Project Structure

```
plugins/dev-hooks/
  .claude-plugin/plugin.json   Plugin metadata
  commands/
    setup.md                   Setup command definition
  hooks/
    hooks.json                 Hook configuration and permissions
    *.ts                       Hook scripts (TypeScript/Bun)
    utils/                     Shared utilities (logging, TTS, messages)
```
