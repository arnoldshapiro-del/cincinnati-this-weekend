import { mkdir, writeFile } from "node:fs/promises";
import { EVENTS, WEEKEND } from "../events.js";

const output = {
  schemaVersion: 1,
  weekend: {
    ...WEEKEND,
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    updatedAt: "2026-08-13T15:00:00-04:00",
    timezone: "America/New_York",
    defaultDriveMinutes: 90,
    roadTripMaxMinutes: 120,
    refreshTarget: "Wednesday 9:00 AM America/New_York",
    editionStatus: "current"
  },
  events: EVENTS
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/current-weekend.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${EVENTS.length} events.`);
