#!/usr/bin/env bun

import { appendToLog, createLogger } from "./utils/log.ts";

const log = createLogger("pre-tool-use");

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const toolName: string = inputData.tool_name ?? "";
    const toolInput: Record<string, unknown> = inputData.tool_input ?? {};

    log.debug(`toolName: ${toolName}, toolInput: ${JSON.stringify(toolInput)}`);

    // Log the event
    appendToLog("pre_tool_use", inputData);

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
