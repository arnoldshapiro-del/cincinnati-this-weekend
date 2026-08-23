# Session Notes — Cincinnati This Weekend

## 2026-08-13 — Brought into the normal workflow

### What we did
Arnie asked to "finish it like we always do" — the app was already built (ChatGPT) and
already deployed, but it had never been folded into the standard setup.

- Cloned from GitHub into `Desktop\Project Files Do Not Delete\cincinnati-this-weekend\`
  (it had no local working copy before).
- Screenshotted the live site and **looked at it** before publishing anything — no login
  gate, no sensitive content, safe for the public gallery.
- Added the gallery card to `arnies-app-showcase` (card + screenshot), pushed, and
  verified both the card and its image are live.
- Created the `.url` shortcut in `Desktop\All Of My Working Apps That Are Beautiful\`.
- Added the app to `~\.claude\PROJECT_REGISTRY.md`.
- Wrote this file and CLAUDE.md (the repo had neither).
- Ran the app's own suite: **PASS — 58 events, 58 unique ids, 12 featured; 30 structural
  product checks.** Live site returns 200.

### What's working
Everything. Current edition is Aug 14–16 2026. PWA files already present, so it installs
and opens offline. Zero dependencies, so there is no build step to break.

### What's next — the standing risk
**This app goes stale by design.** It is pinned to one Friday–Sunday window, so after
Sunday Aug 16 2026 the front page advertises a weekend that has passed. `WEEKLY-REFRESH.md`
specifies a Wednesday 9:00 AM ET refresh: archive `data/current-weekend.json` to
`data/archive/weekend-YYYY-MM-DD.json`, research and verify ~50 events against the source
ladder, replace the file, `npm test`, publish.

**Resolved the same session — Arnie said do it, on Thursday rather than Wednesday.**
Scheduled task `cincinnati-weekend-refresh` created: every **Thursday ~10:08 AM ET**
(10:05 + jitter; deliberately clear of Ela's 9:07 daily marketing run). It archives the
outgoing file, researches and verifies the new edition against the source ladder, refuses
to guess a price or time ("Check source" instead), runs `npm test`, pushes to `main`, and
confirms the Netlify deploy — then reports to Arnie in plain English.

The prompt is fully self-contained because each run starts with no memory. It also carries
an explicit stop condition: if the research can't be verified, leave the previous edition
live and say so — a stale weekend beats a wrong one.

⚠️ Limitation told to Arnie: scheduled tasks only fire while the Claude app is open. A
missed run happens at next launch. First automated run is Thursday 2026-08-20 for the
Aug 21–23 weekend; the Aug 14–16 edition live now was already current.

### Important decisions
- Gallery push was explicitly requested by Arnie this session, so it was not treated as
  a side-effect push to `arnies-app-showcase` (which is otherwise on the no-auto-update
  list — memory `no-auto-update-trading-apps.md`).
- Nothing in the app's code or data was changed. This session was setup and paperwork
  only.

## 2026-08-23 - Missed refresh diagnosed and repaired

The Aug 21-23 publication never happened. GitHub still contained the Aug 14-16 data,
proving this was not merely a browser display problem. Two overlapping reminders had
been configured: a thread-bound Codex heartbeat and a Claude task that only runs while
its desktop app is open. Neither was a dependable end-to-end publisher.

The repaired edition covers Aug 28-30 with 51 verified records and exactly ten featured
picks; the Aug 14-16 file is archived at `data/archive/weekend-2026-08-14.json`. The app
now makes expired data unmistakable, the service worker retrieves weekly JSON
network-first, the old exporter refuses to republish its 2026-08-14 snapshot, and the
validator rejects stale editions. One standalone Wednesday Codex cron replaces both old
reminders and must verify the exact Git SHA on Netlify after every publication.
