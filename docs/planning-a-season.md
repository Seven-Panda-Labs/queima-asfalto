# Planning a season

How a race gets from "one day I want to run this" to a date on the calendar. Decided with product on 2026-09-25.

## The model

No new collection.

| Concept | Role |
|---|---|
| `races` | the race identity, tying everything else together (`anchorYears`, `role`, `servesRaceId`) |
| Wish | a marker on a race: who, which race, when, an optional note. Name, place and distance come from the catalog |
| `events` | the season. `planned` is "I am doing this one", `confirmed` is "I am in" |
| `raceEntries` | an optional deadline and lottery layer, for races that need one |

## The path

1. **Wish.** Mark a race from Discover. One tap, idempotent.
2. **Schedule.** From the wish: pick the distance and the date, both prefilled from the catalog edition. Creates a `planned` event linked to the race and removes the wish. No date, no calendar: an estimated date would be indistinguishable from a real one.
3. **Enter.** The event becomes `confirmed`.
4. **Deadlines, for anchors.** The entry layer adds opening, closing, draw and the states an event cannot express (applied, accepted, rejected).

A race outside the catalog is proposed to the catalog or goes straight to the calendar. The one wish that keeps its own name is a watched parkrun, which has no catalog entry. A shared list denormalises names, because a reader cannot open someone else's races.

## Navigation

**Planning** (`/planeamento`) has two sections:

- **My season**: one line per anchor race, the races leading to it in order. Between two races sits the gap and a button that opens Discover for those dates. A cycle can cross the year; races from the adjacent year are faded and show their year. Entries for a season with no published date yet (a lottery entered a year ahead) are listed here with a link to their deadlines. The year lives in `?year=`.
- **Wishes**: each row shows the next edition's date, or the typical month while none is published. List or map view.

**Discover** (`/planeamento/descobrir`, `FindRaces`) is its own page: the catalog search, with wishing and scheduling on every row. A link from a gap carries `from`, `to` and `season`.

**Events** keeps the detail, results and past seasons. Planning does not replace it.

## Where races are

Race identities copy the catalog's coordinates, and the daily job geocodes 300 catalog entries a night (see [discovery-sources.md](./discovery-sources.md#the-daily-job)). Without a Geoapify key that pass is skipped.
