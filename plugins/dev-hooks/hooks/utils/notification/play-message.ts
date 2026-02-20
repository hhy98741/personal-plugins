import { exec } from 'child_process';
import { join } from "path";

export function play(messageFile: string): void {
  try {
    const pathToFile = join(import.meta.dir, "audio-files", messageFile);
    exec(`afplay ${pathToFile}`);
  } catch {
    // Fail silently
  }
}
