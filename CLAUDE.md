# This Weekend: multi-city guide

One verified, human-curated weekend guide serves Cincinnati, Philadelphia, Chicago, and Greater Washington DC (city id `washington-dc`: DC, Northern Virginia, suburban Maryland) through a city selector. Cincinnati remains the default. The live Git-backed Netlify site is https://cincinnati-this-weekend-cincy.netlify.app/.

## Session handoff (do this every session)
- Start: read `SESSION_NOTES.md` (the dated journal) and `CONTINUATION.md` if present, before touching anything. The newest entry says what was decided, what was verified and what is next.
- Wrap-up: add a dated entry to `SESSION_NOTES.md` with what was asked, what changed, what was verified (and how) and what is next. Commit and push it together with the work.
- Every settled decision goes in the ledger below as ONE line: what we decided, why, and what was ruled out and why. Every correction Arnie gives gets logged with his reason. Reasons matter more than facts: facts can be re-derived from the code, reasons cannot.
- Unsure what was agreed? Re-read this file and the journal before asking Arnie again.

## Decisions and why (one line each, newest last)
- Zero runtime dependencies, Netlify publishes the repository root, the UI reads `data/<city>/current-weekend.json` so weekly refreshes never need UI rewrites (2026-08-13; reason for the no-dependency choice not recorded beyond "no build step to break").
- Gallery card pushed to `arnies-app-showcase` only because Arnie explicitly asked that session; that repo is otherwise on the no-auto-update list (2026-08-13).
- Weekly refresh moved from the documented Wednesday 9:00 AM ET to Thursday ~10:08 AM ET because Arnie said do it on Thursday, with the time kept clear of Ela's 9:07 daily marketing run (2026-08-13). Later superseded, see 2026-09-16 and 2026-10-10.
- Refresh stop condition: if research cannot be verified, leave the previous edition live and say so, because a stale weekend beats a wrong one (2026-08-13).
- One standalone Wednesday Codex cron replaced the thread-bound Codex heartbeat and the desktop Claude task because neither was a dependable end-to-end publisher, and every publication must verify the exact Git SHA on Netlify (2026-08-23). Later superseded.
- Expired editions are made unmistakable in the UI, the service worker fetches weekly JSON network-first, the old exporter refuses to republish its 2026-08-14 snapshot, and the validator rejects stale editions, all because the Aug 21–23 refresh silently never happened (2026-08-23).
- Philadelphia, then Chicago, added behind one unified city selector with Cincinnati as the default (2026-08-24; reason not recorded).
- Greater Washington DC uses slug `washington-dc` for folder, city id, URL parameter and browser-storage scope so the validator's folder-equals-id rule holds (2026-09-04). Region guide URL is washington.org/dc-events because the "this weekend" page 404s.
- Sold-out shows are kept with "Sold out; check source for returns" to match the other cities (2026-09-04). Rows whose only source is a news article are dropped; road trips over 120 minutes are dropped (2026-09-04).
- All four city files refresh in one Wednesday commit, and `npm test` fails on a three-city publish, so an unknown publisher cannot quietly ship three cities (2026-09-04).
- Codex automation `publish-cincinnati-this-weekend` paused because it never published: Git certificate failures on Arnie's PC, a browser check it could not run, a link checker that blocked on any single dead URL, and four cities in one run was too much (2026-09-16).
- Publisher rewritten to Wednesday ~9:35 AM ET, all four cities, four parallel research workers, brain review, dead links dropped instead of blocking, Netlify commit_ref check (2026-09-16). The frozen desktop run was not approved because approving it would redo the week.
- Arnie explicitly approved unattended execution for the publisher; only that task was set to bypass permissions (2026-09-25). On 2026-10-03 Arnie set the routine to Auto himself because a direct file edit did not persist (the running app rewrites it), and Claude must not change that setting: it is a security setting on his account.
- Refresh button moved into the hero after Arnie's screenshot showed it below the listings, invisible on first screen (2026-09-25).
- Button renamed from "Check for new edition" to "Refresh weekend events" after Arnie's correction that the old label sounded like an app-version update; it actually reloads the latest published weekend JSON (2026-09-25).
- Sold-out Sara Bareilles concert and a sold-out Philadelphia race were excluded from the Sep 25–27 edition (2026-09-25; reason not recorded, and note it differs from the 2026-09-04 keep-sold-out rule).
- Research runs as 8 small workers (2 per city) saving JSON every 3 events because Avast WebShield killed long sub-agent runs; Arnie can add a web-shield exception for api.anthropic.com if blocks continue (2026-10-03).
- A late recovery may publish a Saturday–Sunday edition with Friday omitted, and daytime attractions closing by ~6 PM Saturday are listed Sunday only (2026-10-03, published Saturday ~5 PM).
- One cloud-owned publisher: automatic Wednesday 9:35 AM ET for all four cities plus a manual "Refresh weekend events" button through the fixed `weekend-refresh` Netlify form, sharing one control record on the `refresh-control` branch with `[skip netlify]` status commits and a rolling one-hour cooldown (2026-10-10). Ruled out: the deleted desktop Claude task, the disabled Codex automation and any overlapping publisher, because desktop runs froze on permission prompts and only ran with the app open.
- Success is claimed only when Netlify production `commit_ref` equals the pushed Git SHA and the live JSON matches; trigger setup or HTTP acceptance alone proves nothing (2026-10-10).
- Every city needs at least 45 verified events, exactly ten featured picks, unique IDs, deduplication, honest road-trip labels and "Check source" instead of a guessed price or time (standing rule; reason not recorded beyond truthfulness).
- Queen City Table is a separate app and is never modified during weekend-guide refreshes (standing rule; reason not recorded).
- Session memory lives in this file and `SESSION_NOTES.md`, never only in chat: cloud sessions start on a fresh computer, chat history gets compacted, and only files in the repo survive (2026-10-21, after Dylan Davis's "decisions.md" video). Ruled out: a separate decisions.md, because this file is the one Claude Code re-reads after compaction.

## Stack and deployment

- Zero runtime dependencies; Netlify publishes the repository root through `netlify.toml`.
- The interface reads `data/<city>/current-weekend.json`; weekly refreshes do not require UI rewrites.
- GitHub `main` is the source of truth. Publication is complete only when Netlify's production `commit_ref` matches the pushed Git SHA.

## One cloud-owned publisher

The owner reports that the former desktop Claude task `cincinnati-weekend-refresh` has been deleted. The old Codex automation `publish-cincinnati-this-weekend` was verified disabled on October 10, 2026 and remains disabled. Do not recreate the deleted Claude task or enable the old Codex automation. Do not restore desktop scheduling, change permission modes, or create overlapping publishers.

The configured cloud publisher has two entry points sharing one publisher and one conditional GitHub control record:

- Automatic: Wednesday at 9:35 AM America/New_York, all four cities.
- Manual: an explicit visitor click on “Refresh weekend events” requests research for the selected city through the fixed `weekend-refresh` Netlify form.

A rolling one-hour cooldown limits duplicate manual requests; it is not an hourly schedule. All work uses the same GitHub `main` source and existing Netlify project. The control record lives on the separate `refresh-control` branch; status commits use `[skip netlify]`.

As verified October 10, 2026, Netlify Forms, registered form `6acabd9f42301d00081875d3`, its enabled manual event subscription, the enabled Wednesday 9:35 AM Eastern schedule, and the public control record are configured. `refresh-config.json` is enabled in this activation change. Initial production commit `216b2ed` and deploy `6acabd91e93cea0008645e77` were verified ready with all four October 10–11 guides, totaling 201 event-day cards.

At the activation checkpoint, the first real manual Cincinnati request had been admitted and control job `refresh-cincinnati-20261010T223800Z` was acquired and read back at `2026-10-10T22:38:12.674Z`. Source re-verification then prepared edition `cincinnati-2026-10-10-r2`, updated `2026-10-10T22:46:15.000Z`, with 54 event-day cards, 45 distinct programs, ten featured picks, and 61 successful official source URL checks. The final outcome is recorded in `refresh-control/status.json` for that job. Trigger setup or HTTP acceptance alone does not prove a completed refresh; success requires the exact production publication and matching browser state to be verified.

Follow `WEEKLY-REFRESH.md` completely. Every event needs a real date, venue, HTTPS source URL, and verification date. Use `Check source` when a price or time is unpublished; never guess.

## Safety rails

- Run `npm test` before publication.
- Each city (including `washington-dc`) requires at least 45 verified events, exactly ten featured picks, unique IDs, deduplication, and honest road-trip labels.
- The service worker fetches all city edition files network-first.
- Saved events, followed venues, notes, and plans are scoped by city in browser storage.
- `events.js` and `data/current-weekend.json` are legacy Cincinnati snapshots and must not overwrite the city files.

Read the four `data/<city>/current-weekend.json` files for the prepared edition dates and IDs. Check the exact production Git SHA and live JSON before describing any prepared edition as published.

## Related app

Queen City Table is separate and must not be modified during weekend-guide refreshes: https://queen-city-table-cincinnati.netlify.app


## Compact Instructions
When this conversation is compacted, the summary must keep, in this order:
1. Every decision made this session, with its reason and what was ruled out.
2. Every correction Arnie gave, in his words where possible, and his reason.
3. What has been verified and how (test run, build, live check with URL and time) versus what is only claimed or planned.
4. What is next and what is still open, including anything waiting on Arnie's yes.
5. The exact files changed, the branch, and whether the work is committed and pushed.
Drop tool output, file contents and search results; they can be re-read from disk.
