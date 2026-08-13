import { readFile } from "node:fs/promises";

const path = new URL("../data/current-weekend.json", import.meta.url);
const data = JSON.parse(await readFile(path, "utf8"));
const requiredWeekend = ["label", "shortLabel", "startDate", "endDate", "updatedAt", "timezone", "refreshTarget"];
const requiredEvent = ["id", "title", "date", "day", "time", "venue", "neighborhood", "address", "category", "priceLabel", "description", "sourceName", "sourceUrl", "lastVerified"];
const errors = [];

for (const key of requiredWeekend) if (!data.weekend?.[key]) errors.push(`weekend.${key} is required`);
if (!Array.isArray(data.events)) errors.push("events must be an array");

const ids = new Set();
const dedupe = new Set();
for (const [index, event] of (data.events || []).entries()) {
  for (const key of requiredEvent) if (event[key] === undefined || event[key] === "") errors.push(`events[${index}].${key} is required`);
  if (ids.has(event.id)) errors.push(`duplicate id: ${event.id}`);
  ids.add(event.id);
  const signature = `${event.title}|${event.venue}|${event.date}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
  if (dedupe.has(signature)) errors.push(`probable duplicate: ${event.title}`);
  dedupe.add(signature);
  if (event.date < data.weekend.startDate || event.date > data.weekend.endDate) errors.push(`${event.id} falls outside weekend`);
  if (!/^https:\/\//.test(event.sourceUrl || "")) errors.push(`${event.id} needs an https source URL`);
  if ((event.description || "").length < 45) errors.push(`${event.id} description is too thin`);
  if ((event.travelMinutes || 0) > data.weekend.defaultDriveMinutes && !event.roadTrip) errors.push(`${event.id} over 90 minutes must be roadTrip`);
  if ((event.travelMinutes || 0) > data.weekend.roadTripMaxMinutes) errors.push(`${event.id} exceeds 120-minute maximum`);
}

if ((data.events || []).length < 45) errors.push("edition needs at least 45 verified events unless explicitly documented");
if ((data.events || []).filter((event) => event.featured).length < 10) errors.push("edition needs at least 10 featured picks");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${data.events.length} events, ${ids.size} unique ids, ${(data.events || []).filter((event) => event.featured).length} featured.`);
