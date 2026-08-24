import { readFile } from "node:fs/promises";

const editions = [
  ["cincinnati", new URL("../data/cincinnati/current-weekend.json", import.meta.url)],
  ["philadelphia", new URL("../data/philadelphia/current-weekend.json", import.meta.url)],
  ["chicago", new URL("../data/chicago/current-weekend.json", import.meta.url)],
];
const requiredCity = ["id", "name", "regionLabel", "coreLabel", "guideName", "guideUrl"];
const requiredWeekend = ["label", "shortLabel", "startDate", "endDate", "updatedAt", "timezone", "refreshTarget"];
const requiredEvent = ["id", "title", "date", "day", "time", "venue", "neighborhood", "address", "category", "priceLabel", "description", "sourceName", "sourceUrl", "lastVerified"];
const allErrors = [];

for (const [cityId, path] of editions) {
  const data = JSON.parse(await readFile(path, "utf8"));
  const errors = [];
  for (const key of requiredCity) if (!data.city?.[key]) errors.push(`city.${key} is required`);
  if (data.city?.id !== cityId) errors.push(`city.id must be ${cityId}`);
  for (const key of requiredWeekend) if (!data.weekend?.[key]) errors.push(`weekend.${key} is required`);
  if (!Array.isArray(data.events)) errors.push("events must be an array");

  const ids = new Set();
  const dedupe = new Set();
  const sourceUrls = new Map();
  for (const [index, item] of (data.events || []).entries()) {
    for (const key of requiredEvent) if (item[key] === undefined || item[key] === "") errors.push(`events[${index}].${key} is required`);
    if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
    ids.add(item.id);
    const signature = `${item.title}|${item.venue}|${item.date}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
    if (dedupe.has(signature)) errors.push(`probable duplicate: ${item.title}`);
    dedupe.add(signature);
    if (item.date < data.weekend.startDate || item.date > data.weekend.endDate) errors.push(`${item.id} falls outside weekend`);
    if (!/^https:\/\//.test(item.sourceUrl || "")) errors.push(`${item.id} needs an https source URL`);
    try {
      const canonical = new URL(item.sourceUrl);
      canonical.hash = "";
      canonical.searchParams.sort();
      const key = canonical.toString().replace(/\/$/, "");
      const prior = sourceUrls.get(key);
      if (prior && (!item.seriesId || item.seriesId !== prior.seriesId)) errors.push(`${item.id} reuses a canonical source URL without a shared seriesId (${prior.id})`);
      else if (!prior) sourceUrls.set(key, item);
    } catch {
      errors.push(`${item.id} has an invalid source URL`);
    }
    if ((item.description || "").length < 45) errors.push(`${item.id} description is too thin`);
    if ((item.travelMinutes || 0) > data.weekend.defaultDriveMinutes && !item.roadTrip) errors.push(`${item.id} over 90 minutes must be roadTrip`);
    if ((item.travelMinutes || 0) > data.weekend.roadTripMaxMinutes) errors.push(`${item.id} exceeds 120-minute maximum`);
  }

  if ((data.events || []).length < 45) errors.push("edition needs at least 45 verified events unless explicitly documented");
  if ((data.events || []).filter((item) => item.featured).length !== 10) errors.push("edition needs exactly 10 featured picks");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: data.weekend?.timezone || "America/New_York" });
  if (data.weekend?.endDate < today) errors.push(`edition expired on ${data.weekend.endDate}; refuse to publish stale data`);
  const daysAhead = Math.round((new Date(`${data.weekend?.startDate}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000);
  if (daysAhead > 12) errors.push(`edition starts ${daysAhead} days ahead; verify the intended coming weekend`);

  if (errors.length) allErrors.push(...errors.map((error) => `${cityId}: ${error}`));
  else console.log(`PASS ${cityId}: ${data.events.length} events, ${ids.size} unique ids, ${(data.events || []).filter((item) => item.featured).length} featured.`);
}

if (allErrors.length) {
  console.error(allErrors.join("\n"));
  process.exit(1);
}
