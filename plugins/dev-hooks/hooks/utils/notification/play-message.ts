import { join } from "path";

export function play(messageFile: string): void {
  try {
    const pathToFile = join(import.meta.dir, "audio-files", messageFile);
    const platform = process.platform;

    if (platform === "darwin") {
      // macOS
      Bun.spawn(["afplay", pathToFile]);
    } else if (platform === "linux") {
      // Linux
      Bun.spawn(["paplay", pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
