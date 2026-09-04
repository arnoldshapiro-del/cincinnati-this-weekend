# This Weekend: Cincinnati, Philadelphia, Chicago & Greater Washington DC

One premium weekly event-discovery app with a city selector. Cincinnati remains the default city; Philadelphia, Chicago and Greater Washington DC are fully supported.

Live: https://cincinnati-this-weekend-cincy.netlify.app/

The app reads `data/<city>/current-weekend.json` for Cincinnati, Philadelphia, Chicago or Greater Washington DC (`washington-dc`) based on the selector. Prior editions stay in city folders under `data/archive/`. See `WEEKLY-REFRESH.md` for the verified Wednesday research, deduplication, ranking, expiry, Git push, and Netlify verification model.

## Validate

```powershell
npm test
```

## Local preview

```powershell
python -m http.server 4187
```

No API key or personal data is required. Saved events and the itinerary remain in the visitor's browser storage.
