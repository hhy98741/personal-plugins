#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    appendToLog("post_tool_use", inputData);

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
