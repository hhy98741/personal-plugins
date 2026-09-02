# Notification Hooks Plugin

Plays audio at key points in a Claude Code session: session start/end,
waiting for input, and when the main agent or a subagent finishes. On
macOS/Linux this is a short spoken-audio clip; on Windows/WSL (which has no
reliable direct audio access) it's one of your Windows sound-scheme sounds.

## Prerequisites

- [Bun](https://bun.sh) runtime (hooks are written in TypeScript and run with Bun)

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/personal-plugins
/plugin install notification-hooks
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/personal-plugins
```

Start a new Claude Code session in your project. The plugin's hooks will be
available automatically.

## Configuration

- `NOTIFICATION_VOLUME` — playback volume from `0` to `1` (default `0.5`, macOS/Linux only)

## How it works

Each hook reads its event's JSON payload from stdin and calls `play()` in
`hooks/utils/notification/play-message.ts` with a random audio file (for
macOS/Linux) and a sound category (for Windows/WSL):

| Hook | Claude Code event | Plays when | Category |
|---|---|---|---|
| `hooks/notification.ts` | `Notification` | Claude needs input | `question` |
| `hooks/session-start.ts` | `SessionStart` | A session starts, resumes, or is compacted | `session-start` |
| `hooks/session-end.ts` | `SessionEnd` | A session ends (not on `/clear`) | `session-end` |
| `hooks/stop.ts` | `Stop` | The main agent finishes a turn | `done` |
| `hooks/subagent-stop.ts` | `SubagentStop` | A subagent finishes (`feature`, `coder`, `reviewer`, or `document` agent types) | `done` |

**macOS** (`afplay`) and **Linux** (`paplay`) play one of 15 (or 5, for
session events) mp3 clips per event, picked at random in
`hooks/utils/notification/messages.ts`. Audio files live in
`hooks/utils/notification/audio-files/`; see
[`_messages.md`](hooks/utils/notification/audio-files/_messages.md) for the
scripted text behind each clip.

**Windows/WSL** plays one of your Windows sound-scheme sounds instead, via a
one-line `powershell.exe` call. `System.Media.SystemSounds` only exposes 5
fixed slots and depends on whatever the active scheme happens to have
assigned to them (often duplicated or unassigned by default), so instead
each category maps to a named entry from Settings → Sound → Sounds, and the
hook reads the `.wav` currently bound to that entry straight from the
registry (`HKCU:\AppEvents\Schemes\Apps\.Default\<key>\.Current`) and plays
it directly:

| Category | Sound-scheme event | Registry key |
|---|---|---|
| `question` | Instant Message Notification | `Notification.IM` |
| `done` | Notification | `Notification.Default` |
| `session-start` | Device Connect | `DeviceConnect` |
| `session-end` | Device Disconnect | `DeviceDisconnect` |

To change which sound plays, reassign the event in Settings → Sound → More
sound settings → Sounds tab — no code change needed. To find the registry
key for a different event, list them all with:
```
powershell.exe -NoProfile -c 'Get-ChildItem "HKCU:\AppEvents\EventLabels" | ForEach-Object { [PSCustomObject]@{Key=$_.PSChildName; Name=(Get-ItemProperty $_.PSPath)."(default)"} } | Sort-Object Name | Format-Table -AutoSize'
```

WSL is detected by reading `/proc/version` rather than an env var, since a
hook's child process isn't guaranteed to inherit `WSL_DISTRO_NAME`.

## Project Structure

```
plugins/notification-hooks/
  .claude-plugin/plugin.json   Plugin metadata
  hooks/
    hooks.json                 Hook event registration
    notification.ts            Notification hook
    session-start.ts           SessionStart hook
    session-end.ts             SessionEnd hook
    stop.ts                    Stop hook
    subagent-stop.ts           SubagentStop hook
    utils/notification/
      play-message.ts          Cross-platform audio/system-sound playback
      messages.ts               Picks a random audio file per event
      audio-files/               The mp3 clips (macOS/Linux)
```
