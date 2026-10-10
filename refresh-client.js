import { expectedWeekend, fetchPublishedEdition, isNewerEdition } from "./edition-status.js";

export const REFRESH_STATES = new Set(["idle", "queued", "gathering", "verifying", "publishing", "succeeded", "failed"]);
const CITIES = new Set(["cincinnati", "philadelphia", "chicago", "washington-dc"]);
async function boundedRequest(url, options, fetcher, readJson = false) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), 15000);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    return readJson ? { ok: response.ok, value: response.ok ? await response.json() : null } : response;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
}
const delay = (ms, signal) => new Promise((resolve, reject) => {
  const stop = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
  const timer = setTimeout(() => { signal?.removeEventListener("abort", stop); resolve(); }, ms);
  signal?.addEventListener("abort", stop, { once: true });
  if (signal?.aborted) stop();
});

export function validateRefreshStatus(value) {
  if (!value || value.schemaVersion !== 1 || !REFRESH_STATES.has(value.state)) return null;
  if (value.state !== "idle" && (!value.jobId || !Array.isArray(value.cities) || !value.cities.length || value.cities.some(city => !CITIES.has(city)) || !value.targetWeekends)) return null;
  return value;
}

export async function readRefreshStatus(config, { fetcher = fetch, signal, now = Date.now } = {}) {
  if (!config.statusUrl) return null;
  const url = new URL(config.statusUrl);
  url.searchParams.set("check", String(now()));
  const response = await boundedRequest(url, { cache: "no-store", signal }, fetcher, true);
  if (!response.ok) return null;
  return validateRefreshStatus(response.value);
}

export function refreshProgressText(status) {
  switch (status?.state) {
    case "queued": return "Your refresh is queued. The last loaded guide remains available.";
    case "gathering": return "Research is running and gathering current events from official sources.";
    case "verifying": return "New events are being checked before publication.";
    case "publishing": return "Verified guides are being published. Waiting for the live site to update.";
    case "succeeded": return "Publication finished. Checking the live guide now.";
    case "failed": return "The research run could not finish. The last published guide is still available.";
    case "waiting": return "The request was sent, but publisher status is temporarily unavailable. Your last loaded guide is still shown.";
    default: return "Refresh requested. Waiting for the publisher to start; the last loaded guide is still shown.";
  }
}

export function matchesPublishedEdition(data, status, city, target) {
  const publication = status?.publication;
  const expected = publication?.editions?.[city];
  const weekend = data?.weekend;
  return Boolean(publication?.commitSha && publication?.deployId && publication?.verifiedAt && expected?.editionId &&
    weekend?.editionId === expected.editionId && Number.isFinite(Date.parse(expected.updatedAt)) && Date.parse(weekend.updatedAt) === Date.parse(expected.updatedAt) &&
    weekend.startDate === expected.startDate && weekend.endDate === expected.endDate &&
    expected.startDate >= target.startDate && expected.startDate <= target.endDate && expected.endDate === target.endDate);
}

export async function requestResearchRefresh({ city, currentWeekend, dataUrl, config, signal, onProgress = () => {}, fetcher = fetch, now = Date.now, sleep = delay, requestId = globalThis.crypto.randomUUID(), baseUrl = globalThis.location?.href }) {
  if (!CITIES.has(city)) throw new Error("Choose a supported city.");
  if (!config.enabled || !config.statusUrl) throw new Error("Online research requests are not enabled yet.");
  const cityTimezone = city === "chicago" ? "America/Chicago" : "America/New_York";
  const targetWindow = expectedWeekend(new Date(now()), cityTimezone);
  const target = targetWindow.startDate;
  const started = now();
  let existing = null;
  try { existing = await readRefreshStatus(config, { fetcher, signal, now }); } catch (error) { if (error.name === "AbortError") throw error; }
  const coversCity = status => status?.cities?.includes(city) && status.targetWeekends?.[city]?.startDate === target;
  const jobRunning = existing && ["queued", "gathering", "verifying", "publishing"].includes(existing.state) && Date.parse(existing.leaseExpiresAt || "") > started;
  const active = jobRunning && coversCity(existing);
  if(jobRunning && !active)return {state:"busy",status:existing};
  const cooling = existing && Date.parse(existing.nextAllowedAt || "") > started;
  if (!active && cooling) return { state: "cooldown", status: existing };

  if (!active) {
    const body = new URLSearchParams({ "form-name": "weekend-refresh", city, requestId, requestedWeekendStart: target, "bot-field": "" });
    const response = await boundedRequest(new URL("/", baseUrl), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(), signal }, fetcher);
    if (!response.ok) throw new Error(`The refresh request could not be accepted (${response.status}).`);
    // An accepted form is not evidence that research has started or succeeded.
    onProgress({ state: "accepted", requestId, targetWeekendStart: target });
  } else onProgress(existing);

  const pollEvery = Math.max(10000, Number(config.pollIntervalMs) || 30000);
  const observationWindow = Number(config.pollWindowMs) || 20 * 60 * 1000;
  let status = existing;
  let publisherStarted = Boolean(active);
  while (now() - started < observationWindow) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      status = await readRefreshStatus(config, { fetcher, signal, now });
      const currentRun = status && ["queued", "gathering", "verifying", "publishing"].includes(status.state);
      const validLease = currentRun && Date.parse(status.leaseExpiresAt || "") > now();
      const recentJob = Date.parse(status?.startedAt || "") >= started - 5000;
      if(validLease && !coversCity(status))return {state:"busy",status};
      const matches = coversCity(status) && (validLease || (active && status.jobId === existing.jobId) || recentJob);
      if(!matches && recentJob && Date.parse(status?.nextAllowedAt || "") > now())return {state:"cooldown",status};
      if (matches) {
        if(currentRun && !validLease)return {state:"stalled",status};
        publisherStarted = true;
        onProgress(status);
        if (status.state === "failed") return { state: "failed", status };
        if (status.state === "succeeded") {
          const data = await fetchPublishedEdition(city, dataUrl, { fetcher, baseUrl, signal });
          if (matchesPublishedEdition(data, status, city, targetWindow) && isNewerEdition(data.weekend, currentWeekend)) return { state: "succeeded", status, data };
          // A status update may precede CDN visibility; keep waiting for the actual data.
        }
      }
    } catch (error) {
      if (error.name === "AbortError") throw error;
      onProgress({ state: "waiting", requestId, targetWeekendStart: target });
    }
    await sleep(pollEvery, signal);
  }
  if(status && ["queued", "gathering", "verifying", "publishing"].includes(status.state) && Date.parse(status.leaseExpiresAt || "") <= now())return {state:"stalled",status};
  return { state: "pending", status, publisherStarted };
}
