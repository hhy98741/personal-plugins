#!/usr/bin/env bun

import { appendToLog, createLogger } from "./utils/log.ts";

const log = createLogger("subagent-start");

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const agentId: string = inputData.agent_id ?? "unknown";
    const agentType: string = inputData.agent_type ?? "unknown";

    inputData.logged_at = new Date().toISOString();

    // Log the event
    appendToLog("subagent_start", inputData);

    log.debug(
      `Logged SubagentStart: agent_id=${agentId}, agent_type=${agentType}`
    );

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
