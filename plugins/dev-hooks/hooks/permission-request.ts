#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";

// Safe bash commands that can be auto-allowed
const SAFE_BASH_COMMANDS = [
  /^ls\b/,
  /^pwd\b/,
  /^echo\b/,
  /^cat\b(?!.*>)/,
  /^head\b/,
  /^tail\b/,
  /^wc\b/,
  /^which\b/,
  /^whereis\b/,
  /^type\b/,
  /^file\b/,
  /^stat\b/,
  /^git\s+(status|log|diff|show|branch|tag)\b/,
  /^git\s+remote\s+-v\b/,
  /^npm\s+(list|ls|outdated|view)\b/,
  /^pip\s+(list|show|freeze)\b/,
  /^uv\s+(pip\s+list|tree)\b/,
  /^python\s+--version\b/,
  /^node\s+--version\b/,
  /^npm\s+--version\b/,
];

function isSafeBashCommand(command: string): boolean {
  if (!command) return false;
  const normalized = command.trim();
  return SAFE_BASH_COMMANDS.some((p) => p.test(normalized));
}

type ToolChecker = (toolInput: Record<string, unknown>) => boolean;

const READ_ONLY_PATTERNS: Record<string, ToolChecker> = {
  Read: () => true,
  Glob: () => true,
  Grep: () => true,
  Bash: (toolInput) => isSafeBashCommand((toolInput.command as string) ?? ""),
};

function shouldAutoAllow(
  toolName: string,
  toolInput: Record<string, unknown>
): boolean {
  const checker = READ_ONLY_PATTERNS[toolName];
  return checker ? checker(toolInput) : false;
}

function getAutoAllowReason(
  toolName: string,
  toolInput: Record<string, unknown>
): string {
  switch (toolName) {
    case "Read":
      return `Read operation auto-allowed: ${toolInput.file_path ?? "unknown"}`;
    case "Glob":
      return `Glob pattern search auto-allowed: ${toolInput.pattern ?? "unknown"}`;
    case "Grep":
      return `Grep search auto-allowed: ${toolInput.pattern ?? "unknown"}`;
    case "Bash": {
      const cmd = ((toolInput.command as string) ?? "unknown").slice(0, 50);
      return `Safe bash command auto-allowed: ${cmd}...`;
    }
    default:
      return `${toolName} auto-allowed (read-only operation)`;
  }
}

function createAllowResponse(updatedInput?: Record<string, unknown>): object {
  const decision: Record<string, unknown> = { behavior: "allow" };
  if (updatedInput) decision.updatedInput = updatedInput;
  return {
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision,
    },
  };
}

function createDenyResponse(message: string, interrupt = false): object {
  return {
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision: { behavior: "deny", message, interrupt },
    },
  };
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const autoAllow = argv.has("--auto-allow");
    const logOnly = argv.has("--log-only");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const toolName: string = inputData.tool_name ?? "";
    const toolInput: Record<string, unknown> = inputData.tool_input ?? {};
    const hookEventName: string = inputData.hook_event_name ?? "";

    if (hookEventName !== "PermissionRequest") {
      process.exit(0);
    }

    appendToLog("permission_request", inputData);

    if (logOnly) {
      process.exit(0);
    }

    if (autoAllow && shouldAutoAllow(toolName, toolInput)) {
      const _reason = getAutoAllowReason(toolName, toolInput);
      const response = createAllowResponse();
      console.log(JSON.stringify(response));
      process.exit(0);
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
