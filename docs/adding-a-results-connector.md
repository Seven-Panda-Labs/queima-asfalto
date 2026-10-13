# Adding a results connector

How to add a timing platform to the official results lookup. Read [`architecture.md`](./architecture.md) first.

A connector takes the user's results profile (name, aliases) and a **public** results URL, fetches from the `lookupOfficialResults` Cloud Function, and returns `OfficialResultCandidate[]` (see [`types.ts`](../shared/officialResults/types.ts)). It never writes to Firestore: the user confirms in the app.

Keep parsing pure in `shared/officialResults/` (tested offline with Vitest and fixtures) and only HTTP in `functions/src/connectors/`. The Functions `build` copies `shared/officialResults` into `functions/src/shared`.

## Checklist

Replace `myplatform` with the slug (e.g. `eqtiming`).

1. **Type and label**, [`shared/officialResults/types.ts`](../shared/officialResults/types.ts): add to `ResultsPlatform` and `RESULTS_PLATFORMS`, map in `resultsPlatformLabel()`.
2. **URL detection**, [`detectPlatform.ts`](../shared/officialResults/detectPlatform.ts): a rule in `detectPlatformFromUrl()`.
3. **Parsing**: `shared/officialResults/myplatform.ts` (URL parser, API URL builders, response parsers), optionally `myplatformSearch.ts` for the search term. Export from [`index.ts`](../shared/officialResults/index.ts). Match names with [`matchName.ts`](../shared/officialResults/matchName.ts).
4. **HTTP**: `functions/src/connectors/myplatform.ts`, plus a `case` in `lookupPlatform()` in [`connectors/index.ts`](../functions/src/connectors/index.ts). The router passes `resultsUrl` (possibly undefined), `profile`, `eventDate` and `eventName`; every URL-based case starts with `if (!resultsUrl) return []`.
5. **Stored-value allowlists**, both hand-written: `normalizeResultsPlatform()` in [`lookupOfficialResults.ts`](../functions/src/lookupOfficialResults.ts) and `docToEvent()` in [`src/services/events.ts`](../src/services/events.ts). If the URL alone cannot identify the platform, add a resolution step in `lookupOfficialResults.ts` like SCC Events, Wiclax and RaceResult.
6. **Tests**: `shared/officialResults/myplatform.test.ts` with anonymised fixtures under `fixtures/`, then `npm run check`. For a real lookup, run the emulators and use **Search for result** on an event.
7. **PR**: sample URLs and known limits; changelog per [`CONTRIBUTING.md`](../CONTRIBUTING.md).

Connector rules: public pages and APIs only, never bypass a login, paywall or bot challenge; send a reasonable `User-Agent` and `Referer` like the existing connectors; return `[]` on no match and throw only on unexpected failures.

References: `eqTiming` (simple JSON + CSV), `mikaTiming` (HTML forms, custom domains).

## Limits

- Per-user cooldown of 10 s: `shared/officialResults/lookupCooldown.ts`, enforced in `functions/src/officialResultsLookupRateLimit.ts`.
- Instances and concurrency: [`functionOptions.ts`](../functions/src/functionOptions.ts). Operator and terms-of-service notes: [`self-hosting.md`](./self-hosting.md).

## Closed platforms

`LOOKUP_UNAVAILABLE_PLATFORMS` in `types.ts` hides the search button and makes the callable return `failed-precondition`.

- **parkrun**: 403 to anything that is not a browser. No lookup; results come from an uploaded PDF.
- **MaxFunSports**: Cloudflare challenge on results, `Disallow: /` on the iframe host. Connector kept dormant in case it reopens; PDF upload instead.
- **time2win / Sportstiming**: declined, never built. Cloudflare Turnstile on results and `Disallow: /api/*`.

A blocked site is never worked around. Look for an official document the runner can save instead.

## PDFs

**Fetched by the connector**, where the site allows it: `functions/src/connectors/stgk.ts` and `zielZeit.ts`, pure rules in `shared/officialResults/stgk.ts`. Lessons from STGK:

- `pdf-parse` field order is not the printed order, and a missing club drops the field rather than leaving it empty. Read the head from the front and the tail from the back.
- A long club name can push a row onto following lines; join until a time appears.
- One file can hold several rankings (men, then women, each from 1). A runner's field size is their block, not the document.
- The page may not be UTF-8 (STGK is Latin-1): decode explicitly instead of `response.text()`.

**Uploaded by the runner**, where the site refuses to be read. The PDF never leaves the browser.

| Piece | Where |
|-------|-------|
| Parsers | `shared/officialResults/maxFunSportsPdf.ts`, `parkrunPdf.ts` |
| Text extraction (pdfjs, lazy loaded) | `src/services/resultsPdfText.ts` |
| Registry and errors | `READERS` in `src/services/resultsPdfImport.ts` |
| UI | `src/components/ResultsPdfUpload/` |
| Platforms offering it | `RESULTS_PDF_PLATFORMS` in `types.ts` |

A new format is a parser in `shared/` plus one `READERS` entry. Things the existing two taught:

- Fixed-width name columns can run into the time with no space.
- The field size may not be printed: take the last finisher's rank.
- Use the printed date to refuse a PDF uploaded onto the wrong event. parkrun's date is locale-ambiguous, so `eventDates` returns both readings.
- Expose only the runner's rows and the field size, never the whole table. Never commit a real PDF or raw extract; fixtures are anonymised.
