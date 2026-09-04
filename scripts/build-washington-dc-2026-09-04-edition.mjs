// Builds data/washington-dc/current-weekend.json for the Sep 4–6, 2026 edition.
// Rows live in scripts/washington-dc-2026-09-04-rows.json (same tuple shape as the
// other build scripts). Featured ids live in scripts/washington-dc-2026-09-04-featured.json.
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";

const verified = "2026-09-04";
const days = { "2026-09-04": "Friday", "2026-09-05": "Saturday", "2026-09-06": "Sunday" };

function item([id, title, date, time, venue, neighborhood, address, category, priceValue, priceLabel, travelMinutes, age, description, sourceName, sourceUrl]) {
  const canonical = new URL(sourceUrl);
  const seriesId = `${canonical.hostname}${canonical.pathname}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { id, title, date, day: days[date], time, venue, neighborhood, address, category, priceValue, priceLabel, travelMinutes, roadTrip: travelMinutes > 90, featured: false, age, tags: [category.toLowerCase(), travelMinutes > 90 ? "road trip" : "local"], description, sourceName, sourceUrl, lastVerified: verified, seriesId };
}

const rows = JSON.parse(await readFile(new URL("./washington-dc-2026-09-04-rows.json", import.meta.url), "utf8"));
const featured = new Set(JSON.parse(await readFile(new URL("./washington-dc-2026-09-04-featured.json", import.meta.url), "utf8")));

const cityMeta = {
  id: "washington-dc",
  name: "Washington, DC",
  shortName: "DC",
  regionLabel: "Washington, DC, Northern Virginia, suburban Maryland and a sensible drive",
  coreLabel: "DC / Northern Virginia / suburban Maryland core",
  guideName: "Destination DC",
  guideUrl: "https://washington.org/dc-events",
  timezone: "America/New_York",
  verifiedAt: "September 4, 2026 at 1:00 PM ET",
  updatedAt: "2026-09-04T13:00:00-04:00",
};

const current = new URL("../data/washington-dc/current-weekend.json", import.meta.url);
await mkdir(new URL("../data/washington-dc/", import.meta.url), { recursive: true });
await mkdir(new URL("../data/archive/washington-dc/", import.meta.url), { recursive: true });
try {
  await stat(current);
  const prior = JSON.parse(await readFile(current, "utf8"));
  await writeFile(new URL(`../data/archive/washington-dc/weekend-${prior.weekend.startDate}.json`, import.meta.url), `${JSON.stringify(prior, null, 2)}\n`);
} catch {
  // first edition: nothing to archive
}

const events = rows.map(item);
for (const event of events) event.featured = featured.has(event.id);
const missing = [...featured].filter((id) => !events.some((event) => event.id === id));
if (missing.length) throw new Error(`featured ids not in rows: ${missing.join(", ")}`);

const data = {
  schemaVersion: 2,
  city: cityMeta,
  weekend: {
    label: "Friday, September 4 – Sunday, September 6, 2026",
    shortLabel: "Sep 4–6",
    startDate: "2026-09-04",
    endDate: "2026-09-06",
    verifiedAt: cityMeta.verifiedAt,
    updatedAt: cityMeta.updatedAt,
    timezone: "America/New_York",
    defaultDriveMinutes: 90,
    roadTripMaxMinutes: 120,
    refreshTarget: "Wednesday 9:00 AM America/New_York",
    editionStatus: "verified-upcoming",
    lastSuccessfulEdition: "September 4–6, 2026",
  },
  events,
};
await writeFile(current, `${JSON.stringify(data, null, 2)}\n`);
console.log(`washington-dc: ${events.length} events, ${events.filter((e) => e.featured).length} featured, ${events.filter((e) => e.roadTrip).length} road trips`);
