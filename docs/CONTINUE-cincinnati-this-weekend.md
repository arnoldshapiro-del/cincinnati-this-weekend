# CONTINUE — cincinnati-this-weekend

**Date:** 2026-09-16 · **State:** Sep 18–20 editions LIVE in all four cities (2cca6b5).

## What remains
1. **Wednesday robot permission.** Claude scheduled task `cincinnati-weekend-refresh`
   ("This Weekend — Wednesday four-city publish", Wed ~9:35 AM ET) is the only publisher, but its
   app registry entry has no `permissionMode`, so unattended runs freeze on the first command.
   Arnie sets it (routine settings in the Claude app) to run without asking, like Ela's daily task.
   Until then each Wednesday needs a person — or run the publish in a session as on 2026-09-16.
2. Next edition: Sep 25–27 (run Wed Sep 23). Copy `scripts/build-2026-09-18-editions.mjs` to the new
   Friday date; rows go in `scripts/editions/<friday>/<city>-rows.json` + `-featured.json`.

## Rules learned
- Tests need ≥50 events AND ≥1 road trip (91–120 min) in EVERY city, exactly 10 featured.
- Codex automation is PAUSED — it never published in 4 runs; don't re-enable.
- A frozen old robot session "This Weekend — Wednesday four-city publish" (09-16) sits idle — never approve it.

## Resume prompt
"Back to the weekend app — read docs/CONTINUE-cincinnati-this-weekend.md and the newest SESSION_NOTES.md entry."
