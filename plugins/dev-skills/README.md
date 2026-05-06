# Dev Skills Plugin

A Claude Code plugin providing a set of reusable skills available across multiple projects.

### Skills (Slash Commands)

| Command | Description |
|---|---|
| `/dev-skills:skill-forge` | Creates new Claude Code skills or modifies existing ones |

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/personal-plugins
/plugin install dev-skills
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/personal-plugins
```

Start a new Claude Code session in your project. The plugin's skills will be available automatically.

## Usage

### skill-forge

Use `skill-forge` to design, write, and verify skill files:

```
/dev-skills:skill-forge create <skill-name> <description>
/dev-skills:skill-forge modify <path-to-skill> <changes>
```

It handles the full skill lifecycle — clarifying requirements, designing frontmatter and instructions, writing supporting files (templates, scripts, examples), and verifying the result.

## Project Structure

```
plugins/dev-skills/
  .claude-plugin/plugin.json   Plugin metadata
  skills/
    skill-forge/               Skill creation and modification tool
      SKILL.md                 Skill definition
      reference.md             Claude Code skill spec reference
```
