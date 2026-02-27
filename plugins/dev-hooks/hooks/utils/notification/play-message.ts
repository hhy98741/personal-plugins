import { join } from "path";
import { createLogger } from "../log.ts";

const log = createLogger("play-message");

const platform = process.platform;
const isWSL = platform === "linux" && !!process.env.WSL_DISTRO_NAME;
const audioDir = join(import.meta.dir, "audio-files");

const scriptWindowsPath = isWSL
  ? Bun.spawnSync(["wslpath", "-w", join(import.meta.dir, "play-mp3.ps1")]).stdout.toString().trim()
  : "";

const wslPathCache = new Map<string, string>();

function toWindowsPath(path: string): string {
  const cached = wslPathCache.get(path);
  log.debug(`Cache ${cached ? 'hit' : 'miss'}: ${path}`);
  if (cached) return cached;
  
  const result = Bun.spawnSync(["wslpath", "-w", path]).stdout.toString().trim();
  wslPathCache.set(path, result);
  return result;
}

export function play(messageFile: string): void {
  try {
    const pathToFile = join(audioDir, messageFile);

    if (platform === "darwin") {
      Bun.spawn(["afplay", "-v", "0.5", pathToFile]);
    } else if (isWSL || platform === "win32") {
      Bun.spawn(["powershell.exe", "-c", `& '${scriptWindowsPath}' '${toWindowsPath(pathToFile)}'`]);
    } else if (platform === "linux") {
      Bun.spawn(["paplay", pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
