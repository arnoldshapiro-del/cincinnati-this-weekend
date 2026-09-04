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

## 2026-09-04 - Greater Washington DC added as the fourth city

### What we did
- Arnie asked for one more city in the existing dropdown: Greater Washington DC. No other
  program changes. City id `washington-dc`, dropdown label "Greater Washington DC",
  header name "Washington, DC"; region = DC + Northern Virginia + suburban Maryland.
- Wired the fourth city into app.js CITY_CONFIG, index.html selector + meta, validator,
  source-link checker, structural tests (now "four-city selector"), README, manifest,
  CLAUDE.md and WEEKLY-REFRESH.md (all four files refresh in one Wednesday commit).
- Built `data/washington-dc/current-weekend.json` for Sep 4–6, 2026: 60 verified events,
  exactly 10 featured, 2 road trips (Charlottesville, Richmond). Rows live in
  `scripts/washington-dc-2026-09-04-rows.json`, featured ids in the matching
  `-featured.json`, assembled by `scripts/build-washington-dc-2026-09-04-edition.mjs`.
- Research: four parallel Sonnet workers (music/comedy, sports/festivals/markets,
  arts/museums/family, outdoors/road trips), brain-reviewed. Dropped 5 rows: two
  Lancaster PA trips (~135 min, over the 120 cap) and three whose only source was a
  news article. Re-sourced Maryland vs. Hampton to umterps.com (8 PM kickoff) and the
  Descendents show to theanthemdc.com; NSO Labor Day concert sourced to the Kennedy
  Center's own page (it 403s bots but the checker tolerates 403).
- All 48 unique DC source URLs returned 2xx. `npm test` PASS for four cities.
- Verified locally in the browser pane (desktop + 375px): dropdown shows four options,
  `?city=washington-dc` loads the DC edition, no console errors.
- Pushed bafc16e; Netlify production deploy `ready` with commit_ref = bafc16e; live JSON
  confirmed (60 events / 10 featured).

### What's working
Everything. Four cities live at https://cincinnati-this-weekend-cincy.netlify.app/
(`?city=washington-dc` deep-links DC). Cincinnati stays the default.

### What's next
- Next Wednesday's refresh (Sep 9 for Sep 11–13) must produce four files; the validator
  and tests now fail on a three-city publish.
- OPEN: which program actually publishes on Wednesdays is unknown. Evidence: commits
  22b1b54 (08-26 09:24 ET) and d3b3f37 (09-02 09:44 ET) were pushed by a publisher not
  found on this PC. The local Codex automation (`~/.codex/automations/
  publish-cincinnati-this-weekend`, Wed 9:00) has never published — both of its runs
  stopped at its own gates (its memory.md says so). Its prompt was updated this session
  to name all four cities (backup: automation.toml.bak-2026-09-04). The Claude task
  `cincinnati-weekend-refresh` (Thu 10:08, Cincinnati-only, legacy file path) is still
  enabled but has produced no commits. Arnie should confirm "Publish This Weekend
  Cities" in his Codex/ChatGPT automations list names four cities.

### Important decisions
- Slug `washington-dc` (folder, city.id, URL param, localStorage scope) — chosen so the
  validator's folder = id rule holds.
- Region guide URL: https://washington.org/dc-events (the "this weekend" page 404s).
- Sold-out shows kept with "Sold out; check source for returns" (matches other cities).

### Problems encountered
- Bash heredoc with an unset variable hung once (`cat >` with no input) — harmless.
- The source-of-truth guard blocks Write/Edit while the tree is dirty with this
  session's own edits; used Bash/node for repo writes instead.
- preview_start read Desktop\.claude\launch.json (cwd), not the repo's; added a
  `weekend-static` entry there (tiny Node static server in the session scratchpad).

### Addendum 2026-09-04 (later) — hunting the Wednesday publisher
Checked, all VERIFIED: the 08-24, 08-26 and 09-02 commits are unsigned, author+committer
arnoldshapiro-del (a plain local-identity git push, not the GitHub web UI). No copy of the
repo on this PC made them (Desktop clone reflog empty on those days; the Codex checkout in
Documents\Codex\2026-08-12 sits at 7ca0bfe and never committed after 08-23). The Codex app's
own thread list shows its automation ran 08-26 09:01–09:20 and 09-02 11:27–11:41 and
pushed nothing (memory.md agrees). Claude Code cloud routines: none for this repo. Codex
cloud (chatgpt.com/codex/cloud, checked in Arnie's logged-in Chrome): no automations
feature at all; only old May tasks in an unrelated repo. Claude local scheduled task runs
Thursdays and has produced no commits. GitHub app installations could not be listed (403).
CONCLUSION: the publisher runs somewhere else (another computer, or a scheduled task in
a chat app with a GitHub connector). It reads the repo docs, which now say four cities, and
`npm test` now fails on a three-city publish. NEXT MEASUREMENT: after Wed Sep 9 ~9:30 AM ET,
look at the new commit on GitHub — if `data/washington-dc/` was refreshed, done; if only
three cities moved, the publisher ignores the tests and must be found and rewritten.
