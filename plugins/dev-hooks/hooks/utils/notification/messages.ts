#!/usr/bin/env bun

/**
 * Message Pool
 *
 * Provides randomized messages for announcements across hook events.
 * Each function picks a random phrase from a curated list of files.
 * 
 * See the [list of messages](./audio-files/_messages.md)
 */

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

// --- Coder agent completion (coder-stop) ---

const CODER_COMPLETE = [
  "coder-01.mp3",
  "coder-02.mp3",
  "coder-03.mp3",
  "coder-04.mp3",
  "coder-05.mp3",
  "coder-06.mp3",
  "coder-07.mp3",
  "coder-08.mp3",
  "coder-09.mp3",
  "coder-10.mp3",
  "coder-11.mp3",
  "coder-12.mp3",
  "coder-13.mp3",
  "coder-14.mp3",
  "coder-15.mp3",
];

export function coderCompleteMessage(): string {
  return pick(CODER_COMPLETE);
}

// --- Reviewer agent completion (reviewer-stop) ---

const REVIEWER_COMPLETE = [
  "reviewer-01.mp3",
  "reviewer-02.mp3",
  "reviewer-03.mp3",
  "reviewer-04.mp3",
  "reviewer-05.mp3",
  "reviewer-06.mp3",
  "reviewer-07.mp3",
  "reviewer-08.mp3",
  "reviewer-09.mp3",
  "reviewer-10.mp3",
  "reviewer-11.mp3",
  "reviewer-12.mp3",
  "reviewer-13.mp3",
  "reviewer-14.mp3",
  "reviewer-15.mp3",
];

export function reviewerCompleteMessage(): string {
  return pick(REVIEWER_COMPLETE);
}

// --- Main agent completion (stop) ---

const AGENT_COMPLETE = [
  "stop-01.mp3",
  "stop-02.mp3",
  "stop-03.mp3",
  "stop-04.mp3",
  "stop-05.mp3",
  "stop-06.mp3",
  "stop-07.mp3",
  "stop-08.mp3",
  "stop-09.mp3",
  "stop-10.mp3",
  "stop-11.mp3",
  "stop-12.mp3",
  "stop-13.mp3",
  "stop-14.mp3",
  "stop-15.mp3",
];

export function agentCompleteMessage(): string {
  return pick(AGENT_COMPLETE);
}

// --- Input needed (notification) ---

const INPUT_NEEDED = [
  "notification-01.mp3",
  "notification-02.mp3",
  "notification-03.mp3",
  "notification-04.mp3",
  "notification-05.mp3",
  "notification-06.mp3",
  "notification-07.mp3",
  "notification-08.mp3",
  "notification-09.mp3",
  "notification-10.mp3",
  "notification-11.mp3",
  "notification-12.mp3",
  "notification-13.mp3",
  "notification-14.mp3",
  "notification-15.mp3",
];

export function inputNeededMessage(): string {
  return pick(INPUT_NEEDED);
}

// --- End session (session-end) ---

const SESSION_END = [
  "session-end-01.mp3",
  "session-end-02.mp3",
  "session-end-03.mp3",
  "session-end-04.mp3",
  "session-end-05.mp3",
];

export function sessionEndMessage(): string {
  return pick(SESSION_END);
}

// --- New session (session-start) ---

const SESSION_CLEAR = [
  "session-clear-01.mp3",
  "session-clear-02.mp3",
  "session-clear-03.mp3",
  "session-clear-04.mp3",
  "session-clear-05.mp3",
];

const SESSION_COMPACT = [
  "session-compact-01.mp3",
  "session-compact-02.mp3",
  "session-compact-03.mp3",
  "session-compact-04.mp3",
  "session-compact-05.mp3",
];

const SESSION_STARTUP = [
  "session-startup-01.mp3",
  "session-startup-02.mp3",
  "session-startup-03.mp3",
  "session-startup-04.mp3",
  "session-startup-05.mp3",
];

const SESSION_RESUME = [
  "session-resume-01.mp3",
  "session-resume-02.mp3",
  "session-resume-03.mp3",
  "session-resume-04.mp3",
  "session-resume-05.mp3",
];

export function sessionStartMessage(source: string): string {
  switch (source) {
    case "clear":
      return pick(SESSION_CLEAR);
    case "compact":
      return pick(SESSION_COMPACT);
    case "startup":
      return pick(SESSION_STARTUP);
    case "resume":
      return pick(SESSION_RESUME);
  }

  return pick(SESSION_STARTUP);
}
