const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function localDate(now = new Date(), timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function expectedWeekend(now = new Date(), timeZone = "America/New_York") {
  // One publishing deadline for all cities: Wednesday 09:35 Eastern, including DST.
  const today = localDate(now, timeZone);
  const day = new Date(`${today}T12:00:00Z`).getUTCDay();
  const easternDate = localDate(now, "America/New_York");
  const easternDay = new Date(`${easternDate}T12:00:00Z`).getUTCDay();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const clock = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const minutes = Number(clock.hour) * 60 + Number(clock.minute);
  const startDate = addDays(today, day === 0 ? -2 : 5 - day);
  return { startDate, endDate: addDays(startDate, 2), publicationDue: easternDay === 0 || easternDay > 3 || (easternDay === 3 && minutes >= 9 * 60 + 35) };
}

export function editionFreshness(weekend, now = new Date()) {
  const today = localDate(now, weekend.timezone || "America/New_York");
  const target = expectedWeekend(now, weekend.timezone || "America/New_York");
  const expired = weekend.endDate < today;
  // A Saturday–Sunday recovery edition is valid for that Friday–Sunday window.
  const coversTarget = weekend.endDate === target.endDate && weekend.startDate >= target.startDate && weekend.startDate <= target.endDate;
  const publicationDelayed = target.publicationDue && !coversTarget;
  const stale = expired || publicationDelayed;
  return { today, target, expired, publicationDelayed, stale, status: stale ? "stale" : today < weekend.startDate ? "upcoming" : "current" };
}

export function validateEdition(data, city) {
  const weekend = data?.weekend;
  if (data?.city?.id !== city || !data.city.name || !weekend || !Array.isArray(data.events) || !data.events.length) throw new Error("The server returned an invalid city guide.");
  const nonemptyString = value => typeof value === "string" && value.trim().length > 0;
  const httpsUrl = value => { try { return typeof value === "string" && new URL(value).protocol === "https:"; } catch { return false; } };
  for (const key of ["name", "regionLabel", "coreLabel", "guideName", "guideUrl"]) if (!nonemptyString(data.city[key])) throw new Error("The server returned incomplete city details.");
  if (!httpsUrl(data.city.guideUrl)) throw new Error("The server returned an invalid city source.");
  if (weekend.timezone !== (city === "chicago" ? "America/Chicago" : "America/New_York")) throw new Error("The server returned an incorrect city timezone.");
  for (const key of ["startDate", "endDate"]) {
    if (!DATE.test(weekend[key] || "") || new Date(`${weekend[key]}T12:00:00Z`).toISOString().slice(0, 10) !== weekend[key]) throw new Error("The server returned invalid guide dates.");
  }
  if (weekend.endDate < weekend.startDate || !["shortLabel", "label", "verifiedAt", "updatedAt"].every(key => nonemptyString(weekend[key])) || Number.isNaN(Date.parse(weekend.updatedAt))) throw new Error("The server returned incomplete guide details.");
  localDate(new Date(), weekend.timezone);
  const ids = new Set();
  for (const event of data.events) {
    const strings = ["id", "title", "date", "day", "time", "venue", "neighborhood", "address", "category", "priceLabel", "description", "sourceName", "sourceUrl", "lastVerified"];
    if (!event || !strings.every(key => nonemptyString(event[key])) || ids.has(event.id) || !Array.isArray(event.tags) || !event.tags.every(nonemptyString) || !DATE.test(event.date) || event.date < weekend.startDate || event.date > weekend.endDate || !httpsUrl(event.sourceUrl)) throw new Error("The server returned invalid event details.");
    if (event.priceValue !== null && (typeof event.priceValue !== "number" || !Number.isFinite(event.priceValue) || event.priceValue < 0)) throw new Error("The server returned an invalid event price.");
    if (typeof event.travelMinutes !== "number" || !Number.isFinite(event.travelMinutes) || event.travelMinutes < 0 || typeof event.featured !== "boolean" || typeof event.roadTrip !== "boolean") throw new Error("The server returned invalid event options.");
    ids.add(event.id);
  }
  return data;
}

export function isNewerEdition(next, current) {
  if (!current) return true;
  const nextWindow = next.endDate || next.startDate;
  const currentWindow = current.endDate || current.startDate;
  // A same-weekend correction may change a Fri–Sun range into Sat–Sun, or vice versa.
  return nextWindow > currentWindow || (nextWindow === currentWindow && Date.parse(next.updatedAt) > Date.parse(current.updatedAt));
}

export async function fetchPublishedEdition(city, dataUrl, { fetcher = fetch, baseUrl = globalThis.location?.href, timeoutMs = 15000, signal } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, timeoutMs);
  try {
    const url = new URL(dataUrl, baseUrl);
    url.searchParams.set("check", String(Date.now()));
    const response = await fetcher(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`The guide request failed (${response.status}).`);
    return validateEdition(await response.json(), city);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
