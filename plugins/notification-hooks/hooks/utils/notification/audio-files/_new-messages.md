# New subagent sounds to generate

These subagent types are wired up in `messages.ts` (`subagentCompleteMessage`) but have no audio yet.
Generate each phrase, save as `<prefix>-01.mp3` … `<prefix>-15.mp3` in this folder.
Until the files exist, those subagents play nothing (afplay fails silently).

Suggested: pick a voice distinct from the existing ones (Maya, Colin, Logan, Wyatt) so you can tell types apart by ear.

## Explore agent — prefix `explore` (hook `agent_type`: `Explore`)

Read-only codebase search/research finished.
Using the Emma voice in ElevenLabs to generate these phrases.

1. I’ve finished exploring the codebase.
2. The search is complete.
3. I’ve found what you were looking for.
4. Exploration done. Findings are ready.
5. I’ve mapped out the relevant files.
6. The research is complete.
7. I’ve tracked down the answers.
8. I’ve gone through the code and gathered what matters.
9. Search finished. Here’s what I found.
10. I’ve scouted the area and I’m reporting back.
11. The lookup is done and the results are in.
12. I’ve traced it through the code.
13. Everything relevant has been located.
14. I’ve surveyed the project. Details are ready.
15. That’s everything I could find.

## General-purpose agent — prefix `general` (hook `agent_type`: `general-purpose`)

Catch-all multi-step task or research finished.
Using the Jerry voice in ElevenLabs to generate these phrases.

1. The task is complete.
2. I’ve finished the work you handed me.
3. All done on my end.
4. That’s taken care of.
5. The job is finished and the results are ready.
6. I’ve wrapped up the task.
7. Everything you asked for is done.
8. Task complete. Reporting back.
9. I’ve completed all the steps.
10. The work is done and ready for you.
11. I’ve handled it.
12. Finished up. Take a look when you’re ready.
13. That task is wrapped up.
14. I’m done. The results are in.
15. Everything’s complete and ready to go.
