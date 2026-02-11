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

// --- Subagent completion ---

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

// --- Main agent completion ---

const AGENT_COMPLETE = [
  "All done!",
  "Work complete!",
  "Task finished!",
  "Ready for your next move!",
  "Job done!",
  "That's a wrap!",
  "Finished up!",
  "All set!",
  "Done and dusted!",
  "Ready when you are!",
];

export function agentCompleteMessage(): string {
  const name = engineerName();
  const msg = pick(AGENT_COMPLETE);
  return name && Math.random() < 0.3 ? `${name}, ${msg.toLowerCase()}` : msg;
}

// --- Input needed (notification) ---

const INPUT_NEEDED = [
  "Your agent needs your input.",
  "Waiting on you for the next step.",
  "Input needed to keep going.",
  "Your agent has a question for you.",
  "Quick input needed over here.",
  "Paused and waiting for your call.",
  "Need your direction to continue.",
  "Standing by for your input.",
  "Your agent is waiting on you.",
  "A decision is needed to proceed.",
];

export function inputNeededMessage(): string {
  const name = engineerName();
  const msg = pick(INPUT_NEEDED);
  return name && Math.random() < 0.3 ? `${name}, ${msg.toLowerCase()}` : msg;
}

// --- Session start ---

const SESSION_STARTUP = [
  "Claude Code session started.",
  "Session is up and running.",
  "Ready to go!",
  "New session, let's get to work.",
  "Session started, standing by.",
  "Fired up and ready.",
  "Online and awaiting instructions.",
  "Session initialized, let's do this.",
  "Good to go!",
  "New session is live.",
];

const SESSION_RESUME = [
  "Resuming previous session.",
  "Picking up where we left off.",
  "Back at it!",
  "Session resumed, ready to continue.",
  "Continuing from last time.",
  "Welcome back!",
  "Resuming your session now.",
  "Right where we left off.",
  "Session restored, let's keep going.",
  "Back in action!",
];

const SESSION_CLEAR = [
  "Starting fresh session.",
  "Clean slate, let's go.",
  "Fresh start!",
  "New session, new beginning.",
  "All cleared, starting fresh.",
  "Fresh session, ready to roll.",
  "Starting over with a clean slate.",
  "Cleared and ready.",
  "Brand new session!",
  "Starting from scratch.",
];

export function sessionStartMessage(source: string): string {
  const name = engineerName();
  let msg: string;

  switch (source) {
    case "startup":
      msg = pick(SESSION_STARTUP);
      break;
    case "resume":
      msg = pick(SESSION_RESUME);
      break;
    case "clear":
      msg = pick(SESSION_CLEAR);
      break;
    default:
      msg = pick(SESSION_STARTUP);
      break;
  }

  return name && Math.random() < 0.3 ? `${name}, ${msg.toLowerCase()}` : msg;
}
