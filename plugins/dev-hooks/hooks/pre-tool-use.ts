#!/usr/bin/env bun

import { appendToLog, createLogger } from "./utils/log.ts";

const log = createLogger("pre-tool-use");

function isDangerousRmCommand(command: string): boolean {
  const normalized = command.toLowerCase().replace(/\s+/g, " ").trim();

  const patterns = [
    /\brm\s+.*-[a-z]*r[a-z]*f/,
    /\brm\s+.*-[a-z]*f[a-z]*r/,
    /\brm\s+--recursive\s+--force/,
    /\brm\s+--force\s+--recursive/,
    /\brm\s+-r\s+.*-f/,
    /\brm\s+-f\s+.*-r/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  const dangerousPaths = [
    /\//,
    /\/\*/,
    /~/,
    /~\//,
    /\$HOME/,
    /\.\./,
    /\*/,
    /\./,
    /\.\s*$/,
  ];

  if (/\brm\s+.*-[a-z]*r/.test(normalized)) {
    for (const pathPattern of dangerousPaths) {
      if (pathPattern.test(normalized)) {
        return true;
      }
    }
  }

  return false;
}

function isEnvFileAccess(toolName: string, toolInput: Record<string, unknown>): boolean {
  if (["Read", "Edit", "MultiEdit", "Write"].includes(toolName)) {
    const filePath = (toolInput.file_path as string) ?? "";
    if (filePath.includes(".env") && !filePath.endsWith(".env.example")) {
      return true;
    }
  }

  if (toolName === "Bash") {
    const command = (toolInput.command as string) ?? "";
    const envPatterns = [
      /\b\.env\b(?!\.sample)/,
      /cat\s+.*\.env\b(?!\.sample)/,
      /echo\s+.*>\s*\.env\b(?!\.sample)/,
      /touch\s+.*\.env\b(?!\.sample)/,
      /cp\s+.*\.env\b(?!\.sample)/,
      /mv\s+.*\.env\b(?!\.sample)/,
    ];

    for (const pattern of envPatterns) {
      if (pattern.test(command)) {
        return true;
      }
    }
  }

  return false;
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const toolName: string = inputData.tool_name ?? "";
    const toolInput: Record<string, unknown> = inputData.tool_input ?? {};
    
    log.debug(`toolName: ${toolName}, toolInput: ${JSON.stringify(toolInput)}`);

    // Block .env file access
    if (isEnvFileAccess(toolName, toolInput)) {
      log.debug('isEnvFileAccess');
      process.stderr.write(
        "BLOCKED: Access to .env files containing sensitive data is prohibited\n"
      );
      process.stderr.write("Use .env.example for template files instead\n");
      process.exit(2);
    }

    // Block dangerous rm commands
    if (toolName === "Bash") {
      const command = (toolInput.command as string) ?? "";
      if (isDangerousRmCommand(command)) {
        log.debug('isDangerousRmCommand');
        process.stderr.write(
          "BLOCKED: Dangerous rm command detected and prevented\n"
        );
        process.exit(2);
      }
    }

    // Log the event
    appendToLog("pre_tool_use", inputData);
    log.debug('isOkay');

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
