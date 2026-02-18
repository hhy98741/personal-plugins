export function speakMacOS(text: string): boolean {
  const volume = "[[volm 0.25]]";
  try {
    const proc = Bun.spawnSync(
      ["say", "-r", "180", volume + text],
      { stdout: "pipe", stderr: "pipe" }
    );
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

if (import.meta.main) {
  const text = process.argv.slice(2).join(" ") || "Hello from macOS.";
  const ok = speakMacOS(text);
  process.exit(ok ? 0 : 1);
}
