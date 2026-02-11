---
name: build-feature
description: Takes a feature plan from specs/features/ (or a given path), moves it to specs/in-progress/, executes the plan using team agents, validates completion, then moves the feature to specs/done/.
disable-model-invocation: true
argument-hint: [path to feature file (optional - picks first available)]
model: opus
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mv:*), Bash(mkdir:*), Task, TaskCreate, TaskUpdate, TaskList, TaskGet, TaskOutput
hooks:
  Stop:
    - hooks:
        - type: command
          command: >-
            bun run ${CLAUDE_PLUGIN_ROOT}/hooks/validators/validate_new_file.ts
            --directory specs/done
            --extension .md
---

# Build Feature

Execute a feature implementation plan. Pick a feature from `specs/features/`, move it to `specs/in-progress/` while building, orchestrate team agents to implement the plan, validate the work, then move the feature file to `specs/done/`.

## Variables

FEATURE_FILE: $1
FEATURES_DIRECTORY: `specs/features/`
IN_PROGRESS_DIRECTORY: `specs/in-progress/`
DONE_DIRECTORY: `specs/done/`
TEAM_MEMBERS_DIR: `${CLAUDE_PLUGIN_ROOT}/agents/team/`

## Instructions

- You are a **team lead / orchestrator**. You do NOT write code or modify the codebase directly. You deploy team agents to do the work.
- Your job is to read the feature plan, create tasks, deploy agents, monitor progress, and validate completion.
- **IMPORTANT**: Never write code yourself. Use `Task` to deploy coder agents for implementation work and reviewer agents to review and validate.
- If a team member fails or produces incorrect work, redeploy them with corrected instructions. Do not fix their work yourself.

## Workflow

1. **Select Feature**
   - If `FEATURE_FILE` is provided, use that path.
   - If no argument is provided, list all files in `FEATURES_DIRECTORY` using Glob.
   - If `FEATURES_DIRECTORY` is empty or does not exist, stop and tell the user there are no features to build.
   - **Check dependencies before selecting.** For each candidate feature file (starting from the first alphabetically):
     - Read the file and find the `**Dependencies**:` field near the top of the plan.
     - If dependencies is "none", this feature is eligible — select it.
     - If it lists feature IDs (e.g., `E001-F001, E001-F002`), check that **every** dependency feature file exists in `DONE_DIRECTORY` (using Glob). If all dependencies are in `specs/done/`, this feature is eligible — select it. If any dependency is missing from `specs/done/`, skip this feature and check the next one.
   - If NO features have their dependencies satisfied, stop and tell the user which features are waiting on which dependencies. List what needs to be built first.
   - Read the selected feature file to confirm it's a valid feature plan (should contain `## Task Description`, `## Step by Step Tasks`, etc.).

2. **Verify Dependencies**
   - Read the selected feature file and find the `**Dependencies**:` field.
   - If dependencies is "none", proceed.
   - If it lists feature IDs, check that each dependency feature file exists in `DONE_DIRECTORY` using Glob.
   - If any dependency is **not** in `specs/done/`, stop and tell the user. List which dependency features need to be built first. Do NOT proceed with the build.

3. **Move to In-Progress**
   - Ensure `IN_PROGRESS_DIRECTORY` exists. If not, create it with `mkdir -p` via Bash.
   - Move the feature file to `IN_PROGRESS_DIRECTORY` using Bash `mv`. Keep the same filename.
   - Confirm the file now exists at its new location using Glob.
   - Store the new path — this is where you'll read the plan from for the rest of the workflow.

4. **Read Plan**
   - Read the feature plan from its new location in `IN_PROGRESS_DIRECTORY`.
   - Parse the plan to extract:
     - **Task Description** and **Objective** — to understand what needs to be built
     - **Team Members** — who to deploy (agent types and roles)
     - **Step by Step Tasks** — the ordered task list with dependencies, assignments, and actions
     - **Acceptance Criteria** — what success looks like
     - **Validation Commands** — commands to run to verify completion

5. **Discover Team Agents**
   - Read all files in `TEAM_MEMBERS_DIR` to understand what agent types are available.
   - Match the team members listed in the plan to available agent types.
   - If the plan references an agent type that doesn't exist in `TEAM_MEMBERS_DIR`, use `general-purpose` as a fallback.

6. **Create Task List**
   - For each step in **Step by Step Tasks**, call `TaskCreate` with:
     - `subject`: The task name from the plan
     - `description`: All the specific actions listed under that task, plus any relevant context from the plan (relevant files, acceptance criteria for that task, etc.)
     - `activeForm`: A present-continuous description (e.g., "Implementing user service")
   - After creating all tasks, set up dependencies using `TaskUpdate` with `addBlockedBy` matching the **Depends On** fields from the plan.

7. **Execute Tasks**
   - Work through the task list in dependency order. For each task:
     - Use `TaskUpdate` to set it to `in_progress`.
     - Deploy the assigned team agent using `Task` with:
       - `subagent_type`: The agent type from the plan (e.g., `coder`, `reviewer`)
       - `model`: `opus` for complex tasks, `sonnet` for straightforward ones
       - `prompt`: Include the task description, specific actions, relevant file paths, and any context needed. Reference the feature plan path so the agent can read more detail if needed.
     - When the agent completes, review its output.
     - If the agent succeeded, use `TaskUpdate` to mark the task `completed`.
     - If the agent failed, retry once with clarified instructions. If it fails again, note the failure and continue to the next task.
   - **Task deployment guidelines**:
     - Tasks marked `Parallel: true` with no pending dependencies CAN be launched with `run_in_background: true` simultaneously. Use `TaskOutput` to wait for them.
     - Tasks marked `Parallel: false` or with pending dependencies MUST be run sequentially.
     - Always deploy the final validation task last, after all other tasks are complete.
   - **Resume pattern**: Store agent IDs. If a coder needs follow-up work (e.g., fixing issues found by reviewer), use `resume` to continue with its existing context.

8. **Review and Validate**
   - After all coding tasks are complete, deploy a **reviewer** agent to review the code and validate it works.
   - The reviewer receives:
     - The feature plan path (in `IN_PROGRESS_DIRECTORY`)
     - The list of all files changed or created during the build (collected from coder reports)
     - The acceptance criteria from the plan
     - The validation commands from the plan (tests, type checks, linting)
   - The reviewer will run validation commands, check acceptance criteria, review code quality, and return a verdict: **APPROVED** or **CHANGES_REQUIRED**.
   - **If APPROVED**: Proceed to Move to Done. Note any "Recommended" items in the final report but do not act on them.
   - **If CHANGES_REQUIRED**:
     - Read the reviewer's "Must Fix" list.
     - Deploy a **coder** agent with the must-fix items as its task. Include the reviewer's specific findings (file paths, line numbers, what's wrong, what's expected) so the coder knows exactly what to fix.
     - After the coder finishes, deploy the **reviewer** again to re-review.
     - Repeat the review → fix cycle up to **2 times**. If the reviewer still returns CHANGES_REQUIRED after 2 fix rounds, move to reporting with a FAIL status. The feature file stays in `IN_PROGRESS_DIRECTORY`.

9. **Move to Done**
   - Only if the reviewer verdict is APPROVED.
   - Ensure `DONE_DIRECTORY` exists. If not, create it with `mkdir -p` via Bash.
   - Move the feature file from `IN_PROGRESS_DIRECTORY` to `DONE_DIRECTORY` using Bash `mv`.
   - Confirm the file exists at its new location using Glob.

10. **Report**
   - Provide a summary of what was built.

## Prompt Template for Coder Agent

When deploying a coder agent, include this context in the prompt:

```
You are building part of a feature implementation.

## Your Task
<task name and description from the plan>

## Actions
<specific actions listed under this task in the plan>

## Context
- **Feature Plan**: <path to the feature plan in specs/in-progress/>
- **Feature**: <feature name>
- **Objective**: <from the plan>

## Relevant Files
<relevant files from the plan that apply to this task>

## Instructions
- Complete ALL actions listed above.
- Follow existing code patterns and conventions in the codebase.
- If you need more context, read the full feature plan at the path above.
- When done, provide a summary of what you built and what files you changed.
```

## Prompt Template for Reviewer Agent

```
You are reviewing and validating code written for a feature implementation.

## Feature
- **Name**: <feature name>
- **Feature ID**: <E###-F###>
- **Plan**: <path to feature plan in specs/in-progress/>

## Files Changed
<list every file created or modified during the build, one per line>
- <file1>
- <file2>

## Acceptance Criteria
<paste all acceptance criteria from the plan>

## Validation Commands
<paste all validation commands from the plan>

## Instructions
- Read the feature plan to understand what was supposed to be built.
- Read every file listed above.
- Run every validation command and record the results.
- Check every acceptance criterion.
- Review for correctness, tests, security, quality, and codebase fit.
- Group findings into Must Fix and Recommended.
- Return your verdict: APPROVED or CHANGES_REQUIRED.
```

## Prompt Template for Reviewer Fix Round

When redeploying a coder to address must-fix items from a review:

```
You are fixing issues found during code review.

## Review Findings — Must Fix
<paste the numbered must-fix items from the reviewer's report>

## Context
- **Feature Plan**: <path to the feature plan in specs/in-progress/>
- **Feature**: <feature name>

## Instructions
- Fix every must-fix item listed above. The reviewer provided file paths and descriptions of what's wrong.
- Do NOT address "Recommended" items — only fix what's in the Must Fix list.
- Run tests after your changes to make sure nothing is broken.
- Report what you fixed and what files you changed.
```

## Report

After building and validating (or failing), provide this summary:

```
Feature build complete.

Feature: <feature name>
Feature ID: <E###-F###>
Plan: <path to feature plan>
Status: <PASS or FAIL>

Tasks:
- <task 1 name>: <completed or failed>
- <task 2 name>: <completed or failed>
- ...

Review: <APPROVED or CHANGES_REQUIRED>
- Review rounds: <number of review cycles>
<If APPROVED: "Review passed. All acceptance criteria met. Feature file moved to specs/done/.">
<If CHANGES_REQUIRED after max retries: list unresolved must-fix items. Feature file remains in specs/in-progress/.>
<If there were Recommended items: list them briefly>

Files Changed:
<list of files created or modified during the build>
```
