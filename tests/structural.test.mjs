import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, css, js, manifest, sw, data] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("manifest.webmanifest", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("data/current-weekend.json", root), "utf8").then(JSON.parse)
]);

const checks = [
  [html.includes('id="search-input"'), "search control"],
  [html.includes('data-day="Today"'), "Today filter"],
  [html.includes('data-day="Friday"') && html.includes('data-day="Saturday"') && html.includes('data-day="Sunday"'), "weekend day filters"],
  [html.includes('id="roadtrip-toggle"'), "optional road-trip control"],
  [html.includes('id="plan-drawer"'), "itinerary planner"],
  [html.includes('id="event-dialog"'), "event details dialog"],
  [js.includes('data/current-weekend.json'), "replaceable weekly data loader"],
  [js.includes('ctw.favorites') && js.includes('ctw.plan'), "device-local persistence"],
  [js.includes("cleanSavedState") && js.includes("valid.has(id)"), "weekly edition storage cleanup"],
  [js.includes("Update delayed — expired edition") && js.includes("editionStale"), "unmistakable stale-edition safety state"],
  [sw.includes('endsWith("/data/current-weekend.json")') && sw.includes('cache:"no-store"') && !sw.match(/SHELL=\[[^\]]*current-weekend\.json/), "network-first weekly data cache policy"],
  [js.includes('google.com/maps/search'), "directions links"],
  [html.includes('id="matchmaker-dialog"') && js.includes("runMatchmaker"), "weekend matchmaker"],
  [html.includes('id="open-onboarding"') && html.includes('id="onboarding-dialog"') && js.includes("openOnboarding"), "compact first-time guide"],
  [html.includes("Plan a better weekend in three steps") && html.includes("Browse or use Matchmaker") && html.includes("Save and compare") && html.includes("Build your plan"), "three-step onboarding content"],
  [css.includes(".first-time-entry") && css.includes(".onboarding-steps"), "responsive onboarding presentation"],
  [html.includes('data-view="timeline"') && js.includes("timelineMarkup"), "timeline view"],
  [html.includes('id="time-select"') && js.includes("timeBucket"), "time-of-day filtering"],
  [html.includes('id="compare-dialog"') && js.includes("toggleCompare"), "three-event comparison"],
  [js.includes("buildPlanUrl") && js.includes('searchParams.set("plan"'), "shareable plan URL"],
  [js.includes("text/calendar") && js.includes("BEGIN:VCALENDAR"), "calendar export"],
  [js.includes("navigator.share") && js.includes("clipboard.writeText"), "native share with copy fallback"],
  [js.includes("ctw.notes") && js.includes("My private note"), "private event notes"],
  [js.includes("ctw.venues") && html.includes('data-quick="myvenues"'), "followed venue filter"],
  [html.includes('id="plan-stats"') && html.includes('id="route-plan"') && js.includes("Tight transfer"), "smart itinerary budget and route checks"],
  [css.includes('#dfa849'), "required brass palette"],
  [css.includes('Lora,Georgia,serif'), "required editorial heading stack"],
  [css.includes('@media(max-width:620px)'), "narrow layout"],
  [manifest.includes('Cincinnati This Weekend'), "installable app manifest"],
  [data.events.length >= 50, "50-event editorial bar"],
  [data.events.every((event) => event.sourceUrl && event.lastVerified), "source and verification on every event"],
  [data.events.some((event) => event.roadTrip), "optional two-hour road-trip inventory"],
  [data.events.every((event) => !event.roadTrip || event.travelMinutes > 90), "road-trip labeling threshold"],
];

const failures = checks.filter(([pass]) => !pass);
if (failures.length) {
  console.error(failures.map(([, label]) => `FAIL: ${label}`).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${checks.length} structural product checks.`);
