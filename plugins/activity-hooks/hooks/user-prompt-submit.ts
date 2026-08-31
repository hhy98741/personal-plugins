#!/usr/bin/env bun

import { appendToLog } from "./utils/log.ts";
import { readSessionData, writeSessionData } from "./utils/session.ts";

function manageSessionData(
  sessionId: string,
  prompt: string
): void {
  const sessionData = readSessionData(sessionId);
  sessionData.prompts.push(prompt);
  writeSessionData(sessionId, sessionData);
}

function validatePrompt(
  prompt: string
): { isValid: boolean; reason: string | null } {
  // Blocked patterns (customize as needed)
  const blockedPatterns: [string, string][] = [
    // Example: ['rm -rf /', 'Dangerous command detected'],
  ];

  const promptLower = prompt.toLowerCase();
  for (const [pattern, reason] of blockedPatterns) {
    if (promptLower.includes(pattern.toLowerCase())) {
      return { isValid: false, reason };
    }
  }

  return { isValid: true, reason: null };
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const validate = argv.has("--validate");
    const logOnly = argv.has("--log-only");
    const storeLastPrompt = argv.has("--store-last-prompt");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const sessionId: string = inputData.session_id ?? "unknown";
    const prompt: string = inputData.prompt ?? "";

    // Log the user prompt
    appendToLog("user_prompt_submit", inputData);

    // Manage session data
    if (storeLastPrompt) {
      manageSessionData(sessionId, prompt);
    }

    // Validate prompt if requested and not in log-only mode
    if (validate && !logOnly) {
      const { isValid, reason } = validatePrompt(prompt);
      if (!isValid) {
        process.stderr.write(`Prompt blocked: ${reason}\n`);
        process.exit(2);
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
