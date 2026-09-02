#!/usr/bin/env bun

import { sessionStartMessage } from "./utils/notification/messages.ts";
import { play } from "./utils/notification/play-message.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const announce = argv.has("--announce");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const source: string = inputData.source ?? "unknown";

    if (announce) {
      play(sessionStartMessage(source), "session");
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
