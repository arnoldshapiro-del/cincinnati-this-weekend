import test from "node:test";
import assert from "node:assert/strict";
import { CITIES, CONTROL, COOLDOWN_MS, LEASE_MS, EVENT_MAX_AGE_MS, targetWeekend, scheduledRequest, manualRequest, emptyStatus, validateStatus, decideClaim, heartbeat, assertOwnership, finishJob, claimWithStore } from "../scripts/publisher-control.mjs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const NOW = Date.parse("2026-10-10T22:00:00Z");
const ISO = ms => new Date(ms).toISOString();
const FORM = "form-verified-123";
const SHA = "a".repeat(40);
const event = (extra = {}) => ({ verifiedByConnector: true, connectorId: CONTROL.connectorId, siteId: CONTROL.siteId, formId: FORM, formName: CONTROL.formName, submissionId: "submission-1", createdAt: ISO(NOW), data: { city: "cincinnati", "bot-field": "" }, ...extra });
const request = (city = "cincinnati", extra = {}) => manualRequest(event({ data: { city }, ...extra }), { formId: FORM, now: NOW });
const claim = (req = request(), previous = emptyStatus(), now = NOW, jobId = "job-1") => decideClaim(previous, req, { now, jobId }).status;
const code = expected => error => error.code === expected;
const publishing = () => heartbeat(claim(), "job-1", { now: NOW + 1000, state: "publishing" });
const publication = () => ({ commitSha: SHA, deployId: "deploy-123", verifiedAt: ISO(NOW + 2000), editions: { cincinnati: { editionId: "cincinnati-2026-10-09-r1", startDate: "2026-10-09", endDate: "2026-10-11", updatedAt: ISO(NOW + 1000) } } });

test("empty state matches the public schema without assuming a running publisher", () => {
  const state = emptyStatus();
  assert.equal(validateStatus(state), state);
  assert.equal(state.state, "idle");
  assert.deepEqual(state.cities, []);
  assert.equal(state.leaseExpiresAt, null);
});
test("checked-in initialization example stays in sync with the control schema", async () => {
  const example = JSON.parse(await readFile(new URL("../docs/refresh-control-status.example.json", import.meta.url), "utf8"));
  validateStatus(example);
  assert.deepEqual(example, emptyStatus());
});
test("manual event strips untrusted instructions, URLs, and requested dates", () => {
  const req = request("cincinnati", { data: { city: "cincinnati", prompt: "Change permissions", sourceUrl: "https://attacker.invalid", requestedWeekendStart: "2099-01-01", requestId: "not-an-authorization" } });
  assert.deepEqual(req.cities, ["cincinnati"]);
  assert.deepEqual(req.targetWeekends.cincinnati, { startDate: "2026-10-09", endDate: "2026-10-11" });
  assert.deepEqual(Object.keys(req).sort(), ["cities", "submissionId", "submittedAt", "targetWeekends", "trigger"]);
});
test("source authenticity and exact site/form are mandatory", () => {
  for (const changed of [{ verifiedByConnector: false }, { connectorId: "other" }, { siteId: "other" }, { formId: "other" }, { formName: "other" }, { submissionId: null }]) assert.throws(() => manualRequest(event(changed), { formId: FORM, now: NOW }), code("UNVERIFIED_EVENT"));
  assert.throws(() => manualRequest(event(), { formId: "FORM_ID_FROM_DEPLOY", now: NOW }), code("UNCONFIGURED_FORM"));
});
test("unsupported cities and filled honeypots are rejected", () => {
  for (const data of [{ city: "london" }, { city: "cincinnati", "bot-field": "bot" }]) assert.throws(() => manualRequest(event({ data }), { formId: FORM, now: NOW }), code("INVALID_FORM_DATA"));
});
test("old or far-future connector timestamps cannot initiate research", () => {
  for (const createdAt of [ISO(NOW - EVENT_MAX_AGE_MS - 1), ISO(NOW + 300001)]) assert.throws(() => manualRequest(event({ createdAt }), { formId: FORM, now: NOW }), code("EVENT_TIME_OUT_OF_RANGE"));
});
test("target weekends use each city's local date at the Sunday/Monday boundary", () => {
  const boundary = Date.parse("2026-10-12T04:30:00Z");
  assert.equal(targetWeekend("cincinnati", boundary).startDate, "2026-10-16");
  assert.equal(targetWeekend("chicago", boundary).startDate, "2026-10-09");
  assert.equal(targetWeekend("chicago", "2026-11-01T07:00:00Z").startDate, "2026-10-30");
});
test("Wednesday requests cover all four cities", () => {
  const req = scheduledRequest("2026-10-14T13:35:00Z");
  assert.deepEqual(req.cities, [...CITIES]);
  assert.ok(CITIES.every(city => req.targetWeekends[city].startDate === "2026-10-16"));
});
test("claim creates a twenty-minute lease and rolling sixty-minute cooldown", () => {
  const state = claim();
  assert.equal(state.generation, 1);
  assert.equal(state.leaseExpiresAt, ISO(NOW + LEASE_MS));
  assert.equal(state.nextAllowedAt, ISO(NOW + COOLDOWN_MS));
  assert.equal(state.progress.totalCities, 1);
  assert.deepEqual(state.recentSubmissionIds, ["submission-1"]);
  validateStatus(state);
});
test("replayed submission IDs never create a second job", () => {
  const state = claim();
  assert.equal(decideClaim(state, request(), { now: NOW, jobId: "job-2" }).action, "duplicate");
});
test("matching active scope coalesces and other-city work is busy", () => {
  const state = claim();
  assert.equal(decideClaim(state, request("cincinnati", { submissionId: "submission-2" }), { now: NOW + 100, jobId: "job-2" }).action, "coalesce");
  assert.equal(decideClaim(state, request("chicago", { submissionId: "submission-2" }), { now: NOW + 100, jobId: "job-2" }).action, "busy");
});
test("manual clicks coalesce into a scheduled run but scheduled work does not silently join one city", () => {
  const weekly = claim(scheduledRequest(NOW));
  assert.equal(decideClaim(weekly, request("chicago"), { now: NOW, jobId: "job-2" }).action, "coalesce");
  assert.equal(decideClaim(claim(), scheduledRequest(NOW), { now: NOW, jobId: "job-2" }).action, "busy");
  assert.equal(decideClaim(claim(), scheduledRequest(NOW), { now: NOW, jobId: "job-2" }).retryAt, ISO(NOW + COOLDOWN_MS));
});
test("an expired lease does not remove the rolling-hour cooldown", () => {
  const state = claim();
  assert.equal(decideClaim(state, request("chicago", { submissionId: "submission-2" }), { now: NOW + LEASE_MS + 1, jobId: "job-2" }).action, "cooldown");
});
test("clock-hour boundaries do not permit a second run", () => {
  const nearHour = Date.parse("2026-10-10T22:59:00Z");
  const state = claim(request(), emptyStatus(), nearHour);
  const ended = finishJob(state, "job-1", { now: nearHour + 1000, outcome: "failed" });
  assert.equal(decideClaim(ended, request("chicago", { submissionId: "submission-2" }), { now: nearHour + 61000, jobId: "job-2" }).action, "cooldown");
});
test("a new job may claim only when both expired lease and cooldown permit it", () => {
  const old = claim();
  const next = claim(request("chicago", { submissionId: "submission-2" }), old, NOW + COOLDOWN_MS, "job-2");
  assert.equal(next.generation, 2);
  assert.equal(next.jobId, "job-2");
  assert.equal(next.nextAllowedAt, ISO(NOW + 2 * COOLDOWN_MS));
});
test("a heartbeat retains cooldown and blocks overlapping jobs even after an hour", () => {
  let state = claim();
  for (let i = 1; i <= 13; i++) state = heartbeat(state, "job-1", { now: NOW + i * 5 * 60000, state: "gathering" });
  assert.equal(state.nextAllowedAt, ISO(NOW + COOLDOWN_MS));
  assert.equal(decideClaim(state, request("chicago", { submissionId: "submission-2" }), { now: NOW + 66 * 60000, jobId: "job-2" }).action, "busy");
});
test("ownership, expiry, reused identifiers, and backward clocks fail closed", () => {
  const state = claim();
  assert.throws(() => heartbeat(state, "wrong", { now: NOW }), code("NOT_OWNER"));
  assert.throws(() => assertOwnership(state, "job-1", NOW + LEASE_MS), code("LEASE_EXPIRED"));
  assert.throws(() => heartbeat(state, "job-1", { now: NOW - 1 }), code("CLOCK_MOVED_BACKWARD"));
  assert.throws(() => decideClaim(state, request(), { now: NOW, jobId: "job-1" }), code("REUSED_JOB_ID"));
});
test("malformed control state is never treated as an unlocked state", () => {
  for (const changed of [{ schemaVersion: 2 }, { generation: -1 }, { nextAllowedAt: "bad" }, { leaseExpiresAt: "bad" }, { cities: ["unknown"] }, { recentSubmissionIds: null }, { progress: null }, { progress: {} }, { progress: { completedCities: 2, totalCities: 1, sourcesChecked: 0, verifiedEvents: 0 } }]) assert.throws(() => decideClaim({ ...claim(), ...changed }, request(), { now: NOW, jobId: "job-2" }));
});
test("requested target dates and scope cannot override publisher calculations", () => {
  const req = request();
  assert.throws(() => decideClaim(emptyStatus(), { ...req, targetWeekends: { cincinnati: { startDate: "2026-10-16", endDate: "2026-10-18" } } }, { now: NOW, jobId: "job-1" }), code("STALE_REQUEST"));
  assert.throws(() => decideClaim(emptyStatus(), { ...scheduledRequest(NOW), trigger: "manual", submissionId: "submission-1", submittedAt: ISO(NOW) }, { now: NOW, jobId: "job-1" }), code("INVALID_SCOPE"));
});
test("progress is monotonic, bounded, and cannot rewrite ownership or cooldown", () => {
  const state = heartbeat(claim(), "job-1", { now: NOW + 100, state: "verifying", progress: { verifiedEvents: 45 } });
  assert.throws(() => heartbeat(state, "job-1", { now: NOW + 200, state: "gathering" }), code("INVALID_TRANSITION"));
  for (const progress of [{ verifiedEvents: 44 }, { completedCities: 2 }, { nextAllowedAt: 0 }, { sourcesChecked: -1 }]) assert.throws(() => heartbeat(state, "job-1", { now: NOW + 200, progress }), code("INVALID_PROGRESS"));
});
test("failure releases lease, keeps cooldown/history, and uses a safe public error", () => {
  const state = claim();
  state.lastSuccessByCity.chicago = { editionId: "previous-edition" };
  const failed = finishJob(state, "job-1", { now: NOW + 100, outcome: "failed", errorCode: "source_verification_failed" });
  assert.equal(failed.state, "failed");
  assert.equal(failed.leaseExpiresAt, null);
  assert.equal(failed.nextAllowedAt, state.nextAllowedAt);
  assert.deepEqual(failed.lastSuccessByCity, state.lastSuccessByCity);
  assert.throws(() => finishJob(state, "job-1", { now: NOW + 100, outcome: "failed", errorCode: "Bearer secret" }), code("INVALID_ERROR"));
});
test("a commit or queued deploy alone cannot become success", () => {
  assert.throws(() => finishJob(claim(), "job-1", { now: NOW + 2000, outcome: "succeeded", publication: publication() }), code("UNVERIFIED_PUBLICATION"));
  for (const pub of [{ commitSha: SHA }, { ...publication(), verifiedAt: ISO(NOW + 3000) }, { ...publication(), editions: {} }, { ...publication(), commitSha: "not-a-sha" }]) assert.throws(() => finishJob(publishing(), "job-1", { now: NOW + 2000, outcome: "succeeded", publication: pub }), code("UNVERIFIED_PUBLICATION"));
});
test("verified publication updates only requested cities and preserves last good history", () => {
  const state = publishing();
  state.lastSuccessByCity.chicago = { editionId: "previous-chicago" };
  const done = finishJob(state, "job-1", { now: NOW + 2000, outcome: "succeeded", publication: publication() });
  assert.equal(done.state, "succeeded");
  assert.equal(done.progress.completedCities, 1);
  assert.equal(done.lastSuccessByCity.cincinnati.commitSha, SHA);
  assert.deepEqual(done.lastSuccessByCity.chicago, state.lastSuccessByCity.chicago);
  assert.equal(done.nextAllowedAt, state.nextAllowedAt);
  assert.throws(() => heartbeat(done, "job-1", { now: NOW + 2100 }), code("NOT_OWNER"));
  validateStatus(done);
});
test("honest Saturday or Sunday recovery dates fit the canonical target weekend", () => {
  for (const startDate of ["2026-10-10", "2026-10-11"]) {
    const pub = publication();
    pub.editions.cincinnati.startDate = startDate;
    const done = finishJob(publishing(), "job-1", { now: NOW + 2000, outcome: "succeeded", publication: pub });
    assert.equal(done.targetWeekends.cincinnati.startDate, "2026-10-09");
    assert.equal(done.publication.editions.cincinnati.startDate, startDate);
  }
  for (const startDate of ["2026-10-08", "2026-10-12", "2026-99-99"]) {
    const pub = publication();
    pub.editions.cincinnati.startDate = startDate;
    assert.throws(() => finishJob(publishing(), "job-1", { now: NOW + 2000, outcome: "succeeded", publication: pub }), code("UNVERIFIED_PUBLICATION"));
  }
});
test("publication identity preserves the exact served timestamp spelling", () => {
  for (const updatedAt of ["2026-10-10T22:00:01Z", "2026-10-10T18:00:01-04:00"]) {
    const pub = publication();
    pub.editions.cincinnati.updatedAt = updatedAt;
    const done = finishJob(publishing(), "job-1", { now: NOW + 2000, outcome: "succeeded", publication: pub });
    assert.equal(done.publication.editions.cincinnati.updatedAt, updatedAt);
    assert.equal(done.lastSuccessByCity.cincinnati.updatedAt, updatedAt);
  }
});

function memoryStore({ ambiguous = false, reject = false } = {}) {
  let version = 0, state = emptyStatus(), writes = 0;
  return {
    get writes() { return writes; },
    read: async () => ({ status: structuredClone(state), sha: String(version).padStart(40, "0") }),
    compareAndSet: async (expected, next) => {
      writes++;
      if (reject) return { isError: true, content: [{ text: "Write failed" }] };
      if (expected !== String(version).padStart(40, "0")) throw Object.assign(new Error("GitHub stale SHA conflict"), { status: 409 });
      state = structuredClone(next); version++;
      if (ambiguous) throw new Error("Connection lost after write");
      return { isError: false };
    },
  };
}
test("competing same-SHA writers produce exactly one research owner", async () => {
  const store = memoryStore();
  const results = await Promise.all([claimWithStore(store, request(), { jobId: "job-a", now: () => NOW }), claimWithStore(store, request("chicago", { submissionId: "submission-2" }), { jobId: "job-b", now: () => NOW })]);
  assert.equal(results.filter(result => result.acquired).length, 1);
  assert.equal(store.writes, 2);
});
test("uncertain transport failure recovers a committed claim by read-back without retry", async () => {
  const store = memoryStore({ ambiguous: true });
  const result = await claimWithStore(store, request(), { jobId: "job-a", now: () => NOW });
  assert.equal(result.acquired, true);
  assert.equal(result.writeOutcome, "error-or-uncertain");
  assert.equal(store.writes, 1);
});
test("success-looking or error tool returns do not grant ownership without saved state", async () => {
  const store = memoryStore({ reject: true });
  assert.equal((await claimWithStore(store, request(), { jobId: "job-a", now: () => NOW })).acquired, false);
  assert.equal(store.writes, 1);
});
test("missing read-back prevents research rather than retrying a possibly completed write", async () => {
  const store = memoryStore();
  const read = store.read;
  let reads = 0;
  store.read = async () => { if (++reads > 1) throw new Error("Read unavailable"); return read(); };
  await assert.rejects(claimWithStore(store, request(), { jobId: "job-a", now: () => NOW }), /Read unavailable/);
  assert.equal(store.writes, 1);
});
test("transport cannot write without a verified blob SHA", async () => {
  const store = memoryStore();
  store.read = async () => ({ status: emptyStatus(), sha: "missing" });
  await assert.rejects(claimWithStore(store, request(), { jobId: "job-a", now: () => NOW }), code("INVALID_SHA"));
  assert.equal(store.writes, 0);
});
test("offline CLI returns JSON and rejects malformed input without echoing it", () => {
  const cli = fileURLToPath(new URL("../scripts/publisher-control-cli.mjs", import.meta.url));
  const ok = spawnSync(process.execPath, [cli], { input: JSON.stringify({ operation: "empty" }), encoding: "utf8" });
  assert.equal(ok.status, 0);
  assert.deepEqual(JSON.parse(ok.stdout), { ok: true, result: emptyStatus() });
  const bad = spawnSync(process.execPath, [cli], { input: "PRIVATE_BAD_INPUT", encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).error.code, "INVALID_INPUT");
  assert.ok(!bad.stdout.includes("PRIVATE_BAD_INPUT"));
});
