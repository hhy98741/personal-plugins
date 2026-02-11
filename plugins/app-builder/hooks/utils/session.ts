import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SESSIONS_DIR = join(process.cwd(), ".claude", "data", "sessions");

export interface SessionData {
  session_id: string;
  prompts: string[];
  agent_name?: string;
  start_time?: string;
}

function sessionFilePath(sessionId: string): string {
  return join(SESSIONS_DIR, `${sessionId}.json`);
}

export function readSessionData(sessionId: string): SessionData {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const sessionFile = sessionFilePath(sessionId);

  if (existsSync(sessionFile)) {
    try {
      return JSON.parse(readFileSync(sessionFile, "utf-8"));
    } catch {
      // Corrupted file — start fresh
    }
  }

  return { session_id: sessionId, prompts: [] };
}

export function writeSessionData(
  sessionId: string,
  data: SessionData
): void {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  try {
    writeFileSync(sessionFilePath(sessionId), JSON.stringify(data, null, 2));
  } catch {
    // Silently fail
  }
}
