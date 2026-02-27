import { join } from "path";

const platform = process.platform;
const isWSL = platform === "linux" && !!process.env.WSL_DISTRO_NAME;
const audioDir = join(import.meta.dir, "audio-files");

const scriptWindowsPath = isWSL
  ? Bun.spawnSync(["wslpath", "-w", join(import.meta.dir, "play-mp3.ps1")]).stdout.toString().trim()
  : "";

export function play(messageFile: string): void {
  try {
    const pathToFile = join(audioDir, messageFile);

    if (platform === "darwin") {
      Bun.spawn(["afplay", "-v", "0.5", pathToFile]);
    } else if (isWSL || platform === "win32") {
      const wslPathToFile = Bun.spawnSync(["wslpath", "-w", pathToFile]).stdout.toString().trim();
      Bun.spawn(["powershell.exe", "-c", `& '${scriptWindowsPath}' '${wslPathToFile}'`]);
    } else if (platform === "linux") {
      Bun.spawn(["paplay", pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
