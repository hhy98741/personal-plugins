# Voice Notifications Plugin

Plays short spoken-audio clips at key points in a Claude Code session: session
start/end, waiting for input, and when the main agent or a subagent finishes.

## Prerequisites

- [Bun](https://bun.sh) runtime (hooks are written in TypeScript and run with Bun)

## Installation

### From Plugin Marketplace

```
/plugin marketplace add hhy98741/personal-plugins
/plugin install voice-notifications
```

### Manual Installation

```
git clone https://github.com/hhy98741/claude-plugins.git ~/.claude/plugins/personal-plugins
```

Start a new Claude Code session in your project. The plugin's hooks will be
available automatically.

## Configuration

- `NOTIFICATION_VOLUME` — playback volume from `0` to `1` (default `0.5`)

## How it works

Each hook reads its event's JSON payload from stdin, picks a random audio
file for that event, and plays it via `play()` in
`hooks/utils/notification/play-message.ts`:

| Hook | Claude Code event | Plays when |
|---|---|---|
| `hooks/notification.ts` | `Notification` | Claude needs input |
| `hooks/session-start.ts` | `SessionStart` | A session starts, resumes, or is compacted |
| `hooks/session-end.ts` | `SessionEnd` | A session ends (not on `/clear`) |
| `hooks/stop.ts` | `Stop` | The main agent finishes a turn |
| `hooks/subagent-stop.ts` | `SubagentStop` | A subagent finishes (`feature`, `coder`, `reviewer`, or `document` agent types) |

Audio files live in `hooks/utils/notification/audio-files/`, grouped by event
in `hooks/utils/notification/messages.ts`; see
[`_messages.md`](hooks/utils/notification/audio-files/_messages.md) for the
scripted text behind each clip. Playback is supported on macOS (`afplay`),
Linux (`paplay`), and Windows/WSL (via `play-mp3.ps1`).

## Project Structure

```
plugins/voice-notifications/
  .claude-plugin/plugin.json   Plugin metadata
  hooks/
    hooks.json                 Hook event registration
    notification.ts            Notification hook
    session-start.ts           SessionStart hook
    session-end.ts             SessionEnd hook
    stop.ts                    Stop hook
    subagent-stop.ts           SubagentStop hook
    utils/notification/
      play-message.ts          Cross-platform audio playback
      play-mp3.ps1              Windows/WSL playback script
      messages.ts               Picks a random audio file per event
      audio-files/               The mp3 clips
```
