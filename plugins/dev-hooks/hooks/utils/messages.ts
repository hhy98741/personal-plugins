#!/usr/bin/env bun

/**
 * Message Pool
 *
 * Provides randomized messages for TTS announcements across hook events.
 * Each function picks a random phrase from a curated list, optionally
 * incorporating the engineer's name from the environment.
 */

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

function engineerName(): string {
  return (process.env.ENGINEER_NAME ?? "").trim();
}

// --- Subagent completion (subagent-stop) ---

const SUBAGENT_COMPLETE = [
  "Subagent wrapped up its work.",
  "Subagent task is done.",
  "Your subagent just finished up.",
  "That subtask is taken care of.",
  "Subagent reporting in, task complete.",
  "Another subtask checked off.",
  "Subagent finished and ready to go.",
  "Subtask done, moving right along.",
  "Your subagent came through.",
  "That piece of work is all set.",
];

export function subagentCompleteMessage(): string {
  const name = engineerName();
  const msg = pick(SUBAGENT_COMPLETE);
  return name && Math.random() < 0.3 ? `${name}, ${msg.toLowerCase()}` : msg;
}

// --- Main agent completion (stop) ---

const AGENT_COMPLETE = [
  "All done!",
  "Work complete!",
  "Task finished!",
  "Job done!",
  "Finished!",
  "All set!",
  "Done!",
];

export function agentCompleteMessage(): string {
  const name = engineerName();
  const msg = pick(AGENT_COMPLETE);
  return name && Math.random() < 0.3 ? `${name}, ${msg.toLowerCase()}` : msg;
}

// --- Input needed (notification) ---

const INPUT_NEEDED = [
  "Your agent needs your input.",
  "Input needed to keep going.",
  "Your agent has a question for you.",
  "Quick input needed over here.",
  "Need your direction to continue.",
  "Standing by for your input.",
  "A decision is needed to proceed.",
];

export function inputNeededMessage(): string {
  const name = engineerName();
  const msg = pick(INPUT_NEEDED);
  return name && Math.random() < 0.3 ? `${name}, ${msg.toLowerCase()}` : msg;
}

// --- New session (session-start) ---

const SESSION_CLEAR = [
  "Starting fresh session.",
  "New session started.",
  "All cleared, starting fresh.",
  "New session, ready to roll.",
  "Cleared and ready.",
  "Brand new session!",
  "Starting from scratch.",
];

const SESSION_COMPACT = [
  "Context compacted, carrying on.",
  "Compacted and ready to continue.",
  "Slimmed things down, nothing lost.",
  "Compacted the conversation.",
  "Context compacted, staying focused.",
  "Compacted and good to go.",
  "Context trimmed.",
];

const SESSION_STARTUP = [
  "Claude Code session started.",
  "Session is up and running.",
  "Ready to go!",
  "New session started.",
  "Session started, standing by.",
  "Online and awaiting instructions.",
  "Session initialized.",
];

const SESSION_RESUME = [
  "Resuming previous session.",
  "Picking up where we left off.",
  "Session resumed, ready to continue.",
  "Continuing from last time.",
  "Resuming your session now.",
  "Session restored, let's keep going.",
  "Back in action!",
];

export function sessionStartMessage(source: string): string {
  const name = engineerName();
  let msg: string;

  switch (source) {
    case "clear":
      msg = pick(SESSION_CLEAR);
      break;
    case "compact":
      msg = pick(SESSION_COMPACT);
      break;
    case "startup":
      msg = pick(SESSION_STARTUP);
      break;
    case "resume":
      msg = pick(SESSION_RESUME);
      break;
    default:
      msg = pick(SESSION_STARTUP);
      break;
  }

  return name && Math.random() < 0.25 ? `${name}, ${msg.toLowerCase()}` : msg;
}
