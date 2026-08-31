#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getLogDir } from "./utils/dir.ts";
import { appendToLog } from "./utils/log.ts";

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const chat = argv.has("--chat");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    // Convert transcript to chat.json
    if (chat && inputData.transcript_path) {
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
            join(getLogDir(), "chat.json"),
            JSON.stringify(chatData, null, 2)
          );
        } catch {
          // Fail silently
        }
      }
    }

    // Log the event
    appendToLog("stop", inputData);

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
