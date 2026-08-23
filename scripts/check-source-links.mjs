import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../data/current-weekend.json", import.meta.url), "utf8"));
const urls = [...new Set(data.events.map((event) => event.sourceUrl))];
const failures = [];

for (let index = 0; index < urls.length; index += 6) {
  const batch = urls.slice(index, index + 6);
  await Promise.all(batch.map(async (url) => {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000), headers: { "user-agent": "CincinnatiThisWeekend-LinkCheck/1.0" } });
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
