# App Builder Plugin

A Claude Code plugin that breaks down product requirements into epics and features, then builds them using a team of specialized subagents.

## What It Does

App Builder gives you a workflow for going from a requirements document to working code:

1. **Create an epic** from a product requirements document, extracting high-level features
2. **Create feature plans** from an epic, generating detailed implementation specs for each feature
3. **Build features** by executing the plans using a coder and reviewer agent team

### Skills (Slash Commands)

| Command | Description |
|---|---|
| `/app-builder:create-epic` | Reads a requirements doc and extracts features into an epic file |
| `/app-builder:create-features` | Takes an epic and creates individual feature implementation plans |
| `/app-builder:build-feature` | Executes a feature plan using coder/reviewer subagents |
| `/app-builder:setup` | Configures plugin settings (engineer name, log level) |

### Agents

| Agent | Role |
|---|---|
| **feature-planner** | Architect that creates detailed implementation plans for individual features |
| **coder** | Writes implementation code and tests based on the plan |
| **reviewer** | Reviews code for correctness, quality, and security; runs tests and validation |

### Hooks

The plugin includes hooks for logging, safety checks (blocks dangerous `rm` commands and `.env` file access), TTS voice notifications on task completion, and session management.

## Prerequisites

- [Bun](https://bun.sh) runtime (hooks are written in TypeScript and run with Bun)

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/claude-plugins
/plugin install app-builder
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/claude-plugins
```

Start a new Claude Code session in your project. The plugin's hooks, skills, and agents will be available automatically.

## Setup

After installing, run the setup command to configure the plugin:

```
/app-builder:setup
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

Or if you already have a `.env`, manually copy the `app-builder` block into it.

See the [setup command](commands/setup.md) for manual setup instructions.

## Typical Workflow

```
/app-builder:create-epic docs/requirements.md
/app-builder:create-features specs/epic.md
/app-builder:build-feature
```

## Project Structure

```
plugins/app-builder/
  .claude-plugin/plugin.json   Plugin metadata
  agents/                      Subagent definitions
    feature-planner.md         Plans individual features
    team/
      coder.md                 Writes code and tests
      reviewer.md              Reviews and validates
  commands/
    setup.md                   Setup command definition
  hooks/
    hooks.json                 Hook configuration and permissions
    *.ts                       Hook scripts (TypeScript/Bun)
    utils/                     Shared utilities (logging, TTS, messages)
    validators/                File validation hooks
  skills/
    create-epic/               Epic creation skill
    create-features/           Feature planning skill
    build-feature/             Feature building skill
```
