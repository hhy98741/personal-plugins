---
description: Configure app-builder settings
allowed-tools: Read, Write, Edit, AskUserQuestion, Bash(echo *), Bash(mkdir *), Bash(sed *), Bash(test *)
---

# App Builder Plugin Setup

Configure the app-builder plugin.

## Arguments

- **No arguments**: Interactive mode (asks questions)

## Tasks

### 1. Resolve project directory

Use the current working directory as the target directory for the `.env.example` file.

Store the resolved path as `PROJECT_DIR` for subsequent steps.

### 2. Determine configuration

Use AskUserQuestion to ask the user:

1. What name do you want your agent to address you by?
    - Allow the user to type in a response
    - **Validate**: The name must only contain letters, numbers, spaces, hyphens, and underscores. If the input contains other characters (quotes, dollar signs, backticks, etc.), ask again with a note about allowed characters.

2. What level of logging do you want to have?
    - Options: DEBUG, INFO, WARN, ERROR

### 3. Create plugin directories and .gitignore

1. Create the following directories if they don't already exist:
    - `PROJECT_DIR/.claude/logs`
    - `PROJECT_DIR/.claude/data`
2. Create `PROJECT_DIR/.claude/.gitignore` if it doesn't exist, or update it if it does. Ensure it contains the following entries (append any that are missing, don't duplicate existing ones):

```gitignore
logs/
data/
```

### 4. Update environment file

1. Create `PROJECT_DIR/.env.example` if it doesn't exist.
2. Read the existing `.env.example` file contents.
3. If the file already contains a `## Begin app-builder environment variables` block, **replace everything** between `## Begin app-builder environment variables` and `## End app-builder environment variables` (inclusive) with the new block below.
4. If no existing block is found, append the block to the end of the file.

```env

## Begin app-builder environment variables
ENGINEER_NAME=$1
LOG_LEVEL=$2
## End app-builder environment variables
```

### 5. Remind user to copy variables to .env

After updating `.env.example`, tell the user:

> Your settings have been saved to `.env.example`. To activate them, copy the new variables to your `.env` file:
>
> ```bash
> cp .env.example .env
> ```
>
> Or if you already have a `.env` file with other variables, manually copy the `app-builder` block from `.env.example` into your `.env` file.
>
> **Important:** `.env` contains sensitive data and should never be committed to git. Make sure `.env` is in your `.gitignore`.

## Usage

```bash
/app-builder:setup
```

## Manual Setup

If you prefer to configure the plugin manually instead of running `/app-builder:setup`:

1. Create the plugin directories:
    ```bash
    mkdir -p .claude/logs .claude/data
    ```

2. Create `.claude/.gitignore` with the following contents:
    ```gitignore
    logs/
    data/
    ```

3. Add the following to your project's `.env.example` file (create it if it doesn't exist):
    ```env
    ## Begin app-builder environment variables
    ENGINEER_NAME=YourName
    LOG_LEVEL=INFO
    ## End app-builder environment variables
    ```

4. Copy the variables to your actual `.env` file:
    ```bash
    cp .env.example .env
    ```
    Or if you already have a `.env` with other variables, manually copy the `app-builder` block into it.

## Notes

- Running `/app-builder:setup` again will update existing settings in `.env.example` in-place rather than creating duplicates.
- After running setup, remember to copy the updated variables from `.env.example` to your `.env` file.
- `.env` contains sensitive data and should never be committed to git.
