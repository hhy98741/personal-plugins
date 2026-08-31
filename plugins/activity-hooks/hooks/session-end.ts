#!/usr/bin/env bun

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { appendToLog } from "./utils/log.ts";

function performCleanup(): string[] {
  const actions: string[] = [];
  const logDir = "logs";

  if (existsSync(logDir)) {
    // Remove .tmp files
    try {
      for (const file of readdirSync(logDir)) {
        if (file.endsWith(".tmp")) {
          try {
            unlinkSync(join(logDir, file));
            actions.push(`Removed temp file: ${file}`);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }

    // Remove stale chat.json (older than 24 hours)
    const chatFile = join(logDir, "chat.json");
    if (existsSync(chatFile)) {
      try {
        const fileAge =
          Date.now() / 1000 - statSync(chatFile).mtimeMs / 1000;
        if (fileAge > 86400) {
          unlinkSync(chatFile);
          actions.push("Removed stale chat.json (older than 24 hours)");
        }
      } catch {
        // ignore
      }
    }
  }

  return actions;
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const cleanup = argv.has("--cleanup");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const sessionId: string = inputData.session_id ?? "unknown";

    // Add timestamp
    inputData.logged_at = new Date().toISOString();

    // Log session end
    const logDir = "logs";
    appendToLog("session_end", inputData);

    // Cleanup if requested
    if (cleanup) {
      const cleanupActions = performCleanup();
      if (cleanupActions.length > 0) {
        const cleanupLog = {
          session_id: sessionId,
          cleanup_at: new Date().toISOString(),
          actions: cleanupActions,
        };

        const cleanupFile = join(logDir, "cleanup.json");
        let cleanupData: unknown[] = [];
        if (existsSync(cleanupFile)) {
          try {
            cleanupData = JSON.parse(readFileSync(cleanupFile, "utf-8"));
          } catch {
            cleanupData = [];
          }
        }
        cleanupData.push(cleanupLog);
        writeFileSync(cleanupFile, JSON.stringify(cleanupData, null, 2));
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
