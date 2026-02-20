import { join } from "path";

export function play(messageFile: string): void {
  try {
    const pathToFile = join(import.meta.dir, "audio-files", messageFile);
    Bun.spawn(["afplay", pathToFile]);
  } catch {
    // Fail silently
  }
}
