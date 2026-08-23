# Cincinnati This Weekend

A verified, human-curated guide to worthwhile events in Cincinnati, Northern Kentucky,
and standout plans within a sensible drive. Live: https://cincinnati-this-weekend-cincy.netlify.app

## Stack and deployment

- Zero runtime dependencies: Netlify publishes the repository root through `netlify.toml`.
- The interface reads `data/current-weekend.json`; weekly refreshes do not require UI rewrites.
- GitHub `main` is the source of truth. A publication is complete only when Netlify's
  production `commit_ref` exactly matches the pushed Git SHA.

## One weekly publisher

The only active scheduler is the standalone Codex cron `Publish Cincinnati This Weekend`,
every Wednesday at 9:00 AM America/New_York. It owns research, archive, validation,
browser checks, `main` push, and exact Netlify verification. The former Claude app-open
task and Codex thread heartbeat are retired; never create another overlapping scheduler.

Follow `WEEKLY-REFRESH.md` completely. Every event needs a real date, venue, source URL,
and verification date. Use `Check source` when a price or time is unpublished—never guess.

## Safety rails

- Run `npm test` before publication.
- The validator rejects expired editions, duplicate IDs, probable duplicate events,
  unacknowledged canonical source reuse, and any featured count other than exactly ten.
- `events.js` is a legacy snapshot. `scripts/export-data.mjs` intentionally refuses to
  overwrite current data, preventing the Aug 14–16 snapshot from being republished.
- The service worker fetches `data/current-weekend.json` network-first. After an edition
  expires, the interface explicitly labels it historical and marks its cards ended.

Current prepared edition: Aug 28–30, 2026; 51 verified events; exactly 10 featured picks.

## Related app

Queen City Table is separate and must not be modified during weekend-guide refreshes:
https://queen-city-table-cincinnati.netlify.app
