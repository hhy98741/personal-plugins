import { spawnSync } from "bun";
import { existsSync } from "fs";
import { join, dirname } from "path";

function getProjectRoot(): string {
  const result = spawnSync(["git", "rev-parse", "--show-toplevel"]);
  if (result.exitCode === 0) {
    return result.stdout.toString().trim();
  }

  let currentDir = import.meta.dir;

  while (true) {
    if (existsSync(join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (currentDir === parentDir) {
      throw new Error("Project root not found");
    }
    currentDir = parentDir;
  }
}

export function getLogDir(): string {
  return join(getProjectRoot(), ".claude", "logs");
}

export function getSessionDir(): string {
  return join(getProjectRoot(), ".claude", "data", "sessions");
}

export function getTtsQueueDir(): string {
  return join(getProjectRoot(), ".claude", "data", "tts_queue");
}
