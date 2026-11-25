#!/usr/bin/env bun

import { agentCompleteMessage } from "./utils/notification/messages.ts";
import { play } from "./utils/notification/play-message.ts";

interface BackgroundTask {
  id: string;
  type: string;
  status?: string;
}

interface SessionCron {
  id: string;
  recurring?: boolean;
}

/**
 * True when the session is only paused, waiting for background work to wake
 * the main agent back up (e.g. a skill handed off to a background subagent).
 *
 * Claude Code sends `background_tasks` and `session_crons` on Stop. Any
 * background task counts as in flight (the docs don't list `status` values,
 * so we don't try to filter them). A one-shot cron (`recurring: false`, e.g.
 * ScheduleWakeup) means a wake-up is pending; a recurring one (`/loop`) does
 * not block, so each loop iteration still notifies.
 *
 * If the fields are missing (older Claude Code, or the task registry wasn't
 * reachable), we fall back to notifying.
 */
function isWaitingOnBackgroundWork(inputData: {
  background_tasks?: BackgroundTask[];
  session_crons?: SessionCron[];
}): boolean {
  const tasks = Array.isArray(inputData.background_tasks) ? inputData.background_tasks : [];
  const crons = Array.isArray(inputData.session_crons) ? inputData.session_crons : [];
  return tasks.length > 0 || crons.some((cron) => cron.recurring === false);
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const argv = new Set(process.argv.slice(2));
    const notify = argv.has("--notify");

    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    // Stop events from inside a subagent carry agent_id; only announce the main agent.
    if (inputData.agent_id) process.exit(0);

    // Not really done yet: background work will resume the main agent.
    if (isWaitingOnBackgroundWork(inputData)) process.exit(0);

    if (notify) {
      play(agentCompleteMessage(), "done");
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
