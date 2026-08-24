# This Weekend: Cincinnati & Philadelphia

One premium weekly event-discovery app with a city selector. Cincinnati remains the default city, Philadelphia is fully supported, and the data layout is ready for Chicago.

Live: https://cincinnati-this-weekend-cincy.netlify.app/

The app reads `data/cincinnati/current-weekend.json` or `data/philadelphia/current-weekend.json` based on the selector. Prior editions stay in city folders under `data/archive/`. See `WEEKLY-REFRESH.md` for the verified Wednesday research, deduplication, ranking, expiry, Git push, and Netlify verification model.

## Validate

```powershell
npm test
```

## Local preview

```powershell
python -m http.server 4187
```

No API key or personal data is required. Saved events and the itinerary remain in the visitor's browser storage.
