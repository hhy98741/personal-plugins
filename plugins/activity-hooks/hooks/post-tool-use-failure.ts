#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    inputData.logged_at = new Date().toISOString();

    const logEntry = {
      timestamp: inputData.logged_at,
      session_id: inputData.session_id ?? "",
      hook_event_name: inputData.hook_event_name ?? "PostToolUseFailure",
      tool_name: inputData.tool_name ?? "unknown",
      tool_use_id: inputData.tool_use_id ?? "unknown",
      tool_input: inputData.tool_input ?? {},
      error: inputData.error ?? {},
      cwd: inputData.cwd ?? "",
      permission_mode: inputData.permission_mode ?? "",
      transcript_path: inputData.transcript_path ?? "",
      raw_input: inputData,
    };

    appendToLog("post_tool_use_failure", logEntry);

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
