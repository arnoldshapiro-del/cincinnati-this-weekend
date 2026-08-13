# Weekly refresh operating model

The interface reads `data/current-weekend.json`. A new edition replaces that file; no HTML, CSS, or app code needs to change.

## Scheduled Wednesday workflow

Target: every Wednesday at 9:00 AM America/New_York for the coming Friday–Sunday.

1. Archive the prior file as `data/archive/weekend-YYYY-MM-DD.json`.
2. Research primary sources and live ticket pages for Cincinnati/Northern Kentucky, then unusually strong events within 90 minutes.
3. Add only standout, clearly labeled road trips between 91 and 120 minutes.
4. Require an event-specific date, venue, source URL, verification date, and honest price/time wording. “Check source” is used when a value is not published.
5. Normalize and deduplicate by title + venue + date and canonical source URL. A festival and a distinct scheduled performance inside it may both remain only when each card leads to a genuinely different decision.
6. Score and select about 50 events, preserving a varied mix of days, locations, price points, audiences, and categories.
7. Replace `data/current-weekend.json`, run `npm test`, check a narrow browser view, and publish the verified edition.

## Source ladder

1. Organizer, venue, team, government, park, museum, or festival official page.
2. Official ticketing inventory or organizer-authorized ticket seller.
3. City or destination bureau calendar that links to the organizer.
4. Current-dated, respected local journalism used to clarify significance or a newly announced item.
5. Aggregators and social posts may produce leads, but are not the sole source for time, place, or price.

## Editorial ranking (100 points)

- 30: memorability and weekend impact
- 20: unusual or specifically Cincinnati/regional character
- 15: source confidence and freshness
- 15: usefulness across audiences, days, places, and price points
- 10: genuine time sensitivity
- 10: price and travel fit

The top ten become Editor’s Picks. Diversity caps prevent one venue, category, or festival from dominating the featured rail.

## Expiry and truthfulness

The app compares the current date with the dataset’s `endDate`. After Sunday it displays an “edition ended” warning. Historical records can stay in `data/archive`, but the browse screen reads only the current file. Source links remain the final word because inventory, weather, and organizer details can change after verification.

The scheduled Codex task is an editorial research-and-publish workflow, not a direct feed from Eventbrite, Fever, or every venue. Those products do not expose one reliable public feed containing all Cincinnati events and all required facts. If the scheduled run cannot publish, it must report the failure rather than leaving a stale edition labeled current. The no-spreadsheet fallback is one sentence: “Refresh Cincinnati This Weekend for [date range].”
