/**
 * Pure publisher admission/lease rules. No network, credentials, or implicit writes.
 * The GitHub transport must use blob-SHA conditional updates; see the setup guide.
 */
export const CITIES = Object.freeze(["cincinnati", "philadelphia", "chicago", "washington-dc"]);
export const TIMEZONES = Object.freeze({ cincinnati: "America/New_York", philadelphia: "America/New_York", chicago: "America/Chicago", "washington-dc": "America/New_York" });
export const CONTROL = Object.freeze({ repository: "arnoldshapiro-del/cincinnati-this-weekend", branch: "refresh-control", path: "status.json", siteId: "ced21387-3861-49f0-ac0d-d7d4443bcebe", connectorId: "asdk_app_691f1f8f72408191afdbbdf8242bdf86", formName: "weekend-refresh" });
export const COOLDOWN_MS = 60 * 60 * 1000;
export const LEASE_MS = 20 * 60 * 1000;
export const EVENT_MAX_AGE_MS = 24 * COOLDOWN_MS;
const PHASES = ["queued", "gathering", "verifying", "publishing"];
const STATES = [...PHASES, "idle", "succeeded", "failed"];
const ERROR_MESSAGES = Object.freeze({ source_verification_failed: "Enough current events could not be verified.", validation_failed: "The proposed edition did not pass validation.", deployment_failed: "The new edition could not be confirmed on the live site.", publisher_failed: "The refresh could not finish. The last published guide remains available." });
const clone = value => structuredClone(value);
const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
const time = value => {
  const n = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(n)) fail("INVALID_TIME", "A valid timestamp is required.");
  return n;
};
const iso = value => new Date(time(value)).toISOString();
const id = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(value);
const validDate = value => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
};
const sha = value => typeof value === "string" && /^[a-f0-9]{40,64}$/i.test(value);

export function targetWeekend(city, now = Date.now()) {
  if (!CITIES.includes(city)) fail("INVALID_CITY", "Unsupported city.");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONES[city], year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(time(now)));
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const local = new Date(`${fields.year}-${fields.month}-${fields.day}T12:00:00Z`);
  const day = local.getUTCDay();
  local.setUTCDate(local.getUTCDate() + (day === 0 ? -2 : 5 - day));
  const startDate = local.toISOString().slice(0, 10);
  local.setUTCDate(local.getUTCDate() + 2);
  return { startDate, endDate: local.toISOString().slice(0, 10) };
}

export function scheduledRequest(now = Date.now()) {
  return { trigger: "scheduled", cities: [...CITIES], targetWeekends: Object.fromEntries(CITIES.map(city => [city, targetWeekend(city, now)])), submissionId: null };
}

/** The adapter sets verifiedByConnector only from an authenticated event/read. */
export function manualRequest(event, { formId, now = Date.now() } = {}) {
  const at = time(now);
  if (!id(formId) || formId.startsWith("FORM_ID")) fail("UNCONFIGURED_FORM", "The deployed form ID has not been verified.");
  if (event?.verifiedByConnector !== true || event.connectorId !== CONTROL.connectorId || event.siteId !== CONTROL.siteId || event.formId !== formId || event.formName !== CONTROL.formName || !id(event.submissionId)) fail("UNVERIFIED_EVENT", "The event source, site, form, and submission must be verified.");
  const created = time(event.createdAt);
  if (created > at + 5 * 60 * 1000 || at - created > EVENT_MAX_AGE_MS) fail("EVENT_TIME_OUT_OF_RANGE", "The submission timestamp is outside the accepted window.");
  const city = event.data?.city;
  if (!CITIES.includes(city) || (event.data?.["bot-field"] ?? "") !== "") fail("INVALID_FORM_DATA", "The city or honeypot field is invalid.");
  // Do not copy submitted prompts, URLs, dates, destinations, or arbitrary fields.
  return { trigger: "manual", cities: [city], targetWeekends: { [city]: targetWeekend(city, at) }, submissionId: event.submissionId, submittedAt: iso(created) };
}

export function emptyStatus() {
  return { schemaVersion: 1, generation: 0, jobId: null, state: "idle", trigger: null, cities: [], targetWeekends: {}, startedAt: null, updatedAt: null, leaseExpiresAt: null, nextAllowedAt: null, progress: { completedCities: 0, totalCities: 0, sourcesChecked: 0, verifiedEvents: 0 }, publication: null, lastSuccessByCity: {}, recentSubmissionIds: [], error: null };
}

function validateScope(scope) {
  if (!scope || !Array.isArray(scope.cities) || scope.cities.length < 1 || scope.cities.length > 4 || new Set(scope.cities).size !== scope.cities.length || scope.cities.some(city => !CITIES.includes(city))) fail("INVALID_SCOPE", "A unique supported city scope is required.");
  for (const city of scope.cities) {
    const target = scope.targetWeekends?.[city];
    if (!validDate(target?.startDate) || !validDate(target?.endDate) || time(`${target.endDate}T12:00:00Z`) - time(`${target.startDate}T12:00:00Z`) !== 2 * 86400000 || new Date(`${target.startDate}T12:00:00Z`).getUTCDay() !== 5) fail("INVALID_WEEKEND", "The target must be a Friday through Sunday.");
  }
}

export function validateStatus(status) {
  if (!status || status.schemaVersion !== 1 || !STATES.includes(status.state) || !Number.isSafeInteger(status.generation) || status.generation < 0 || !Array.isArray(status.recentSubmissionIds) || status.recentSubmissionIds.length > 128 || status.recentSubmissionIds.some(value => !id(value))) fail("INVALID_STATUS", "Publisher state is missing or invalid; fail closed.");
  if (!status.lastSuccessByCity || typeof status.lastSuccessByCity !== "object" || Array.isArray(status.lastSuccessByCity)) fail("INVALID_STATUS", "Publication history is invalid.");
  const progress = status.progress;
  if (!progress || ["completedCities", "totalCities", "sourcesChecked", "verifiedEvents"].some(key => !Number.isSafeInteger(progress[key]) || progress[key] < 0) || progress.completedCities > progress.totalCities || progress.totalCities !== (status.state === "idle" ? 0 : status.cities?.length)) fail("INVALID_STATUS", "Publisher progress must contain valid bounded counters.");
  if (status.state === "idle") {
    if (status.jobId !== null || status.generation !== 0 || status.leaseExpiresAt !== null || status.nextAllowedAt !== null || !Array.isArray(status.cities) || status.cities.length !== 0) fail("INVALID_STATUS", "Idle state must be pristine.");
    return status;
  }
  validateScope(status);
  if (!id(status.jobId) || status.generation < 1 || !["manual", "scheduled"].includes(status.trigger)) fail("INVALID_STATUS", "Job identity is invalid.");
  const started = time(status.startedAt);
  if (time(status.updatedAt) < started || time(status.nextAllowedAt) < started + COOLDOWN_MS) fail("INVALID_STATUS", "Job timing is invalid.");
  if (PHASES.includes(status.state) && time(status.leaseExpiresAt) <= started) fail("INVALID_STATUS", "An active job requires a lease.");
  if (!PHASES.includes(status.state) && status.leaseExpiresAt !== null) fail("INVALID_STATUS", "A terminal job must release its lease.");
  return status;
}

export function coversRequest(status, request) {
  return request.cities.every(city => status.cities.includes(city) && status.targetWeekends[city]?.startDate === request.targetWeekends[city].startDate && status.targetWeekends[city]?.endDate === request.targetWeekends[city].endDate);
}

export function decideClaim(status, request, { jobId, now = Date.now() } = {}) {
  validateStatus(status);
  validateScope(request);
  const at = time(now);
  if (!id(jobId) || !["manual", "scheduled"].includes(request.trigger)) fail("INVALID_REQUEST", "A publisher-generated job ID and trigger are required.");
  if (status.jobId === jobId) fail("REUSED_JOB_ID", "Generate a new unique job ID for every claim attempt.");
  if ((request.trigger === "manual" && request.cities.length !== 1) || (request.trigger === "scheduled" && request.cities.length !== CITIES.length)) fail("INVALID_SCOPE", "Manual runs cover one city; scheduled runs cover all four.");
  if (status.updatedAt && at < time(status.updatedAt)) fail("CLOCK_MOVED_BACKWARD", "The clock precedes the saved publisher update.");
  if (request.trigger === "manual") {
    if (!id(request.submissionId) || !request.submittedAt || at - time(request.submittedAt) > EVENT_MAX_AGE_MS || time(request.submittedAt) > at + 5 * 60 * 1000) fail("INVALID_REQUEST", "A recent verified submission is required.");
    if (status.recentSubmissionIds.includes(request.submissionId)) return { action: "duplicate", jobId: status.jobId, nextAllowedAt: status.nextAllowedAt };
  }
  if (request.cities.some(city => { const target = targetWeekend(city, at); return request.targetWeekends[city].startDate !== target.startDate || request.targetWeekends[city].endDate !== target.endDate; })) fail("STALE_REQUEST", "Recalculate the current target weekend before claiming.");
  if (PHASES.includes(status.state) && time(status.leaseExpiresAt) > at) return { action: coversRequest(status, request) ? "coalesce" : "busy", jobId: status.jobId, nextAllowedAt: status.nextAllowedAt, retryAt: iso(Math.max(time(status.leaseExpiresAt), time(status.nextAllowedAt))) };
  if (status.nextAllowedAt && time(status.nextAllowedAt) > at) return { action: "cooldown", jobId: status.jobId, nextAllowedAt: status.nextAllowedAt, retryAt: status.nextAllowedAt };
  const next = { ...emptyStatus(), generation: status.generation + 1, jobId, state: "queued", trigger: request.trigger, cities: [...request.cities], targetWeekends: clone(request.targetWeekends), startedAt: iso(at), updatedAt: iso(at), leaseExpiresAt: iso(at + LEASE_MS), nextAllowedAt: iso(at + COOLDOWN_MS), progress: { completedCities: 0, totalCities: request.cities.length, sourcesChecked: 0, verifiedEvents: 0 }, lastSuccessByCity: clone(status.lastSuccessByCity), recentSubmissionIds: [...status.recentSubmissionIds, ...(request.submissionId ? [request.submissionId] : [])].slice(-128) };
  return { action: "claim", status: next };
}

export function assertOwnership(status, jobId, now = Date.now()) {
  validateStatus(status);
  const at = time(now);
  if (status.jobId !== jobId || !PHASES.includes(status.state)) fail("NOT_OWNER", "This run does not own an active publisher job.");
  if (at < time(status.updatedAt)) fail("CLOCK_MOVED_BACKWARD", "The clock precedes the saved publisher update.");
  if (time(status.leaseExpiresAt) <= at) fail("LEASE_EXPIRED", "The publisher lease has expired.");
  return true;
}

export function heartbeat(status, jobId, { now = Date.now(), state = status.state, progress = {} } = {}) {
  assertOwnership(status, jobId, now);
  if (!PHASES.includes(state) || PHASES.indexOf(state) < PHASES.indexOf(status.state)) fail("INVALID_TRANSITION", "An active phase cannot move backward.");
  const nextProgress = { ...status.progress };
  for (const [key, value] of Object.entries(progress)) {
    if (!["completedCities", "sourcesChecked", "verifiedEvents"].includes(key) || !Number.isSafeInteger(value) || value < 0 || value < (nextProgress[key] || 0) || (key === "completedCities" && value > status.cities.length)) fail("INVALID_PROGRESS", "Progress must be bounded, nonnegative, and monotonic.");
    nextProgress[key] = value;
  }
  return { ...clone(status), state, updatedAt: iso(now), leaseExpiresAt: iso(time(now) + LEASE_MS), progress: nextProgress };
}

export function finishJob(status, jobId, { now = Date.now(), outcome, publication, errorCode = "publisher_failed" } = {}) {
  assertOwnership(status, jobId, now);
  const next = { ...clone(status), updatedAt: iso(now), leaseExpiresAt: null };
  if (outcome === "failed") {
    if (!Object.hasOwn(ERROR_MESSAGES, errorCode)) fail("INVALID_ERROR", "Use a safe public error code.");
    return { ...next, state: "failed", error: { code: errorCode, message: ERROR_MESSAGES[errorCode] } };
  }
  if (outcome !== "succeeded" || status.state !== "publishing" || !sha(publication?.commitSha) || !id(publication?.deployId) || !publication?.verifiedAt || time(publication.verifiedAt) < time(status.startedAt) || time(publication.verifiedAt) > time(now)) fail("UNVERIFIED_PUBLICATION", "Success requires a verified production deployment.");
  const editions = {};
  for (const city of status.cities) {
    const edition = publication.editions?.[city];
    const target = status.targetWeekends[city];
    if (!id(edition?.editionId) || !validDate(edition?.startDate) || edition.startDate < target.startDate || edition.startDate > target.endDate || edition.endDate !== target.endDate || typeof edition.updatedAt !== "string" || time(edition.updatedAt) < time(status.startedAt) || time(edition.updatedAt) > time(now)) fail("UNVERIFIED_PUBLICATION", "Every requested city must have a verified new edition.");
    editions[city] = { editionId: edition.editionId, startDate: edition.startDate, endDate: edition.endDate, updatedAt: edition.updatedAt };
    next.lastSuccessByCity[city] = { ...editions[city], commitSha: publication.commitSha, publishedAt: iso(publication.verifiedAt) };
  }
  return { ...next, state: "succeeded", error: null, publishedAt: iso(publication.verifiedAt), publication: { commitSha: publication.commitSha, deployId: publication.deployId, verifiedAt: iso(publication.verifiedAt), editions }, progress: { ...next.progress, completedCities: status.cities.length } };
}

/**
 * Adapter contract: read() -> { status, sha }; compareAndSet(sha, nextStatus).
 * CAS must reject stale GitHub blob SHAs. This helper writes ONCE and always
 * reads back, even on errors. It never guesses whether an error was a conflict.
 */
export async function claimWithStore(store, request, { jobId, now = Date.now } = {}) {
  const before = await store.read();
  if (!sha(before.sha)) fail("INVALID_SHA", "A verified current blob SHA is required.");
  const decision = decideClaim(before.status, request, { jobId, now: now() });
  if (decision.action !== "claim") return { acquired: false, decision, status: before.status };
  let writeOutcome = "returned";
  try { await store.compareAndSet(before.sha, decision.status); } catch { writeOutcome = "error-or-uncertain"; }
  // A success-looking message is insufficient. Recover ownership from state.
  const after = await store.read();
  if (!sha(after.sha)) fail("INVALID_SHA", "Read-back must include the current blob SHA.");
  validateStatus(after.status);
  try {
    assertOwnership(after.status, jobId, now());
    if (after.status.generation !== decision.status.generation || after.status.startedAt !== decision.status.startedAt || !coversRequest(after.status, request)) fail("CLAIM_MISMATCH", "The read-back does not match the proposed claim.");
    return { acquired: true, decision: { action: "acquired" }, status: after.status, sha: after.sha, writeOutcome };
  } catch (error) {
    if (!["NOT_OWNER", "LEASE_EXPIRED", "CLAIM_MISMATCH"].includes(error.code)) throw error;
    return { acquired: false, decision: { action: "not-acquired", reason: error.code }, status: after.status, writeOutcome };
  }
}
