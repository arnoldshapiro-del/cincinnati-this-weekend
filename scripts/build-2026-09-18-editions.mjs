// Builds all four city editions for Fri Sep 18 – Sun Sep 20, 2026.
// Rows (15-field tuples, same shape as earlier build scripts) and featured ids live in
// scripts/editions/2026-09-18/<city>-rows.json and <city>-featured.json.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const verified = "2026-09-16";
const days = { "2026-09-18": "Friday", "2026-09-19": "Saturday", "2026-09-20": "Sunday" };
const label = "Friday, September 18 – Sunday, September 20, 2026";
const shortLabel = "Sep 18–20";

function item([id, title, date, time, venue, neighborhood, address, category, priceValue, priceLabel, travelMinutes, age, description, sourceName, sourceUrl]) {
  const canonical = new URL(sourceUrl);
  const seriesId = `${canonical.hostname}${canonical.pathname}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { id, title, date, day: days[date], time, venue, neighborhood, address, category, priceValue, priceLabel, travelMinutes, roadTrip: travelMinutes > 90, featured: false, age, tags: [category.toLowerCase(), travelMinutes > 90 ? "road trip" : "local"], description, sourceName, sourceUrl, lastVerified: verified, seriesId };
}

const stamps = {
  "America/New_York": { verifiedAt: "September 16, 2026 at 8:00 PM ET", updatedAt: "2026-09-16T20:00:00-04:00" },
  "America/Chicago": { verifiedAt: "September 16, 2026 at 7:00 PM CT", updatedAt: "2026-09-16T19:00:00-05:00" },
};

for (const city of ["cincinnati", "philadelphia", "chicago", "washington-dc"]) {
  const dir = new URL(`./editions/2026-09-18/`, import.meta.url);
  const rows = JSON.parse(await readFile(new URL(`${city}-rows.json`, dir), "utf8"));
  const featured = new Set(JSON.parse(await readFile(new URL(`${city}-featured.json`, dir), "utf8")));
  const current = new URL(`../data/${city}/current-weekend.json`, import.meta.url);
  const prior = JSON.parse(await readFile(current, "utf8"));
  if (prior.weekend.startDate !== "2026-09-18") {
    await mkdir(new URL(`../data/archive/${city}/`, import.meta.url), { recursive: true });
    await writeFile(new URL(`../data/archive/${city}/weekend-${prior.weekend.startDate}.json`, import.meta.url), `${JSON.stringify(prior, null, 2)}\n`);
  }
  const events = rows.map(item);
  for (const event of events) event.featured = featured.has(event.id);
  const missing = [...featured].filter((id) => !events.some((event) => event.id === id));
  if (missing.length) throw new Error(`${city}: featured ids not in rows: ${missing.join(", ")}`);
  const stamp = stamps[prior.city.timezone];
  const cityMeta = { ...prior.city, ...stamp };
  const data = {
    schemaVersion: 2,
    city: cityMeta,
    weekend: { ...prior.weekend, label, shortLabel, startDate: "2026-09-18", endDate: "2026-09-20", ...stamp, editionStatus: "verified-upcoming", lastSuccessfulEdition: "September 18–20, 2026" },
    events,
  };
  await writeFile(current, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${city}: ${events.length} events, ${events.filter((e) => e.featured).length} featured`);
}
