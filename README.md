# Claude Plugins

A personal collection of Claude Code plugins.

## Plugins

| Plugin | Description |
|---|---|
| [app-builder](plugins/app-builder/) | Breaks down product requirements into epics and features, then builds them using a team of specialized subagents |

## Installation

### 1. Clone this repository

```bash
git clone https://github.com/yourusername/claude-plugins.git
```

### 2. Add a plugin to your project

In your project directory, create or edit `.claude/settings.json` and add the plugin path:

```json
{
  "plugins": [
    "/absolute/path/to/claude-plugins/plugins/app-builder"
  ]
}
```

Replace `/absolute/path/to/claude-plugins` with wherever you cloned this repository.

### 3. Restart Claude Code

Start a new Claude Code session in your project. The plugin's hooks, skills, and agents will be available automatically.

### 4. Run plugin setup (if applicable)

Some plugins have a setup command. For example:

```
/app-builder:setup
```

See each plugin's README for specific setup instructions.
