# Cincinnati This Weekend

A separate, premium weekly event-discovery app for Cincinnati, Northern Kentucky, and standout plans within a sensible drive.

Live: https://cincinnati-this-weekend-cincy.netlify.app/

The app reads its current edition from `data/current-weekend.json`, and prior editions stay in `data/archive/`. See `WEEKLY-REFRESH.md` for the verified Wednesday research, deduplication, ranking, expiry, Git push, and Netlify verification model. See `COMPETITIVE-RESEARCH.md` for the source-backed product study.

## Validate

```powershell
npm test
```

## Local preview

```powershell
python -m http.server 4187
```

No API key or personal data is required. Saved events and the itinerary remain in the visitor's browser storage.
