import type { RaceCatalogEntry } from '../../shared/raceCatalog/types.js'

/**
 * The entries this repo was carrying when the catalog moved into Firestore.
 *
 * A bootstrap, not a catalog: from here on each instance owns its own, and this
 * list only exists so an operator does not have to retype the fourteen races that
 * were reviewed against their organisers in #260. Every one of them still says
 * where it came from and when it was confirmed.
 */
export const SEED_RACES: RaceCatalogEntry[] = [
  {
    "id": "tokyo-marathon",
    "name": "Tokyo Marathon",
    "country": "JP",
    "city": "Tokyo",
    "disciplines": [
      "km_42_2"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "marathon.tokyo/en, confirmed 2026-09-01",
    "officialUrl": "https://www.marathon.tokyo/en/",
    "typicalRaceMonth": 3,
    "registrationUrl": "https://entry.onetokyo.org/english/entry/agreement",
    "typicalWindowNote": "General entry is a lottery, applications in the August before the race",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-03-07",
        "registrationOpensAt": "2026-08-14T02:00:00Z",
        "registrationClosesAt": "2026-08-28T08:00:00Z",
        "lotteryDrawAt": "2026-09-18",
        "timezone": "Asia/Tokyo",
        "source": "marathon.tokyo/en and entry.onetokyo.org, read 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "boston-marathon",
    "name": "Boston Marathon",
    "country": "US",
    "city": "Boston",
    "disciplines": [
      "km_42_2"
    ],
    "entryMethod": "qualifying",
    "review": "reviewed",
    "source": "baa.org/races/boston-marathon, confirmed 2026-09-01",
    "officialUrl": "https://www.baa.org/",
    "typicalRaceMonth": 4,
    "typicalWindowNote": "Qualifying time by age group. The qualifying window opened 2025-09-13, and acceptances follow in early October with no published date",
    "registrationUrl": "https://baa.my.site.com/s/login/",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-04-19",
        "registrationOpensAt": "2026-09-14",
        "registrationClosesAt": "2026-09-18T21:00:00Z",
        "timezone": "America/New_York",
        "source": "baa.org/races/boston-marathon/info-for-athletes, read 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "london-marathon",
    "name": "London Marathon",
    "country": "GB",
    "city": "London",
    "disciplines": [
      "km_42_2"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "londonmarathonevents.co.uk, confirmed 2026-09-01",
    "officialUrl": "https://www.londonmarathonevents.co.uk/london-marathon",
    "typicalRaceMonth": 4,
    "registrationUrl": "https://www.londonmarathonevents.co.uk/london-marathon/enter-ballot",
    "typicalWindowNote": "The ballot opens within days of the previous edition and runs about a week. The 2027 race runs across 24 and 25 April, the only two day edition, and only the first day is stored",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-04-24",
        "registrationOpensAt": "2026-04-24",
        "registrationClosesAt": "2026-05-01",
        "lotteryDrawAt": "2026-07-09",
        "timezone": "Europe/London",
        "source": "londonmarathonevents.co.uk/london-marathon and /enter-ballot, read 2026-09-01. Ballot window 24 April to 1 May 2026 supplied in review",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "berlin-marathon",
    "name": "Berlin Marathon",
    "country": "DE",
    "city": "Berlin",
    "disciplines": [
      "km_42_2"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "bmw-berlin-marathon.com/en, confirmed 2026-09-01",
    "officialUrl": "https://www.bmw-berlin-marathon.com/en/",
    "typicalRaceMonth": 9,
    "registrationUrl": "https://www.bmw-berlin-marathon.com/en/registration/lottery",
    "typicalWindowNote": "The lottery for the next year opens within days of the race and stays open about six weeks. The draw date is not published",
    "editions": [
      {
        "year": 2026,
        "raceDate": "2026-09-27",
        "registrationOpensAt": "2025-09-25",
        "registrationClosesAt": "2025-11-06",
        "timezone": "Europe/Berlin",
        "typicalFee": 205,
        "feeCurrency": "EUR",
        "source": "bmw-berlin-marathon.com/en/registration, read 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "chicago-marathon",
    "name": "Chicago Marathon",
    "country": "US",
    "city": "Chicago",
    "disciplines": [
      "km_42_2"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "chicagomarathon.com, confirmed 2026-09-01",
    "officialUrl": "https://www.chicagomarathon.com/",
    "typicalRaceMonth": 10,
    "registrationUrl": "https://www.chicagomarathon.com/apply/",
    "typicalWindowNote": "Non-guaranteed entry drawing. The opening date is not published, only the closing and the result. US residents pay 245 USD; the stored fee is the one a runner travelling in pays",
    "editions": [
      {
        "year": 2026,
        "raceDate": "2026-10-11",
        "registrationClosesAt": "2025-11-18T20:00:00Z",
        "lotteryDrawAt": "2025-12-11",
        "timezone": "America/Chicago",
        "typicalFee": 255,
        "feeCurrency": "USD",
        "source": "chicagomarathon.com/apply, read 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "new-york-city-marathon",
    "name": "New York City Marathon",
    "country": "US",
    "city": "New York",
    "disciplines": [
      "km_42_2"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "nyrr.org, supplied in review 2026-09-01",
    "officialUrl": "https://www.nyrr.org/tcsnycmarathon",
    "typicalRaceMonth": 11,
    "registrationUrl": "https://www.nyrr.org/tcsnycmarathon/runners/entry/2027",
    "typicalWindowNote": "The drawing runs in February for a race the following November, about nine months ahead. The 2027 window is not open yet, and the registration link is year specific. The site sits behind a virtual queue, so it cannot be read automatically",
    "editions": [
      {
        "year": 2026,
        "raceDate": "2026-11-01",
        "registrationOpensAt": "2026-02-04",
        "registrationClosesAt": "2026-02-25",
        "lotteryDrawAt": "2026-03-04",
        "timezone": "America/New_York",
        "typicalFee": 358,
        "feeCurrency": "USD",
        "source": "nyrr.org, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "sydney-marathon",
    "name": "Sydney Marathon",
    "country": "AU",
    "city": "Sydney",
    "disciplines": [
      "km_5",
      "km_42_2"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "tcssydneymarathon.com, confirmed 2026-09-01",
    "officialUrl": "https://www.tcssydneymarathon.com/",
    "typicalRaceMonth": 8,
    "registrationUrl": "https://www.tcssydneymarathon.com/sign-up",
    "typicalWindowNote": "Ballot. The 2027 date and ballot window are not published yet. The old sydneymarathon.org host serves a certificate for another domain",
    "editions": [
      {
        "year": 2026,
        "raceDate": "2026-08-30",
        "timezone": "Australia/Sydney",
        "source": "tcssydneymarathon.com, confirmed in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "lisbon-half-marathon",
    "name": "Lisbon Half Marathon",
    "country": "PT",
    "city": "Lisbon",
    "disciplines": [
      "km_21_1"
    ],
    "entryMethod": "first_come",
    "review": "reviewed",
    "source": "maratonaclubedeportugal.com, confirmed supplied in review 2026-09-01",
    "officialUrl": "https://www.maratonaclubedeportugal.com/en/corrida-marco/edp-lisbon-half-marathon/",
    "typicalRaceMonth": 3,
    "typicalWindowNote": "Open registration until sold out, and the 2027 half is already sold out. The Lisbon 10K runs the same day on the same course and is a separate entry",
    "registrationUrl": "https://meia-maratona.inscricoes.maratonaportugal.com/default.aspx",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-03-07",
        "timezone": "Europe/Lisbon",
        "typicalFee": 70,
        "feeCurrency": "EUR",
        "source": "maratonaclubedeportugal.com, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "lisbon-10k",
    "name": "Lisbon 10K",
    "country": "PT",
    "city": "Lisbon",
    "disciplines": [
      "km_10"
    ],
    "entryMethod": "first_come",
    "review": "reviewed",
    "source": "maratonaclubedeportugal.com, confirmed supplied in review 2026-09-01",
    "officialUrl": "https://www.maratonaclubedeportugal.com/en/corrida-marco/edp-lisbon-half-marathon/",
    "registrationUrl": "https://meia-maratona.inscricoes.maratonaportugal.com/default.aspx?prova_id=3767",
    "typicalRaceMonth": 3,
    "typicalWindowNote": "Runs the same day and the same course as the Lisbon Half Marathon, which is a separate entry. Still open for 2027 while the half is sold out",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-03-07",
        "timezone": "Europe/Lisbon",
        "typicalFee": 37,
        "feeCurrency": "EUR",
        "source": "maratonaclubedeportugal.com, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "prague-half-marathon",
    "name": "Prague Half Marathon",
    "country": "CZ",
    "city": "Prague",
    "disciplines": [
      "km_21_1"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "runczech.com, confirmed supplied in review 2026-09-01",
    "officialUrl": "https://www.runczech.com/en/events/generali-prague-half-marathon-2027-2",
    "typicalRaceMonth": 4,
    "typicalWindowNote": "Ballot, and being drawn is an invitation to register rather than a place. It opens on 21 July and runs about three weeks; the closing date is not published",
    "registrationUrl": "https://www.runczech.com/en/generali-prague-half-marathon-2027-ballot",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-04-03",
        "registrationOpensAt": "2026-07-21",
        "timezone": "Europe/Prague",
        "typicalFee": 78,
        "feeCurrency": "EUR",
        "source": "runczech.com, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "berlin-half-marathon",
    "name": "Berlin Half Marathon",
    "country": "DE",
    "city": "Berlin",
    "disciplines": [
      "km_21_1"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "generali-berliner-halbmarathon.de, confirmed supplied in review 2026-09-01",
    "officialUrl": "https://www.generali-berliner-halbmarathon.de/en/",
    "typicalRaceMonth": 4,
    "typicalWindowNote": "Lottery, with charity and tour operator places for those not drawn",
    "registrationUrl": "https://www.generali-berliner-halbmarathon.de/en/registration/registration-information/step-by-step-guide",
    "editions": [
      {
        "year": 2027,
        "raceDate": "2027-04-04",
        "registrationOpensAt": "2026-04-02",
        "registrationClosesAt": "2026-05-28",
        "timezone": "Europe/Berlin",
        "typicalFee": 89,
        "feeCurrency": "EUR",
        "source": "generali-berliner-halbmarathon.de, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "copenhagen-half-marathon",
    "name": "Copenhagen Half Marathon",
    "country": "DK",
    "city": "Copenhagen",
    "disciplines": [
      "km_21_1"
    ],
    "entryMethod": "unknown",
    "review": "reviewed",
    "source": "cphhalf.dk, confirmed supplied in review 2026-09-01",
    "officialUrl": "https://cphhalf.dk/",
    "typicalRaceMonth": 9,
    "typicalWindowNote": "No 2026 edition: Copenhagen hosts the World Athletics Road Running Championships that year. The race returns in September 2027, with registration expected to open about a year ahead, so around September 2026. The day is not published yet",
    "editions": [
      {
        "year": 2027,
        "timezone": "Europe/Copenhagen",
        "typicalFee": 86,
        "feeCurrency": "EUR",
        "source": "cphhalf.dk, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "cardiff-half-marathon",
    "name": "Cardiff Half Marathon",
    "country": "GB",
    "city": "Cardiff",
    "disciplines": [
      "km_21_1"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "cardiffhalfmarathon.co.uk, supplied in review 2026-09-01. The site answers 403 to automated reads",
    "officialUrl": "https://www.cardiffhalfmarathon.co.uk/",
    "typicalRaceMonth": 10,
    "typicalWindowNote": "Two ballots, one for UK runners and one international, which is what keeps places for the SuperHalfs series. The next ballot opens in October 2026, within days of the race",
    "editions": [
      {
        "year": 2026,
        "raceDate": "2026-10-04",
        "registrationClosesAt": "2025-10-19",
        "lotteryDrawAt": "2025-10-23",
        "timezone": "Europe/London",
        "typicalFee": 86,
        "feeCurrency": "EUR",
        "source": "cardiffhalfmarathon.co.uk, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  },
  {
    "id": "valencia-half-marathon",
    "name": "Valencia Half Marathon",
    "country": "ES",
    "city": "Valencia",
    "disciplines": [
      "km_21_1"
    ],
    "entryMethod": "lottery",
    "review": "reviewed",
    "source": "valenciaciudaddelrunning.com, confirmed supplied in review 2026-09-01",
    "officialUrl": "https://www.valenciaciudaddelrunning.com/en/half/half-marathon/",
    "typicalRaceMonth": 10,
    "typicalWindowNote": "Ballot in two steps: those drawn then have twelve days to register, 18 to 30 November for the 2026 race. The next ballot opens about a week after the previous edition",
    "registrationUrl": "https://www.valenciaciudaddelrunning.com/en/half/info-registration-2026/",
    "editions": [
      {
        "year": 2026,
        "raceDate": "2026-10-25",
        "registrationOpensAt": "2025-11-04",
        "registrationClosesAt": "2025-11-14",
        "lotteryDrawAt": "2025-11-17",
        "timezone": "Europe/Madrid",
        "typicalFee": 80,
        "feeCurrency": "EUR",
        "source": "valenciaciudaddelrunning.com, supplied in review 2026-09-01",
        "confirmedAt": "2026-09-01"
      }
    ]
  }
]
