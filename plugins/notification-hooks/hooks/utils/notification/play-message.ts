import { join } from "path";

const platform = process.platform;
const isWSL = platform === "linux" && !!process.env.WSL_DISTRO_NAME;
const audioDir = join(import.meta.dir, "audio-files");

const scriptWindowsPath = isWSL
  ? Bun.spawnSync(["wslpath", "-w", join(import.meta.dir, "play-mp3.ps1")]).stdout.toString().trim()
  : "";

export function play(messageFile: string): void {
  try {
    const volume = process.env.NOTIFICATION_VOLUME ?? "0.5";
    const pathToFile = join(audioDir, messageFile);

    if (platform === "darwin") {
      Bun.spawn(["afplay", "-v", volume, pathToFile]);
    } else if (isWSL || platform === "win32") {
      const wslPathToFile = Bun.spawnSync(["wslpath", "-w", pathToFile]).stdout.toString().trim();
      // Fire-and-forget: spawnSync here would block the hook (and Claude Code)
      // until PowerShell finishes playing the whole clip, since play-mp3.ps1
      // has to stay alive for the duration to actually play it.
      Bun.spawn(["powershell.exe", "-c", `& '${scriptWindowsPath}' '${wslPathToFile}' -Volume ${volume}`], {
        stdio: ["ignore", "ignore", "ignore"],
      });
    } else if (platform === "linux") {
      Bun.spawn(["paplay", `--volume=${Math.round(parseFloat(volume) * 65536)}`, pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
