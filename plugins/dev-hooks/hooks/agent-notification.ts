#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";
import {
  coderCompleteMessage, 
  documentationCompleteMessage, 
  featureWriterCompleteMessage, 
  reviewerCompleteMessage
} from "./utils/notification/messages.ts";
import { play } from "./utils/notification/play-message.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const args = process.argv.slice(2);
    const agentName = args.find((a) => a.startsWith("--agent="))?.split("=")[1];

    switch (agentName) {
      case "feature":
        play(featureWriterCompleteMessage());
        break;
      case "coder":
        play(coderCompleteMessage());
        break;
      case "reviewer":
        play(reviewerCompleteMessage());
        break;
      case "document":
        play(documentationCompleteMessage());
        break;
    }

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    appendToLog("agent-notification", inputData);
  } catch {
  }
}

main();
