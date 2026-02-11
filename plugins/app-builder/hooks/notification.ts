#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";
import { inputNeededMessage } from "./utils/messages.ts";
import { speak } from "./utils/tts/voice-notification.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const args = new Set(process.argv.slice(2));
    const notify = args.has("--notify");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    appendToLog("notification", inputData);

    if (notify && inputData.message !== "Claude is waiting for your input") {
      speak(inputNeededMessage());
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
