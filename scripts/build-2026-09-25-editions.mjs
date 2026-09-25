// Publish the verified September 25–27 edition for all four cities.
// Source-backed candidate series live in scripts/editions/2026-09-25/.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';

const startDate = '2026-09-25';
const endDate = '2026-09-27';
const dayName = { '2026-09-25': 'Friday', '2026-09-26': 'Saturday', '2026-09-27': 'Sunday' };
const cities = ['cincinnati', 'philadelphia', 'chicago', 'washington-dc'];
const now = new Date();
const lastVerified = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

function slug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
}
function seriesId(url) {
  const parsed = new URL(url);
  return slug(`${parsed.hostname}${parsed.pathname}`);
}
function displayStamp(zone) {
  const label = zone === 'America/Chicago' ? 'CT' : 'ET';
  return `${new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(now)} ${label}`;
}
function categoryFor(raw) {
  const value = raw.toLowerCase();
  if (/festival|parade/.test(value)) return 'Festivals';
  if (/theater|theatre|circus/.test(value)) return 'Theater';
  if (/comedy/.test(value)) return 'Comedy';
  if (/music|concert|jazz|dance|orchestra/.test(value)) return 'Music';
  if (/sport|fitness|equestrian/.test(value)) return 'Sports';
  if (/family|kids|teen|animals/.test(value)) return 'Family';
  if (/art|museum|photography|film/.test(value)) return 'Arts';
  if (/tour|history|architecture|walking/.test(value)) return 'Tours';
  if (/nature|outdoor|garden|worth the drive/.test(value)) return 'Outdoors';
  if (/food|drink/.test(value)) return 'Food & drink';
  if (/workshop/.test(value)) return 'Workshops';
  return 'Community';
}
function expand(city, candidates) {
  if (!Array.isArray(candidates)) throw new Error(`${city}: candidates must be an array`);
  const events = [];
  const seen = new Set();
  const featured = [];
  for (const [i, item] of candidates.entries()) {
    for (const key of ['title', 'dates', 'venue', 'neighborhood', 'address', 'category', 'priceLabel', 'description', 'sourceName', 'sourceUrl']) {
      if (!item[key]) throw new Error(`${city} candidate ${i} missing ${key}`);
    }
    if (!/^https:\/\//.test(item.sourceUrl)) throw new Error(`${city} candidate ${i} needs HTTPS source`);
    if (item.description.length < 45) throw new Error(`${city} candidate ${i} description too short`);
    if (!Array.isArray(item.dates) || !item.dates.length) throw new Error(`${city} candidate ${i} has no dates`);
    const minutes = Number(item.travelMinutes ?? 0);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 120) throw new Error(`${city} candidate ${i} invalid drive estimate`);
    for (const date of item.dates) {
      if (!dayName[date]) throw new Error(`${city} candidate ${i} outside edition: ${date}`);
      const signature = `${item.title}|${item.venue}|${date}`.toLowerCase();
      if (seen.has(signature)) throw new Error(`${city} duplicate event day: ${signature}`);
      seen.add(signature);
      const id = `${slug(item.title).slice(0, 45)}-${slug(item.venue).slice(0, 25)}-${date}-${i}`;
      const category = categoryFor(item.category);
      const tags = [category.toLowerCase(), item.category.toLowerCase(), minutes > 90 ? 'road trip' : 'local'];
      if (/family|kids/.test(item.category.toLowerCase())) tags.push('family');
      if (['Music', 'Theater', 'Comedy', 'Arts', 'Food & drink'].includes(category) && !/children only|kids only/i.test(item.age || '')) tags.push('date night');
      const event = {
        id, title: item.title, date, day: dayName[date], time: item.times?.[date] || item.time || 'See official schedule',
        venue: item.venue, neighborhood: item.neighborhood, address: item.address,
        category, priceValue: item.priceValue ?? null, priceLabel: item.priceLabel,
        travelMinutes: minutes, roadTrip: minutes > 90, featured: false,
        age: item.age || 'All ages', tags: [...new Set(tags)],
        description: item.description, sourceName: item.sourceName, sourceUrl: item.sourceUrl,
        lastVerified, seriesId: seriesId(item.sourceUrl),
      };
      events.push(event);
      if (item.featuredCandidate && !featured.some((x) => x.title === item.title)) featured.push(event);
    }
  }
  if (events.length < 50) throw new Error(`${city}: ${events.length} event-days, need at least 50`);
  if (!events.some((item) => item.roadTrip)) throw new Error(`${city}: no 91–120 minute road trip`);
  for (const event of featured.slice(0, 10)) event.featured = true;
  if (featured.length < 10) throw new Error(`${city}: only ${featured.length} featured candidates`);
  return events;
}

const prepared = [];
for (const city of cities) {
  const candidates = JSON.parse(await readFile(new URL(`./editions/2026-09-25/${city}-candidates.json`, import.meta.url), 'utf8'));
  const current = new URL(`../data/${city}/current-weekend.json`, import.meta.url);
  const prior = JSON.parse(await readFile(current, 'utf8'));
  if (prior.weekend.startDate !== '2026-09-18') throw new Error(`${city}: expected to archive Sep 18–20, found ${prior.weekend.startDate}`);
  const events = expand(city, candidates);
  const stamp = displayStamp(prior.city.timezone);
  const cityMeta = { ...prior.city, verifiedAt: stamp, updatedAt: now.toISOString() };
  const weekend = {
    ...prior.weekend, label: 'Friday, September 25 – Sunday, September 27, 2026', shortLabel: 'Sep 25–27',
    startDate, endDate, verifiedAt: stamp, updatedAt: now.toISOString(),
    refreshTarget: 'Wednesday 9:35 AM America/New_York', editionStatus: 'verified-current',
    lastSuccessfulEdition: 'September 25–27, 2026',
  };
  prepared.push({ city, current, prior, edition: { schemaVersion: 2, city: cityMeta, weekend, events } });
}

for (const { city, current, prior, edition } of prepared) {
  const archive = new URL(`../data/archive/${city}/weekend-2026-09-18.json`, import.meta.url);
  await mkdir(new URL(`../data/archive/${city}/`, import.meta.url), { recursive: true });
  try { await access(archive); throw new Error(`${city}: archive already exists; stop before overwrite`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(archive, `${JSON.stringify(prior, null, 2)}\n`);
  await writeFile(current, `${JSON.stringify(edition, null, 2)}\n`);
  console.log(`${city}: ${edition.events.length} events, 10 featured, archived Sep 18–20`);
}
