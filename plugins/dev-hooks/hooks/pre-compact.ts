#!/usr/bin/env bun

import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { appendToLog } from "./utils/log.ts";

function backupTranscript(
  transcriptPath: string,
  trigger: string
): string | null {
  try {
    if (!existsSync(transcriptPath)) return null;

    const backupDir = join("logs", "transcript_backups");
    mkdirSync(backupDir, { recursive: true });

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:T]/g, (m) => (m === "T" ? "_" : ""))
      .slice(0, 15);
    const sessionName = basename(transcriptPath, ".jsonl");
    const backupName = `${sessionName}_pre_compact_${trigger}_${timestamp}.jsonl`;
    const backupPath = join(backupDir, backupName);

    copyFileSync(transcriptPath, backupPath);
    return backupPath;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const backup = argv.has("--backup");
    const verbose = argv.has("--verbose");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const sessionId: string = inputData.session_id ?? "unknown";
    const transcriptPath: string = inputData.transcript_path ?? "";
    const trigger: string = inputData.trigger ?? "unknown";
    const customInstructions: string = inputData.custom_instructions ?? "";

    // Log the event
    appendToLog("pre_compact", inputData);

    // Backup if requested
    let backupPath: string | null = null;
    if (backup && transcriptPath) {
      backupPath = backupTranscript(transcriptPath, trigger);
    }

    if (verbose) {
      let message: string;
      if (trigger === "manual") {
        message = `Preparing for manual compaction (session: ${sessionId.slice(0, 8)}...)`;
        if (customInstructions) {
          message += `\nCustom instructions: ${customInstructions.slice(0, 100)}...`;
        }
      } else {
        message = `Auto-compaction triggered due to full context window (session: ${sessionId.slice(0, 8)}...)`;
      }
      if (backupPath) {
        message += `\nTranscript backed up to: ${backupPath}`;
      }
      console.log(message);
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
