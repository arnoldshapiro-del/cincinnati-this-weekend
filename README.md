# Cincinnati This Weekend

A separate, premium weekly event-discovery app for Cincinnati, Northern Kentucky, and standout plans within a sensible drive.

The app reads its current edition from `data/current-weekend.json`. See `WEEKLY-REFRESH.md` for the verified Wednesday research, deduplication, ranking, expiry, and publishing model. See `COMPETITIVE-RESEARCH.md` for the source-backed product study.

## Validate

```powershell
npm test
```

## Local preview

```powershell
python -m http.server 4187
```

No API key or personal data is required. Saved events and the itinerary remain in the visitor's browser storage.
