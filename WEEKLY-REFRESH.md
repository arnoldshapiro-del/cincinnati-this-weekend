# Weekly multi-city refresh operating model

The interface reads one city file at a time:

- `data/cincinnati/current-weekend.json`
- `data/philadelphia/current-weekend.json`
- `data/chicago/current-weekend.json`

A Wednesday publication replaces all three files in one tested Git commit.

## Scheduled Wednesday workflow

Target: every Wednesday at 9:00 AM America/New_York for the coming Friday–Sunday.

1. Archive each prior file under `data/archive/<city>/weekend-YYYY-MM-DD.json`.
2. Research Cincinnati/Northern Kentucky, Philadelphia, and Chicago independently, using primary organizer, venue, team, government, park, museum, festival, and official ticket pages.
3. Add only standout, clearly labeled road trips between 91 and 120 minutes from each selected city.
4. Require a real date, venue, source URL, verification date, and honest price/time wording. Use `Check source` when a value is not published.
5. Normalize and deduplicate within each city by title + venue + date and canonical source URL.
6. Select about 50 events per city with varied days, neighborhoods, prices, audiences, and categories. Mark exactly ten Editor's Picks per city.
7. Replace all three city files and run `npm test`. Verify all three selector choices in a narrow and wide browser view.
8. Push one commit to `main`, wait for the Git-backed Netlify production deployment, and verify its `commit_ref` equals the pushed Git SHA before reporting success.

The only scheduler should be the standalone Codex task `Publish This Weekend Cities`. Do not create overlapping Cincinnati-only, Philadelphia-only, Claude app-open, or thread-heartbeat publishers.

## Source ladder

1. Organizer, venue, team, government, park, museum, or festival official page.
2. Official ticket inventory or organizer-authorized ticket seller.
3. City or destination bureau calendar linking to the organizer.
4. Current-dated, respected local journalism used to clarify significance or a newly announced item.
5. Aggregators and social posts may produce leads, but are not the sole source for time, place, or price.

## Editorial ranking

- 30: memorability and weekend impact
- 20: unusual or specifically local/regional character
- 15: source confidence and freshness
- 15: usefulness across audiences, days, places, and price points
- 10: genuine time sensitivity
- 10: price and travel fit

The top ten in each city become Editor's Picks. Diversity caps prevent one venue, category, or festival from dominating.

## Expiry and truthfulness

Each city file has its own `endDate`. After Sunday, that city changes to an explicit expired-edition state. The service worker fetches every city `current-weekend.json` network-first, and the validator refuses expired data. A failure in one city's research must be reported honestly; it must never be hidden by labeling an old edition current.
