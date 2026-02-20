import { join } from "path";

export function play(messageFile: string): void {
  try {
    const pathToFile = join(import.meta.dir, "audio-files", messageFile);
    const platform = process.platform;

    if (platform === "darwin") {
      // macOS
      Bun.spawn(["afplay", "-v", "0.33", pathToFile]);
    } else if (platform === "linux") {
      // Linux
      Bun.spawn(["paplay", pathToFile]);
    } else if (platform === "win32") {
      // Windows
      Bun.spawn(["powershell", "-c", `(New-Object Media.SoundPlayer '${pathToFile}').PlaySync();`]);
    }
  } catch {
    // Fail silently
  }
}
