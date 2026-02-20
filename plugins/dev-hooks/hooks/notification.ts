#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";
import { inputNeededMessage } from "./utils/notification/messages.ts";
import { play } from "./utils/notification/play-message.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const args = new Set(process.argv.slice(2));
    const notify = args.has("--notify");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    if (notify && inputData.message !== "Claude is waiting for your input") {
      play(inputNeededMessage());
    }

    appendToLog("notification", inputData);

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
