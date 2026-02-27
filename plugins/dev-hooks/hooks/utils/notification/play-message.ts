import { join } from "path";

const scriptWindowsPath = Bun.spawnSync(["wslpath", "-w", join(import.meta.dir, "play-mp3.ps1")]).stdout.toString().trim();

export function play(messageFile: string): void {
  try {
    const pathToFile = join(import.meta.dir, "audio-files", messageFile);
    const platform = process.platform;
    const isWSL = platform === "linux" && !!process.env.WSL_DISTRO_NAME;

    if (platform === "darwin") {
      // macOS
      Bun.spawn(["afplay", "-v", "0.5", pathToFile]);
    } else if (isWSL || platform === "win32") {
      // WSL or Windows
      const messageWindowsPath = Bun.spawnSync(["wslpath", "-w", pathToFile]).stdout.toString().trim();
      Bun.spawn(["powershell.exe", "-c", `& '${scriptWindowsPath}' '${messageWindowsPath}'`]);
    } else if (platform === "linux") {
      // Linux
      Bun.spawn(["paplay", pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
