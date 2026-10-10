import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localDate, expectedWeekend, editionFreshness, validateEdition, isNewerEdition, fetchPublishedEdition } from "../edition-status.js";

const sample = JSON.parse(await readFile(new URL("../data/cincinnati/current-weekend.json", import.meta.url), "utf8"));
const weekend = { ...sample.weekend, startDate: "2026-10-09", endDate: "2026-10-11", timezone: "America/New_York" };

test("Wednesday cutoff follows Eastern summer time", () => {
  assert.deepEqual(expectedWeekend(new Date("2026-10-07T13:34:59Z")), { startDate: "2026-10-09", endDate: "2026-10-11", publicationDue: false });
  assert.equal(expectedWeekend(new Date("2026-10-07T13:35:00Z")).publicationDue, true);
});
test("Wednesday cutoff follows Eastern winter time", () => {
  assert.equal(expectedWeekend(new Date("2026-11-04T14:34:59Z")).publicationDue, false);
  assert.equal(expectedWeekend(new Date("2026-11-04T14:35:00Z")).publicationDue, true);
});
test("Saturday and Sunday still target the current weekend", () => {
  for (const instant of ["2026-10-10T22:00:00Z", "2026-10-11T22:00:00Z"]) assert.equal(expectedWeekend(new Date(instant)).startDate, "2026-10-09");
});
test("expiry uses the selected city's midnight", () => {
  const now = new Date("2026-10-12T04:30:00Z");
  assert.equal(localDate(now, "America/New_York"), "2026-10-12");
  assert.equal(localDate(now, "America/Chicago"), "2026-10-11");
  assert.equal(editionFreshness(weekend, now).expired, true);
  assert.equal(editionFreshness({ ...weekend, timezone: "America/Chicago" }, now).expired, false);
  assert.equal(expectedWeekend(now, "America/Chicago").startDate, "2026-10-09");
  assert.equal(expectedWeekend(now, "America/New_York").startDate, "2026-10-16");
});
test("expired data is never current before Wednesday, but publication is not yet late", () => {
  const status = editionFreshness({ ...weekend, startDate: "2026-10-03", endDate: "2026-10-04" }, new Date("2026-10-06T16:00:00Z"));
  assert.equal(status.stale, true);
  assert.equal(status.expired, true);
  assert.equal(status.publicationDelayed, false);
});
test("Saturday recovery editions satisfy this weekend, unrelated future editions do not", () => {
  const now = new Date("2026-10-10T22:00:00Z");
  assert.equal(editionFreshness({ ...weekend, startDate: "2026-10-10" }, now).stale, false);
  assert.equal(editionFreshness({ ...weekend, startDate: "2026-10-16", endDate: "2026-10-18" }, now).publicationDelayed, true);
});
test("runtime validation rejects wrong city, malformed dates, empty events and duplicate IDs", () => {
  assert.equal(validateEdition(sample, "cincinnati"), sample);
  assert.throws(() => validateEdition(sample, "chicago"));
  assert.throws(() => validateEdition({ ...sample, events: [] }, "cincinnati"));
  assert.throws(() => validateEdition({ ...sample, events: [sample.events[0], sample.events[0]] }, "cincinnati"));
  assert.throws(() => validateEdition({ ...sample, weekend: { ...sample.weekend, startDate: "2026-02-30" } }, "cincinnati"));
  for (const field of ["title", "category", "sourceUrl", "day", "tags", "priceValue", "travelMinutes"]) {
    const corrupted = structuredClone(sample);
    delete corrupted.events[0][field];
    assert.throws(() => validateEdition(corrupted, "cincinnati"), field);
  }
  assert.throws(() => validateEdition({ ...sample, events: [{ ...sample.events[0], sourceUrl: "javascript:alert(1)" }] }, "cincinnati"));
});
test("newer editions compare real timestamps and never regress dates", () => {
  const current = { startDate: "2026-10-09", updatedAt: "2026-10-07T14:00:00Z" };
  assert.equal(isNewerEdition({ ...current, updatedAt: "2026-10-07T11:00:00-04:00" }, current), true);
  assert.equal(isNewerEdition({ ...current, startDate: "2026-10-03", updatedAt: "2026-10-10T23:00:00Z" }, current), false);
  assert.equal(isNewerEdition(current, current), false);
  assert.equal(isNewerEdition({ startDate: "2026-10-09", endDate: "2026-10-11", updatedAt: "2026-10-10T23:00:00Z" }, { startDate: "2026-10-10", endDate: "2026-10-11", updatedAt: "2026-10-10T22:00:00Z" }), true);
});
test("manual checks bypass caches and validate before replacing the displayed guide", async () => {
  let request;
  const result = await fetchPublishedEdition("cincinnati", "./data/cincinnati/current-weekend.json", { baseUrl: "https://example.com/", fetcher: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => sample };
  } });
  assert.equal(result, sample);
  assert.equal(request.options.cache, "no-store");
  assert.ok(request.url.searchParams.has("check"));
  assert.ok(request.options.signal instanceof AbortSignal);
});
test("failed requests cannot be mistaken for a successful no-change check", async () => {
  await assert.rejects(fetchPublishedEdition("cincinnati", "https://example.com/data.json", { fetcher: async () => ({ ok: false, status: 503 }) }), /503/);
  await assert.rejects(fetchPublishedEdition("cincinnati", "https://example.com/data.json", { fetcher: async () => ({ ok: true, json: async () => ({}) }) }), /invalid city guide/);
});
test("hung checks time out and user cancellation aborts them", async () => {
  const pendingFetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    const stop = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", stop, { once: true });
    if (signal.aborted) stop();
  });
  await assert.rejects(fetchPublishedEdition("cincinnati", "https://example.com/data.json", { fetcher: pendingFetch, timeoutMs: 10 }), { name: "AbortError" });
  const controller = new AbortController();
  const request = fetchPublishedEdition("cincinnati", "https://example.com/data.json", { fetcher: pendingFetch, signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
});
