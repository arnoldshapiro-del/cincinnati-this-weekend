# CONTINUE — cincinnati-this-weekend

**Date:** 2026-09-04 · **State:** FINISHED and deployed (bafc16e).

## Task
Add Greater Washington DC as a fourth city in the existing dropdown; no other changes;
it refreshes every Wednesday with the others.

## Completed
- Four-city selector live at https://cincinnati-this-weekend-cincy.netlify.app/
  (`?city=washington-dc`). 60 verified DC events for Sep 4–6, 2026, 10 featured.
- Validator, tests, checker, docs and the Wednesday operating model all say four cities.

## What remains
1. Confirm the real Wednesday publisher. Commits on 08-26 and 09-02 (Wed ~9:30 AM ET)
   came from a publisher not found on this PC. Check Arnie's Codex/ChatGPT automations
   for "Publish This Weekend Cities" and make sure its prompt names all four city files
   (`data/<city>/current-weekend.json`, city = cincinnati · philadelphia · chicago ·
   washington-dc). The repo's tests already refuse a three-city publish.
2. After Wed Sep 9 ~9:30 AM ET: open the newest commit on GitHub. If `data/washington-dc/current-weekend.json` carries the Sep 11–13 edition, the publisher honours four cities — close this item. If only three city files moved, the publisher ignores the repo tests: it is NOT on this PC (see SESSION_NOTES 2026-09-04 addendum for everything ruled out) and must be located (another computer? a chat-app scheduled task with a GitHub connector?) and rewritten to four cities.

## Decisions
- id/folder/param `washington-dc`; display "Washington, DC"; dropdown "Greater Washington DC".
- Per-edition rows + featured ids live in `scripts/washington-dc-<date>-rows.json` /
  `-featured.json`; `scripts/build-washington-dc-<date>-edition.mjs` assembles and archives.

## Gotchas
- kennedy-center.org returns 403 to fetchers; the link checker treats 403 as reachable.
- Lancaster PA is ~135 min from DC — beyond the 120-minute road-trip cap.

## Resume prompt
"Back to cincinnati-this-weekend — read docs/CONTINUE-cincinnati-this-weekend.md and
SESSION_NOTES.md (2026-09-04 entry) first."
