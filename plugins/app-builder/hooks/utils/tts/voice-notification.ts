import { speakElevenLabs } from "./elevenlabs-tts.ts";
import { speakMacOS } from "./macos-say-tts.ts";

export function speak(message: string): void {
  try {
    // Try ElevenLabs (highest quality)
    if (process.env.ELEVENLABS_API_KEY) {
      if (speakElevenLabs(message)) return;
    }

    // Fallback to macOS native say (offline, no dependencies)
    speakMacOS(message);
  } catch {
    // Fail silently
  }
}
