---
name: create-epic
description: Reads a product requirements document and extracts a list of high-level features into an epic file, describing what each feature does and what its expected outcome is.
disable-model-invocation: true
argument-hint: [path to requirements document]
model: opus
allowed-tools: Read, Write, Edit, Glob, Grep
hooks:
  Stop:
    - hooks:
        - type: command
          command: >-
            bun run ${CLAUDE_PLUGIN_ROOT}/hooks/validators/validate_new_file.ts
            --directory specs/epics
            --extension .md
        - type: command
          command: >-
            bun run ${CLAUDE_PLUGIN_ROOT}/hooks/validators/validate_file_contains.ts
            --directory specs/epics
            --extension .md
            --contains '# Features'
            --matches '## \d+\.\s+\w+'
            --contains '**What it does**'
            --contains '**Expected outcome**'
---

# Extract Features

Read a product requirements document and extract a clean list of high-level features from it. Each feature should describe what it does and what the expected outcome is. Save the result to `OUTPUT_DIRECTORY/E###-<descriptive-name>.md`.

## Variables

REQUIREMENTS_DOC: $1
OUTPUT_DIRECTORY: `specs/epics/`

## Instructions

- If no `REQUIREMENTS_DOC` is provided, stop and ask the user to provide the path to a requirements document.
- Check if `OUTPUT_DIRECTORY` exists using Glob. If it does not exist yet, that's fine — the Write tool will create it automatically when saving the output file. Do not fail because the directory is missing.
- Look at existing files in `OUTPUT_DIRECTORY` to determine the next epic number. Files follow the pattern `E###-<name>.md` (e.g., `E001-user-auth.md`, `E002-dashboard.md`). If no files exist, start at `E001`. Otherwise, increment from the highest existing number.
- Read the requirements document at the path provided in `REQUIREMENTS_DOC`.
- Analyze the document to identify all distinct features described or implied by the requirements.
- **Break features down into small, focused units.** Each feature should do ONE thing. Do NOT bundle multiple behaviors into a single feature. If a requirement describes several things happening, split them into separate features. There is no limit on how many features you create. Create as many as needed to fully cover every aspect of the requirements document. It is better to have too many small features than too few large ones.
- For each feature, write a plain-language description. Do NOT be technical. Write as if explaining to someone who doesn't know how software is built.
- Each feature should have exactly two parts:
  - **What it does**: A clear description of what this feature does from a user or product perspective.
  - **Expected outcome**: What should happen when this feature is working. What the user sees, experiences, or what state changes.
- Do NOT include implementation details, technical architecture, code references, database schemas, API endpoints, or anything about how the feature is built.
- Do NOT include team orchestration, task assignments, or build steps. This is strictly a feature list.
- Group related features logically but keep each feature self-contained and understandable on its own.
- Generate the filename using the pattern `E###-<descriptive-kebab-case-name>.md` where `###` is the next available number (zero-padded to 3 digits). The descriptive part should reflect the content (e.g., `E001-user-authentication.md`, `E002-payment-processing.md`).
- Save the feature list to `OUTPUT_DIRECTORY/<filename>`.

## Workflow

1. **Setup** - Check if `OUTPUT_DIRECTORY` exists. If not, create it. Then list existing files to determine the next `E###` number.
2. **Read** - Read the requirements document at the path in `REQUIREMENTS_DOC`.
3. **Identify** - Go through the document and identify every distinct feature, whether it's explicitly stated or implied by the requirements. Break large behaviors into small, focused features.
4. **Describe** - For each feature, write a non-technical description of what it does and what the expected outcome is.
5. **Organize** - Order the features logically. Group related features together.
6. **Save** - Save the feature list to `OUTPUT_DIRECTORY/E###-<descriptive-name>.md`.
7. **Validate** - Re-read the original requirements document. Go through it line by line and compare it against the feature list you just created. Check that every requirement, behavior, and expectation in the original document is accounted for by at least one feature. If anything is missing, add the missing features to the file. If a feature only partially covers a requirement, split or expand it. Do not move on until every part of the requirements document is covered.
8. **Report** - Provide a summary of what was created, including the validation result.

## Output Format

Follow this EXACT format. Replace `<requested content>` placeholders with actual content.

- IMPORTANT: Replace `<requested content>` with the requested content. It's been templated for you to replace.
- IMPORTANT: Anything that's NOT in `<requested content>` should be written EXACTLY as it appears in the format below.

```md
# Features

<one sentence describing what product or system these features are for>

## 1. <Feature Name>
**What it does**: <plain-language description of what this feature does>
**Expected outcome**: <what should happen when this feature works correctly>

## 2. <Feature Name>
**What it does**: <plain-language description>
**Expected outcome**: <what should happen>

## 3. <Feature Name>
...
```

## Report

After saving and validating the feature list, provide this summary:

```
Feature list created.

File: OUTPUT_DIRECTORY/<filename>.md
Features identified: <count>

Features:
- <feature 1 name>
- <feature 2 name>
- ...

Validation: <PASS or FAIL>
<If PASS: "All requirements from the source document are covered.">
<If FAIL: list any requirements that could not be mapped to a feature>
```
