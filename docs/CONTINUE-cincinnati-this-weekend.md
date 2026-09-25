# CONTINUE — cincinnati-this-weekend

**Date:** 2026-09-25 · **Edition source:** Sep 25–27, 2026 prepared for Git-linked production release. Read the latest `SESSION_NOTES.md` entry and verify the live site/commit before treating it as deployed.

## Current workflow
1. The Claude desktop task `cincinnati-weekend-refresh` is the only weekly publisher. It targets Wednesday 9:35 AM Eastern for all four cities. Arnie authorized unattended execution on Sep 25; only this task's registry record now has `permissionMode: bypassPermissions`. The Sep 30 run will be the first real unattended proof.
2. The Codex automation `publish-cincinnati-this-weekend` remains PAUSED. Do not enable a second publisher.
3. Each city needs at least 50 verified event-day cards, exactly 10 featured picks, and a 91–120-minute road trip. The archived prior edition is Sep 18–20. Source inputs and the dated builder live under `scripts/editions/2026-09-25/` and `scripts/build-2026-09-25-editions.mjs`.
4. Run `npm test`, `node --use-system-ca scripts/check-source-links.mjs`, browser QA, then push `main`. Confirm Netlify production `ready`, `manual_deploy=false`, and `commit_ref` equal to the final pushed SHA; read back all four live JSON files and homepage.

## User-facing behavior
The site shows the edition's actual dates. The new "Check for new edition" button requests fresh data and reports when the publisher has not released a newer edition; it does not generate events. Expired editions remain visibly marked. Listings without a published start time cannot be exported to a calendar with an invented time.

## Resume prompt
"Back to the weekend app — read docs/CONTINUE-cincinnati-this-weekend.md and the newest SESSION_NOTES.md entry. Check the current live site and Git commit first."
