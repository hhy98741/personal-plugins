# skill-forge Reference

Reference material for designing Claude Code skills. Read this file when making frontmatter or tool decisions.

> **Important:** The IDE diagnostics linter for SKILL.md files is outdated and incorrectly flags valid fields as unsupported. Trust this reference and the official Claude Code documentation over any diagnostic warnings. The complete and accurate frontmatter spec is below.

---

## Frontmatter Fields

All fields are optional unless noted.

| Field | Type | Description |
|---|---|---|
| `name` | string | Slash-command name. Lowercase, hyphens only, ≤64 chars. Defaults to directory name if omitted. |
| `description` | string | **Recommended.** What it does and when to use it. Claude uses this to decide when to auto-load. If omitted, uses first paragraph of markdown. |
| `argument-hint` | string | Shown in autocomplete. E.g., `[issue-number]` or `[filename] [format]`. |
| `disable-model-invocation` | bool | `true` = only user can invoke (not in Claude's context). Use for side-effect skills you control. Default: `false`. |
| `user-invocable` | bool | `false` = hidden from `/` menu; only Claude can invoke. Use for background knowledge skills. Default: `true`. |
| `allowed-tools` | list | Tools that run without asking permission when this skill is active. |
| `model` | string | Override model for this skill. |
| `effort` | string | `low`, `medium`, `high`, `max` (max = Opus 4.6 only). Overrides session effort. |
| `context` | string | Set to `fork` to run in isolated subagent (no conversation history access). |
| `agent` | string | Which agent to use when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, or any custom agent name. |
| `hooks` | object | Hooks scoped to this skill's lifecycle. |

### Invocation control matrix

| Setting | User can invoke | Claude can invoke | In context |
|---|---|---|---|
| (default) | Yes | Yes | Description always loaded |
| `disable-model-invocation: true` | Yes | No | Not in context |
| `user-invocable: false` | No | Yes | Description always loaded |

---

## Allowed Tools — Exact Names

Use these exact strings in `allowed-tools`:

**File tools** (no approval needed by default):
- `Read` — read files
- `Grep` — search file contents
- `Glob` — find files by pattern

**File modification tools:**
- `Write` — create/overwrite files
- `Edit` — targeted edits to existing files
- `NotebookEdit` — edit Jupyter notebooks

**Execution tools:**
- `Bash` — shell commands. Scope with pattern: `Bash(npm run *)`, `Bash(git *)`, `Bash(mkdir *)`, `Bash(bun *)`
- `WebFetch` — fetch URLs. Scope with domain: `WebFetch(domain:example.com)`
- `WebSearch` — web search

**Agent tools:**
- `Agent` — spawn subagents for complex multi-step work

**MCP tools:**
- `mcp__<server>` — all tools from an MCP server
- `mcp__<server>__<tool>` — specific MCP tool

**Skill tools:**
- `Skill(name)` — exact skill match
- `Skill(name *)` — prefix match with any arguments

---

## String Substitutions in Skill Content

| Placeholder | Replaced with |
|---|---|
| `$ARGUMENTS` | All arguments passed to the skill |
| `$ARGUMENTS[N]` | Argument at 0-based index N |
| `$N` | Shorthand for `$ARGUMENTS[N]` (e.g., `$0`, `$1`) |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `${CLAUDE_SKILL_DIR}` | Directory containing this skill's SKILL.md |

If `$ARGUMENTS` is not in the content, arguments are appended as `ARGUMENTS: <value>`.

---

## Dynamic Context Injection

Use `!`command`` syntax to run shell commands before the skill content is sent to Claude. Output replaces the placeholder:

```
- Current branch: !`git branch --show-current`
- PR diff: !`gh pr diff`
```

This is preprocessing — Claude only sees the final rendered output.

---

## context: fork Behavior

When `context: fork` is set:
- Skill content becomes the subagent's task prompt
- No access to conversation history
- `agent:` determines the execution environment (tools, model)
- Results are summarized back to the main conversation
- Only makes sense for skills with explicit actionable instructions (not pure reference content)

Built-in agent types: `Explore` (read-only, codebase search), `Plan` (architecture/planning), `general-purpose` (full tools).

---

## Skill File Structure

```
my-skill/
├── SKILL.md           # Required — main instructions
├── reference.md       # Optional — detailed docs loaded on demand
├── templates/         # Optional — output templates
├── examples/          # Optional — sample outputs
└── scripts/           # Optional — executables Claude can run
```

Keep SKILL.md under 500 lines. Move heavy reference material to supporting files and link them from SKILL.md.

---

## Skill Locations

| Scope | Path | Available |
|---|---|---|
| Project | `.claude/skills/<name>/SKILL.md` | This project only |
| User | `~/.claude/skills/<name>/SKILL.md` | All projects |
| Enterprise | Managed settings path | All org users |

When skills share the same name, precedence: enterprise > user > project.
