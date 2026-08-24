import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, css, js, manifest, sw, cincinnati, philadelphia, chicago] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("manifest.webmanifest", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("data/cincinnati/current-weekend.json", root), "utf8").then(JSON.parse),
  readFile(new URL("data/philadelphia/current-weekend.json", root), "utf8").then(JSON.parse),
  readFile(new URL("data/chicago/current-weekend.json", root), "utf8").then(JSON.parse),
]);
const cityData = [cincinnati, philadelphia, chicago];

const checks = [
  [html.includes('id="city-select"') && html.includes('value="cincinnati"') && html.includes('value="philadelphia"') && html.includes('value="chicago"') && !html.includes('value="chicago" disabled'), "working three-city selector"],
  [js.includes("data/cincinnati/current-weekend.json") && js.includes("data/philadelphia/current-weekend.json") && js.includes("data/chicago/current-weekend.json"), "independent city data loaders"],
  [js.includes('searchParams.set("city"') && js.includes("switchCity"), "shareable city URL and city switching"],
  [js.includes("tw.${state.city}.favorites") && js.includes("tw.${state.city}.plan"), "city-scoped device persistence"],
  [html.includes('id="search-input"'), "search control"],
  [html.includes('data-day="Today"'), "Today filter"],
  [html.includes('data-day="Friday"') && html.includes('data-day="Saturday"') && html.includes('data-day="Sunday"'), "weekend day filters"],
  [html.includes('id="roadtrip-toggle"'), "optional road-trip control"],
  [html.includes('id="plan-drawer"'), "itinerary planner"],
  [html.includes('id="event-dialog"'), "event details dialog"],
  [js.includes("cleanSavedState") && js.includes("valid.has(id)"), "weekly edition storage cleanup"],
  [js.includes("Update delayed — expired edition") && js.includes("editionStale"), "unmistakable stale-edition safety state"],
  [sw.includes("current-weekend.json") && sw.includes('cache:"no-store"'), "network-first weekly data cache policy"],
  [js.includes('google.com/maps/search'), "directions links"],
  [html.includes('id="matchmaker-dialog"') && js.includes("runMatchmaker"), "weekend matchmaker"],
  [html.includes('id="open-onboarding"') && html.includes('id="onboarding-dialog"') && js.includes("openOnboarding"), "compact first-time guide"],
  [html.includes("Plan a better weekend in three steps") && html.includes("Browse or use Matchmaker") && html.includes("Save and compare") && html.includes("Build your plan"), "three-step onboarding content"],
  [css.includes(".first-time-entry") && css.includes(".onboarding-steps"), "responsive onboarding presentation"],
  [css.includes(".city-switcher"), "responsive city selector presentation"],
  [html.includes('data-view="timeline"') && js.includes("timelineMarkup"), "timeline view"],
  [html.includes('id="time-select"') && js.includes("timeBucket"), "time-of-day filtering"],
  [html.includes('id="compare-dialog"') && js.includes("toggleCompare"), "three-event comparison"],
  [js.includes("buildPlanUrl") && js.includes('searchParams.set("plan"'), "shareable plan URL"],
  [js.includes("text/calendar") && js.includes("BEGIN:VCALENDAR"), "calendar export"],
  [js.includes("navigator.share") && js.includes("clipboard.writeText"), "native share with copy fallback"],
  [js.includes("My private note"), "private event notes"],
  [html.includes('data-quick="myvenues"'), "followed venue filter"],
  [html.includes('id="plan-stats"') && html.includes('id="route-plan"') && js.includes("Tight transfer"), "smart itinerary budget and route checks"],
  [css.includes("#dfa849"), "required brass palette"],
  [css.includes("Lora,Georgia,serif"), "required editorial heading stack"],
  [css.includes("@media(max-width:620px)"), "narrow layout"],
  [manifest.includes("This Weekend"), "installable app manifest"],
  [cityData.every((data) => data.events.length >= 50), "50-event editorial bar in every city"],
  [cityData.every((data) => data.events.every((item) => item.sourceUrl && item.lastVerified)), "source and verification on every event"],
  [cityData.every((data) => data.events.some((item) => item.roadTrip)), "optional two-hour road-trip inventory in every city"],
  [cityData.every((data) => data.events.every((item) => !item.roadTrip || item.travelMinutes > 90)), "road-trip labeling threshold"],
  [cityData.every((data) => data.events.filter((item) => item.featured).length === 10), "ten featured picks in every city"],
];

const failures = checks.filter(([pass]) => !pass);
if (failures.length) {
  console.error(failures.map(([, label]) => `FAIL: ${label}`).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${checks.length} structural product checks across ${cityData.length} cities.`);
