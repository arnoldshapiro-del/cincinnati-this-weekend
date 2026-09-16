# This Weekend: multi-city guide

One verified, human-curated weekend guide serves Cincinnati, Philadelphia, Chicago, and Greater Washington DC (city id `washington-dc`: DC, Northern Virginia, suburban Maryland) through a city selector. Cincinnati remains the default. The live Git-backed Netlify site is https://cincinnati-this-weekend-cincy.netlify.app/.

## Stack and deployment

- Zero runtime dependencies; Netlify publishes the repository root through `netlify.toml`.
- The interface reads `data/<city>/current-weekend.json`; weekly refreshes do not require UI rewrites.
- GitHub `main` is the source of truth. Publication is complete only when Netlify's production `commit_ref` matches the pushed Git SHA.

## One Wednesday publisher

The only active scheduler is the Claude desktop scheduled task `cincinnati-weekend-refresh` ("This Weekend — Wednesday four-city publish"), every Wednesday ~9:35 AM America/New_York (runs while the Claude app is open; a missed run fires at next launch). The Codex automation `publish-cincinnati-this-weekend` was PAUSED 2026-09-16 after four runs that never published. It owns research for all four cities, archives, validation, browser checks, the `main` push, and exact Netlify verification. Do not create overlapping city-specific publishers.

Follow `WEEKLY-REFRESH.md` completely. Every event needs a real date, venue, HTTPS source URL, and verification date. Use `Check source` when a price or time is unpublished; never guess.

## Safety rails

- Run `npm test` before publication.
- Each city (including `washington-dc`) requires at least 45 verified events, exactly ten featured picks, unique IDs, deduplication, and honest road-trip labels.
- The service worker fetches all city edition files network-first.
- Saved events, followed venues, notes, and plans are scoped by city in browser storage.
- `events.js` and `data/current-weekend.json` are legacy Cincinnati snapshots and must not overwrite the city files.

Current prepared editions: September 4–6, 2026 in all four cities. Greater Washington DC was added on 2026-09-04 with its own `data/washington-dc/current-weekend.json`; every Wednesday publication must refresh all four city files in the same commit.

## Related app

Queen City Table is separate and must not be modified during weekend-guide refreshes: https://queen-city-table-cincinnati.netlify.app
