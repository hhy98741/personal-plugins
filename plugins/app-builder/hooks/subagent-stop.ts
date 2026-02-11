#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { appendToLog, createLogger } from "./utils/log.ts";
import { subagentCompleteMessage } from "./utils/messages.ts";
import { speak } from "./utils/tts/voice-notification.ts";
import { acquireTtsLock, cleanupStaleLocks, releaseTtsLock } from "./utils/tts/tts-lock.ts";

const log = createLogger("subagent-stop");

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const chat = argv.has("--chat");
    const notify = argv.has("--notify");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    // Log the event
    appendToLog("subagent_stop", inputData);

    // Convert transcript to chat.json
    if (chat && inputData.transcript_path) {
      const logDir = join(process.cwd(), "logs");
      const transcriptPath: string = inputData.transcript_path;
      if (existsSync(transcriptPath)) {
        try {
          const chatData: unknown[] = [];
          const lines = readFileSync(transcriptPath, "utf-8").split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              chatData.push(JSON.parse(trimmed));
            } catch {
              // Skip invalid lines
            }
          }
          writeFileSync(
            join(logDir, "chat.json"),
            JSON.stringify(chatData, null, 2)
          );
        } catch {
          // Fail silently
        }
      }
    }

    // TTS announcement with lock
    if (notify) {
      cleanupStaleLocks(60);

      const agentId: string = inputData.agent_id ?? "unknown";
      log.debug(`=== SubagentStop for agent: ${agentId} ===`);

      const summaryMessage = subagentCompleteMessage();
      log.debug(`Generated summary_message: ${summaryMessage}`);

      if (acquireTtsLock(agentId, 30)) {
        try {
          log.debug(`Lock acquired, announcing: ${summaryMessage}`);
          speak(summaryMessage);
        } finally {
          releaseTtsLock(agentId);
          log.debug("Lock released");
        }
      } else {
        log.debug(
          `Lock timeout, announcing anyway: ${summaryMessage}`
        );
        speak(summaryMessage);
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
