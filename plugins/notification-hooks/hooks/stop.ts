#!/usr/bin/env bun

import { agentCompleteMessage } from "./utils/notification/messages.ts";
import { play } from "./utils/notification/play-message.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const notify = argv.has("--notify");

    await Bun.stdin.text();

    if (notify) {
      play(agentCompleteMessage(), "done");
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
