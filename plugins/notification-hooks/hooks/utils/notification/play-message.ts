import { readFileSync } from "fs";
import { join } from "path";

// WSL_DISTRO_NAME isn't guaranteed to reach a hook's child process, so detect
// WSL directly from the kernel version string instead (always present).
function isRunningUnderWSL(): boolean {
  try {
    return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}

const platform = process.platform;
const isWSL = platform === "linux" && isRunningUnderWSL();
const audioDir = join(import.meta.dir, "audio-files");

export type SoundCategory = "question" | "done" | "session";

// Windows/WSL has no reliable access to the audio device to play our mp3s
// (and shelling out to PowerShell + MediaPlayer to do it was both slow to
// start and, under concurrent hook events, prone to piling up for minutes).
// Use the OS's own named system sounds instead — System.Media.SystemSounds
// is part of System.dll, already loaded in every PowerShell host, so this
// needs no assembly loading the way MediaPlayer/PresentationCore did.
const SYSTEM_SOUND: Record<SoundCategory, string> = {
  question: "Question", // Notification (Claude is waiting for input)
  done: "Asterisk", // Stop / SubagentStop (a turn or subagent finished)
  session: "Exclamation", // SessionStart / SessionEnd
};

export function play(messageFile: string, category: SoundCategory): void {
  try {
    const volume = process.env.NOTIFICATION_VOLUME ?? "0.5";

    if (platform === "darwin") {
      const pathToFile = join(audioDir, messageFile);
      Bun.spawn(["afplay", "-v", volume, pathToFile]);
    } else if (isWSL || platform === "win32") {
      const sound = SYSTEM_SOUND[category];
      Bun.spawn(
        [
          "powershell.exe",
          "-NoProfile",
          "-c",
          `[System.Media.SystemSounds]::${sound}.Play(); Start-Sleep -Milliseconds 500`,
        ],
        { stdio: ["ignore", "ignore", "ignore"] }
      );
    } else if (platform === "linux") {
      const pathToFile = join(audioDir, messageFile);
      Bun.spawn(["paplay", `--volume=${Math.round(parseFloat(volume) * 65536)}`, pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
