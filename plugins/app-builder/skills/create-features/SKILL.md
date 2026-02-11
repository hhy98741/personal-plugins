---
name: create-features
description: Takes an epic file and creates individual feature implementation plans in specs/features/, one file per feature listed in the epic. Spawns a planner agent per feature to avoid context bloat.
disable-model-invocation: true
argument-hint: [path to epic file]
model: opus
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mv:*), Bash(mkdir:*), Task, TaskCreate, TaskUpdate, TaskList, TaskGet
hooks:
  Stop:
    - hooks:
        - type: command
          command: >-
            bun run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/validate_new_file.ts
            --directory specs/features
            --extension .md
        - type: command
          command: >-
            bun run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/validate_file_contains.ts
            --directory specs/features
            --extension .md
            --contains '## Task Description'
            --contains '## Objective'
            --contains '## Relevant Files'
            --contains '## Team Orchestration'
            --contains '### Team Members'
            --contains '## Step by Step Tasks'
            --contains '## Acceptance Criteria'
---

# Create Features

Orchestrate the creation of individual feature implementation plans from an epic file. For each feature in the epic, spawn a **planner** agent that explores the codebase and writes a detailed implementation plan. This keeps each feature plan in a fresh context window so quality stays consistent whether there are 5 features or 100.

## Variables

EPIC_FILE: $1
OUTPUT_DIRECTORY: `specs/features/`
TEAM_MEMBERS_DIR: `.claude/agents/team/`
PLANNER_AGENT: `feature-planner`

## Instructions

- If no `EPIC_FILE` is provided, stop and ask the user to provide the path to an epic file.
- You are an **orchestrator**. You do NOT write feature plans yourself. You spawn a planner agent for each feature and give it the context it needs.
- **IMPORTANT**: Do not explore the codebase yourself. The planner agent will do that with a fresh context window per feature. Your job is to parse the epic, analyze relationships, prepare targeted context, and dispatch.

## Workflow

1. **Setup**
   - Check if `OUTPUT_DIRECTORY` exists using Glob. If not, that's fine — the planner agents will create it when they write files.
   - List existing files in `OUTPUT_DIRECTORY` to determine the starting `F###` number for this epic.

2. **Discover Agents**
   - Read all files in `TEAM_MEMBERS_DIR` to build a roster of available team agents.
   - For each agent, capture: name, description, and any tool restrictions.
   - Format this as a concise text block that can be passed to each planner agent.

3. **Read Epic**
   - Read the epic file at the path in `EPIC_FILE`.
   - Extract the epic number from the filename (e.g., `E001` from `E001-user-authentication.md`).
   - Parse every numbered feature. Each feature is a `## N. Feature Name` section with `**What it does**` and `**Expected outcome**` fields.
   - Build a list of features with: number, name, what it does, expected outcome, and assigned feature ID (E###-F###).

4. **Analyze Dependencies and Grouping**
   - Look at ALL features together and determine:
     - **Groups**: Which features are related? (e.g., features touching the same area, features that form a workflow together)
     - **Dependencies**: Which features depend on another? (e.g., "edit user profile" depends on "create user profile")
     - **Build order**: What order should features be planned in? Plan foundational features first so dependent features can reference them.
   - For each feature, build a **related features brief** — a short summary (2-3 lines max per related feature) of only the features that are directly relevant to it. This is NOT a growing accumulation. It is a fixed, targeted set determined upfront. Most features will have 0-3 related features. Independent features get none.
   - The related features brief should include: feature ID, feature name, and a one-line summary of what it creates or changes. Nothing more.
   - Store the dependency and grouping information. You will use it when dispatching planner agents.

5. **Dispatch Planner Agents**
   - Dispatch planners in the **build order** determined in step 4 (foundational features first).
   - For EACH feature, spawn a `feature-planner` agent using the `Task` tool.
   - Each planner agent receives a prompt containing:
     - The feature name, description ("What it does"), and expected outcome
     - The epic filename and the assigned feature ID (e.g., `E001-F003`)
     - The exact output file path (e.g., `specs/features/E001-F003-descriptive-name.md`)
     - The full agent roster (names, descriptions, tool restrictions)
     - The **related features brief** for this feature (only the directly relevant siblings — NOT all features). If the feature has no dependencies, omit this section entirely.
     - Which feature IDs this feature depends on (so the planner can add them to the Dependencies section)
   - Use `subagent_type: "feature-planner"` and `model: "opus"`.
   - Run planner agents **sequentially** (one at a time, `run_in_background: false`). This ensures each agent has full system resources and avoids conflicts.
   - After each planner completes, verify the output file was created using Glob. If it was not, retry that feature once.

6. **Validate**
   - After all planners have completed, list all files in `OUTPUT_DIRECTORY` matching the epic number.
   - Compare against the feature list from the epic. Verify every feature has a corresponding file.
   - If any are missing, spawn a planner agent for each missing feature.

7. **Archive Epic**
   - Ensure `specs/done/` exists. If not, create it with `mkdir -p` via Bash.
   - Move the epic file from its original location to `specs/done/` using Bash `mv`. Keep the same filename.
   - Confirm the file exists at its new location using Glob.

8. **Report**
   - Provide a summary of all files created.

## Prompt Template for Planner Agent

When spawning each planner agent, use a prompt like this (fill in the actual values):

```
You are planning the implementation of a single feature.

## Feature
- **Name**: <feature name>
- **What it does**: <from epic>
- **Expected outcome**: <from epic>

## Context
- **Epic**: <epic filename>
- **Feature ID**: <E###-F###>
- **Output file**: <OUTPUT_DIRECTORY/E###-F###-descriptive-name.md>

## Available Team Agents
<paste the agent roster here — name, description, tool restrictions for each>

## Related Features
<ONLY include this section if there are related features. Otherwise omit entirely.>
<For each related feature, one brief entry:>
- **<E###-F###>**: <feature name> — <one line: what it creates or changes>

## Dependencies
<list feature IDs this feature depends on, or "none">
This feature depends on: <E###-F001, E###-F002, ...>
These features should be built before this one. Account for their planned changes in your implementation approach.

## Instructions
Explore the codebase to understand existing patterns and architecture. Then write a complete implementation plan for this feature to the output file path above. Follow the Plan Format from your instructions exactly. Include the Dependencies section in your plan.
```

## Report

After all features are planned, provide this summary:

```
Feature plans created.

Epic: <epic filename>
Features planned: <count>
Available agents: <list agent names discovered>

Build Order:
1. <E###-F### feature name> (no dependencies)
2. <E###-F### feature name> (depends on F###)
3. ...

Files:
- <E###-F###-name.md>
- <E###-F###-name.md>
- ...

Validation: <PASS or FAIL>
<If PASS: "All features from the epic have corresponding feature plan files.">
<If FAIL: list any features from the epic that are missing a file>
```
