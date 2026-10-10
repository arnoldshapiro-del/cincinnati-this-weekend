import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [city, ...extra] = process.argv.slice(2);
if (!city || extra.length) {
  console.error("Usage: npm run test:manual -- CITY");
  process.exit(1);
}
const root = fileURLToPath(new URL("../", import.meta.url));
try {
  execFileSync(process.execPath, ["scripts/validate-weekend-data.mjs", "--city", city], { cwd: root, stdio: "inherit" });
  // The other cities keep their existing data, but must still pass every structural check.
  const tests = readdirSync(new URL("../tests/", import.meta.url)).filter(name => name.endsWith(".test.mjs")).map(name => `tests/${name}`);
  execFileSync(process.execPath, ["--test", ...tests], { cwd: root, stdio: "inherit" });
} catch (error) {
  process.exit(error.status || 1);
}
