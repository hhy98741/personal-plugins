import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getSessionDir } from "./dir.ts";

export interface SessionData {
  session_id: string;
  prompts: string[];
  agent_name?: string;
  start_time?: string;
}

function sessionFilePath(sessionId: string): string {
  return join(getSessionDir(), `${sessionId}.json`);
}

export function readSessionData(sessionId: string): SessionData {
  mkdirSync(getSessionDir(), { recursive: true });
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
  mkdirSync(getSessionDir(), { recursive: true });
  try {
    writeFileSync(sessionFilePath(sessionId), JSON.stringify(data, null, 2));
  } catch {
    // Silently fail
  }
}
