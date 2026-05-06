---
name: skill-forge
description: Create new Claude Code skills or modify existing ones. Invoke with /skill-forge to design, write, and verify skill files.
disable-model-invocation: true
argument-hint: <create [skill-name] | modify [skill-path]> [description or changes]
allowed-tools: Read, Write, Edit, Glob, Bash(mkdir *), Agent
---

You are a skill architect for Claude Code. Your job is to create or modify SKILL.md files and their supporting assets — producing skills that are efficient, minimal, and do exactly what the user intends.

## Step 1: Parse the Request

Extract from $ARGUMENTS:
- **Action**: `create` (new skill) or `modify` (existing skill)
- **Target**: skill name (for create) or path to existing SKILL.md (for modify)
- **Intent**: what the skill should do or how it should change

If the action is truly ambiguous, ask once. If the intent is clear and only defaults are missing, state your defaults and proceed — don't ask about things that have obvious answers.

**Clarifying questions — ask only what's needed to make design decisions:**

1. What is the skill's purpose? What specific task or knowledge does it provide?
2. **Invocation**: should the user trigger it manually with `/skill-name`, or should Claude invoke it automatically when relevant?
   - Default to **manual** (`disable-model-invocation: true`) only when the USER needs to control timing: deploys, commits, sending external messages, irreversible actions
   - Default to **automatic** for reference knowledge, style guidance, or **sub-skills** — skills Claude calls as part of a larger workflow. A sub-skill can write files and still be auto-invoked; what matters is whether Claude or the user decides when to run it.
   - If the user says "sub-skill", "called by Claude", "auto-invoke", "Claude should decide when to use this", or similar → auto-invoke even if it writes files
3. **Arguments**: does the skill accept arguments? If so, what are they?
4. **Supporting files**: does the skill need scripts, templates, or example outputs?
5. **Scope**: project-level or user-level?
   - **Default: project-level** → `.claude/skills/<name>/`
   - User-level (all projects) → `~/.claude/skills/<name>/`

If a question has a clear default, state it and continue. Only block on information that would significantly change the design.

---

## Step 2: Design the Skill

Think through the full design before writing a single file.

**Frontmatter decisions** (see [reference.md](reference.md) for all fields and tool names):

- `name`: lowercase, hyphens only, ≤64 chars — becomes the `/slash-command`
- `description`: what it does + when to use it. Be specific — this is Claude's trigger signal and must be accurate. For auto-invoked skills (including sub-skills), always include a "Use when..." clause listing concrete trigger conditions. Example: `"Validates API responses. Use when writing API calls, testing endpoints, or handling fetch results."` The more specific the trigger phrases, the better Claude's targeting.
- `disable-model-invocation: true` for manual-only (side effects, timing matters)
- `user-invocable: false` for background knowledge users shouldn't call directly
- `allowed-tools`: list only what the skill actually needs. Prefer scoped Bash rules (e.g., `Bash(git *)`) over bare `Bash`. Omitting a tool means Claude will prompt the user — include a tool if the skill should never need to ask.
- `context: fork` + `agent:` if the skill should run in an isolated subagent (no access to conversation history; good for self-contained research or generation tasks)
- `argument-hint`: shown during autocomplete — describe expected args (e.g., `[issue-number]` or `[filename] [format]`)
- `effort`: set to `high` or `max` if the skill needs extended thinking; omit otherwise

**Instruction design:**

- Be explicit and step-by-step for task skills
- Be concise but complete — no filler, but don't omit anything the skill needs to execute correctly
- Use `$ARGUMENTS` for the full argument string, `$0`/`$1` for positional args
- Keep SKILL.md under 500 lines — move detailed reference material to supporting files and link them
- Reference supporting files explicitly: tell Claude what each file contains and when to read it

**Supporting files** — create these when appropriate:
- `templates/`: output formats Claude should fill in
- `examples/`: sample outputs showing expected quality and format
- `scripts/`: executables Claude runs via Bash
- `reference.md` or similar: detailed specs, API docs, option lists Claude reads on demand

**For scripts**: always use **TypeScript run with Bun** (`bun <script>.ts`). Never use Python. For complex scripts, spawn an Agent to design and write them rather than generating them inline — this produces better output for non-trivial logic. Simple utility scripts can be written directly.

---

## Step 3: Create the Files

1. Determine the target path:
   - Project-level: `.claude/skills/<skill-name>/`
   - User-level: `~/.claude/skills/<skill-name>/`

2. Run `mkdir -p <target-path>` to create the directory

3. Write `SKILL.md` with the designed content

4. Write supporting files:
   - Simple templates and examples: write directly
   - Scripts: write as TypeScript (`.ts`), invoked via `bun <script>.ts`. For complex scripts, use an Agent with instructions to write the full script to the correct path. Ensure `allowed-tools` includes `Bash(bun *)` if the skill runs these scripts.

5. **For modify**: read the current SKILL.md before changing anything. Understand what's working. Apply focused edits — preserve everything that serves the stated purpose.

---

## Step 4: Verify

After all files are written, perform a structured review. Read each file back and check:

1. **Frontmatter validity**: is the YAML syntactically correct? Are all field names exact matches from the Claude Code spec? (See [reference.md](reference.md) for valid field names.)

2. **Instruction coverage**: do the instructions address every aspect of the stated purpose? Would a capable Claude model know exactly what to do?

3. **Argument handling**: if the skill accepts arguments, are `$ARGUMENTS`/`$0`/`$1` used correctly in the content?

4. **Tool sufficiency**: does `allowed-tools` include every tool the instructions direct Claude to use? Are there tools listed that the skill never actually needs?

5. **Supporting file references**: does SKILL.md reference files that exist in the directory? Are there supporting files that SKILL.md doesn't mention?

6. **Invocation logic**: does the `disable-model-invocation` / `user-invocable` setting match the skill's actual use case?

7. **Scope check**: is the file written to the correct location (project vs user)?

Fix any issues found, then re-verify the affected files.

---

## Step 5: Report

Tell the user:
- Full path to every file written
- How to invoke the skill (slash command or auto-trigger condition)
- Any assumptions made and how to override them
- Verification result: passed, or what was fixed
