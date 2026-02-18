#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";
import { sessionStartMessage } from "./utils/messages.ts";
import { speak } from "./utils/tts/voice-notification.ts";
import { readSessionData, writeSessionData } from "./utils/session.ts";

function startSessionData(
  sessionId: string,
  nameAgent: boolean
): void {
  const sessionData = readSessionData(sessionId);

  // Record start time if not already set
  if (!sessionData.start_time) {
    sessionData.start_time = new Date().toISOString();
  }

  writeSessionData(sessionId, sessionData);
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const nameAgent = argv.has("--name-agent");
    const announce = argv.has("--announce");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const source: string = inputData.source ?? "unknown";
    const sessionId: string = inputData.session_id ?? "unknown";

    // Log session start
    appendToLog("session_start", inputData);

    startSessionData(sessionId, nameAgent);

    // Announce if requested
    if (announce) {
      speak(sessionStartMessage(source));
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
