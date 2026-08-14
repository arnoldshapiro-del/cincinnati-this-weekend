# Cincinnati This Weekend

A verified, human-curated guide to what is worth doing in Cincinnati / Northern Kentucky
for one exact Friday–Sunday window. Built originally with ChatGPT; maintained here.
Live: https://cincinnati-this-weekend-cincy.netlify.app

## Stack
- **Zero dependencies.** Plain `index.html` + `app.js` + `events.js` + `styles.css`.
  Nothing to build — Netlify publishes the repo root (`netlify.toml`).
- PWA already in place: `manifest.webmanifest`, `sw.js`, `favicon.svg`.
- Deploy: GitHub → Netlify auto-build. Site `cincinnati-this-weekend-cincy`.

## The one thing that matters: it goes stale every week
- The whole interface reads **`data/current-weekend.json`**. A new edition replaces
  that one file — no HTML, CSS or JS changes.
- The full operating model (Wednesday 9:00 AM ET cadence, the 5-rung source ladder,
  the 100-point ranking, archive-then-replace) is in **`WEEKLY-REFRESH.md`**. Read it
  before touching the data; don't reinvent the rules.
- Every event needs a specific date, venue, source URL and verification date. When a
  price or time isn't published, the honest wording is "Check source" — never a guess
  (global rule 3).

## Before publishing an edition
`npm test` — runs `scripts/validate-weekend-data.mjs` (ids unique, required fields,
featured count) plus `tests/structural.test.mjs` (30 product checks). Both must pass.
Current edition: Aug 14–16 2026, 58 events, 12 featured.

## Related
Cross-links with [Queen City Table](https://queen-city-table-cincinnati.netlify.app)
(the restaurant map) — see `WEEKEND-GUIDE-CROSSLINK-RESEARCH.md` in that repo.
