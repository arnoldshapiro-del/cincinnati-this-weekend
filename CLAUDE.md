# This Weekend: multi-city guide

One verified, human-curated weekend guide serves Cincinnati, Philadelphia, Chicago, and Greater Washington DC (city id `washington-dc`: DC, Northern Virginia, suburban Maryland) through a city selector. Cincinnati remains the default. The live Git-backed Netlify site is https://cincinnati-this-weekend-cincy.netlify.app/.

## Stack and deployment

- Zero runtime dependencies; Netlify publishes the repository root through `netlify.toml`.
- The interface reads `data/<city>/current-weekend.json`; weekly refreshes do not require UI rewrites.
- GitHub `main` is the source of truth. Publication is complete only when Netlify's production `commit_ref` matches the pushed Git SHA.

## One cloud-owned publisher

The desktop Claude task `cincinnati-weekend-refresh` and the old Codex automation `publish-cincinnati-this-weekend` were both verified disabled on October 10, 2026. Keep both disabled. Do not restore desktop scheduling, change permission modes, or create overlapping publishers.

The replacement design has two entry points sharing one publisher and one conditional GitHub control record:

- Automatic: Wednesday at 9:35 AM America/New_York, all four cities.
- Manual: an explicit visitor click on “Refresh weekend events” requests research for the selected city through the fixed `weekend-refresh` Netlify form.

A rolling one-hour cooldown limits duplicate manual requests; it is not an hourly schedule. All work uses the same GitHub `main` source and existing Netlify project. The control record lives on the separate `refresh-control` branch; status commits use `[skip netlify]`.

Cloud activation is still gated on verified setup. `refresh-config.json` must remain disabled until Netlify Forms, the exact form subscription, the weekly schedule, and the public control record have been confirmed. Read `docs/cloud-refresh-setup.md` and `docs/cloud-refresh-publisher-prompts.md`; a code change or accepted form submission alone is not proof that the publisher ran.

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

