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

export type SoundCategory = "question" | "done" | "session-start" | "session-end";

// Windows/WSL has no reliable access to the audio device to play our mp3s
// (and shelling out to PowerShell + MediaPlayer to do it was both slow to
// start and, under concurrent hook events, prone to piling up for minutes).
// System.Media.SystemSounds only exposes 5 fixed slots (Asterisk/Beep/
// Exclamation/Hand/Question) and depends on whatever the active Sound Scheme
// happens to have assigned to them (often duplicated or left unassigned by
// default), so instead read the .wav currently bound to a specific named
// AppEvents entry straight from the registry — the same place Settings >
// Sound > Sounds writes to — and play that file directly. Key names come
// from `HKCU:\AppEvents\EventLabels` (its default value is the display name
// shown in that Sounds tab, e.g. "DeviceConnect" -> "Device Connect").
const SOUND_EVENT_KEY: Record<SoundCategory, string> = {
  question: "Notification.IM", // "Instant Message Notification"
  done: "Notification.Default", // "Notification"
  "session-start": "DeviceConnect", // "Device Connect"
  "session-end": "DeviceDisconnect", // "Device Disconnect"
};

export function play(messageFile: string, category: SoundCategory): void {
  try {
    const volume = process.env.NOTIFICATION_VOLUME ?? "0.5";

    if (platform === "darwin") {
      const pathToFile = join(audioDir, messageFile);
      Bun.spawn(["afplay", "-v", volume, pathToFile]);
    } else if (isWSL || platform === "win32") {
      const eventKey = SOUND_EVENT_KEY[category];
      const script =
        `$p = (Get-ItemProperty "HKCU:\\AppEvents\\Schemes\\Apps\\.Default\\${eventKey}\\.Current" -ErrorAction SilentlyContinue)."(default)"; ` +
        `if ($p) { (New-Object Media.SoundPlayer $p).PlaySync() }`;
      Bun.spawn(["powershell.exe", "-NoProfile", "-c", script], {
        stdio: ["ignore", "ignore", "ignore"],
      });
    } else if (platform === "linux") {
      const pathToFile = join(audioDir, messageFile);
      Bun.spawn(["paplay", `--volume=${Math.round(parseFloat(volume) * 65536)}`, pathToFile]);
    }
  } catch {
    // Fail silently
  }
}
