import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";

const LOCK_DIR = join(process.cwd(), ".claude", "data", "tts_queue");
const LOCK_SENTINEL = join(LOCK_DIR, "tts.lock.d");
const LOCK_FILE = join(LOCK_DIR, "tts.lock");

export function cleanupStaleLocks(maxAgeSeconds = 60): void {
  if (!existsSync(LOCK_FILE)) return;
  try {
    let age: number;
    try {
      const info = JSON.parse(readFileSync(LOCK_FILE, "utf-8"));
      if (info.timestamp) {
        age =
          (Date.now() - new Date(info.timestamp).getTime()) / 1000;
      } else {
        age = (Date.now() - statSync(LOCK_FILE).mtimeMs) / 1000;
      }

      // Check if PID is still running
      if (info.pid && age > maxAgeSeconds) {
        try {
          process.kill(info.pid, 0); // signal 0 = check existence
          return; // Still running, don't clean up
        } catch {
          // Process gone, safe to clean up
        }
      }
    } catch {
      age = (Date.now() - statSync(LOCK_FILE).mtimeMs) / 1000;
    }

    if (age > maxAgeSeconds) {
      try {
        rmdirSync(LOCK_SENTINEL);
      } catch {
        // ignore
      }
      try {
        unlinkSync(LOCK_FILE);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export function acquireTtsLock(agentId: string, timeout = 30): boolean {
  mkdirSync(LOCK_DIR, { recursive: true });
  const start = Date.now();
  let retryMs = 100;

  while (true) {
    if (Date.now() - start >= timeout * 1000) return false;
    try {
      mkdirSync(LOCK_SENTINEL); // atomic — fails if already exists
      writeFileSync(
        LOCK_FILE,
        JSON.stringify({
          agent_id: agentId,
          timestamp: new Date().toISOString(),
          pid: process.pid,
        })
      );
      return true;
    } catch {
      // Lock held, retry
    }
    Bun.sleepSync(retryMs);
    retryMs = Math.min(retryMs * 1.5, 1000);
  }
}

export function releaseTtsLock(_agentId: string): void {
  try {
    rmdirSync(LOCK_SENTINEL);
  } catch {
    // ignore
  }
  try {
    writeFileSync(LOCK_FILE, "");
  } catch {
    // ignore
  }
}
