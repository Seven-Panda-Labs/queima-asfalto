/**
 * A country as a source writes it, into the two letters the catalog stores.
 *
 * `schema.org/PostalAddress.addressCountry` is documented as ISO 3166-1 alpha-2
 * and published as anything: acorrer sends "PT", running.life sends
 * "Deutschland", and a German directory writes "London, UK". Upper-casing the
 * string would file a race in the country "DEUTSCHLAND", which is the field
 * dedup compares.
 *
 * A name that is not in here resolves to nothing, and the caller drops the
 * race: a wrong country is worse than a missing one.
 */

const BY_NAME: Record<string, string> = {
  ägypten: 'EG', egypt: 'EG', albanien: 'AL', albania: 'AL', andorra: 'AD',
  argentinien: 'AR', argentina: 'AR', armenien: 'AM', armenia: 'AM',
  australien: 'AU', australia: 'AU', belgien: 'BE', belgium: 'BE', belgique: 'BE',
  bosnien: 'BA', brasilien: 'BR', brazil: 'BR', brasil: 'BR', bulgarien: 'BG',
  bulgaria: 'BG', chile: 'CL', china: 'CN', 'costa rica': 'CR', dänemark: 'DK',
  denmark: 'DK', danmark: 'DK', deutschland: 'DE', germany: 'DE', allemagne: 'DE',
  alemanha: 'DE', estland: 'EE', estonia: 'EE', färöer: 'FO', finnland: 'FI',
  finland: 'FI', frankreich: 'FR', france: 'FR', frança: 'FR', georgien: 'GE',
  georgia: 'GE', gibraltar: 'GI', grönland: 'GL', greenland: 'GL',
  griechenland: 'GR', greece: 'GR', großbritannien: 'GB', grossbritannien: 'GB',
  'great britain': 'GB', 'united kingdom': 'GB', uk: 'GB', gb: 'GB',
  'vereinigtes königreich': 'GB', 'vereinigtes koenigreich': 'GB',
  'royaume-uni': 'GB', 'reino unido': 'GB',
  england: 'GB', schottland: 'GB', scotland: 'GB', wales: 'GB', nordirland: 'GB',
  indien: 'IN', india: 'IN', indonesien: 'ID', indonesia: 'ID', irland: 'IE',
  ireland: 'IE', island: 'IS', iceland: 'IS', israel: 'IL', italien: 'IT',
  italy: 'IT', italia: 'IT', itália: 'IT', japan: 'JP', jordanien: 'JO',
  kanada: 'CA', canada: 'CA', kasachstan: 'KZ', katar: 'QA', qatar: 'QA',
  kenia: 'KE', kenya: 'KE', kolumbien: 'CO', colombia: 'CO', kosovo: 'XK',
  kroatien: 'HR', croatia: 'HR', kuba: 'CU', cuba: 'CU', lettland: 'LV',
  latvia: 'LV', libanon: 'LB', lebanon: 'LB', liechtenstein: 'LI',
  litauen: 'LT', lithuania: 'LT', luxemburg: 'LU', luxembourg: 'LU',
  malaysia: 'MY', malta: 'MT', marokko: 'MA', morocco: 'MA', mauritius: 'MU',
  mexiko: 'MX', mexico: 'MX', moldau: 'MD', moldova: 'MD', monaco: 'MC',
  mongolei: 'MN', montenegro: 'ME', namibia: 'NA', nepal: 'NP',
  neuseeland: 'NZ', 'new zealand': 'NZ', niederlande: 'NL', netherlands: 'NL',
  nederland: 'NL', nordmazedonien: 'MK', 'north macedonia': 'MK',
  norwegen: 'NO', norway: 'NO', norge: 'NO', österreich: 'AT', oesterreich: 'AT',
  austria: 'AT', pakistan: 'PK', peru: 'PE', philippinen: 'PH',
  philippines: 'PH', polen: 'PL', poland: 'PL', polska: 'PL', portugal: 'PT',
  rumänien: 'RO', romania: 'RO', russland: 'RU', russia: 'RU', schweden: 'SE',
  sweden: 'SE', sverige: 'SE', schweiz: 'CH', switzerland: 'CH', suisse: 'CH',
  senegal: 'SN', serbien: 'RS', serbia: 'RS', singapur: 'SG', singapore: 'SG',
  slowakei: 'SK', slovakia: 'SK', slowenien: 'SI', slovenia: 'SI', spanien: 'ES',
  spain: 'ES', españa: 'ES', espanha: 'ES', 'sri lanka': 'LK', südafrika: 'ZA',
  'south africa': 'ZA', südkorea: 'KR', 'south korea': 'KR', tansania: 'TZ',
  tanzania: 'TZ', thailand: 'TH', tschechien: 'CZ', 'czech republic': 'CZ',
  czechia: 'CZ', tunesien: 'TN', tunisia: 'TN', türkei: 'TR', turkei: 'TR',
  turkey: 'TR', türkiye: 'TR', ukraine: 'UA', ungarn: 'HU', hungary: 'HU',
  uruguay: 'UY', usa: 'US', 'united states': 'US',
  'united states of america': 'US', usbekistan: 'UZ', 'vereinigte arabische emirate': 'AE',
  'united arab emirates': 'AE', vietnam: 'VN', weißrussland: 'BY', zypern: 'CY',
  cyprus: 'CY',
  // The EU writes Greece EL, the standard writes GR.
  el: 'GR',
}

export function toIsoCountry(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  // The table first, because two letters are not proof of ISO: "UK" is how
  // people write the United Kingdom and "GB" is what the standard calls it.
  const named = BY_NAME[trimmed.toLowerCase()]
  if (named) return named

  // Otherwise two letters are taken as the code they look like. Three letters
  // are not read here: the sources that use those have their own tables.
  return /^[a-z]{2}$/i.test(trimmed) ? trimmed.toUpperCase() : undefined
}

/**
 * Every ISO 3166-1 alpha-2 code, so a picker can offer countries by name.
 *
 * The names are not written down: `Intl.DisplayNames` has them in the reader's
 * own language, and a list of names here would be six lists to keep. The codes
 * do have to be, because `Intl.supportedValuesOf` covers currencies and time
 * zones and not regions.
 *
 * XK is on the end because it is not in the standard and the catalog stores it
 * anyway: it is what the sources publish for Kosovo, and CLDR names it.
 */
export const ISO_COUNTRIES: readonly string[] = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ ' +
  'BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR ' +
  'CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
  'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ' +
  'ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ ' +
  'LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ ' +
  'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF ' +
  'PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI ' +
  'SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR ' +
  'TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW XK'
).split(' ')
