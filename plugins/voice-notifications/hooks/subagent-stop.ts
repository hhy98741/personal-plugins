#!/usr/bin/env bun

import { subagentCompleteMessage } from "./utils/notification/messages.ts";
import { play } from "./utils/notification/play-message.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const notify = argv.has("--notify");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const agentType: string = inputData.agent_type ?? "unknown";
    if (notify) {
      const summaryMessage = subagentCompleteMessage(agentType);
      if (summaryMessage) {
        play(summaryMessage);
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
