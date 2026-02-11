import { unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export function speakElevenLabs(text: string): boolean {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return false;

  const url =
    "https://api.elevenlabs.io/v1/text-to-speech/WejK3H1m7MI9CHnIjW9K";
  const mp3 = join(tmpdir(), "tts-elevenlabs.mp3");

  const resp = Bun.spawnSync(
    [
      "curl",
      "-s",
      "--fail",
      "--max-time",
      "15",
      "-X",
      "POST",
      url,
      "-H",
      `xi-api-key: ${apiKey}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        output_format: "mp3_44100_128",
      }),
      "-o",
      mp3,
    ],
    { stdout: "pipe", stderr: "pipe" }
  );

  if (resp.exitCode !== 0) return false;
  try {
    Bun.spawnSync(["afplay", mp3], { stdout: "pipe", stderr: "pipe" });
    return true;
  } finally {
    try {
      unlinkSync(mp3);
    } catch {
      // ignore
    }
  }
}

if (import.meta.main) {
  const text = process.argv.slice(2).join(" ") || "Hello from ElevenLabs.";
  const ok = speakElevenLabs(text);
  process.exit(ok ? 0 : 1);
}
