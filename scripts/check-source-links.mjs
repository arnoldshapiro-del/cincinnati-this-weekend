import { readFile } from "node:fs/promises";

const data = await Promise.all([
  "../data/cincinnati/current-weekend.json",
  "../data/philadelphia/current-weekend.json",
].map(async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"))));
const urls = [...new Set(data.flatMap((edition) => edition.events.map((event) => event.sourceUrl)))];
const failures = [];

for (let index = 0; index < urls.length; index += 6) {
  const batch = urls.slice(index, index + 6);
  await Promise.all(batch.map(async (url) => {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000), headers: { "user-agent": "ThisWeekendCityGuide-LinkCheck/1.0" } });
        if (response.status === 404 || response.status >= 500) lastError = `${response.status} ${url}`;
        else return;
      } catch (error) {
        lastError = `${error.name}: ${url}`;
      }
    }
    failures.push(lastError);
  }));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${urls.length} unique event source URLs are reachable (2xx/3xx or access-controlled).`);
