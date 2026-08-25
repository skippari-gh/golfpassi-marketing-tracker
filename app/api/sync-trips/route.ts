import * as cheerio from 'cheerio'
import {
  supabaseAdmin as supabase,
} from '../../../lib/supabase-admin'
import {
  getTripNameSimilarity,
  normalizeTripIdentityText,
} from '../../../lib/trip-identity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type SourceType =
  | 'pelimatka'
  | 'kurssimatka'

type TripSource = {
  sourceType: SourceType
  sourceUrl: string
  requiredPath: string
}

type DateRange = {
  startDate: string
  endDate: string
  matchedText: string
}

type TitleCandidate = {
  name: string
  score: number
}

type NameSource =
  | 'exact_url'
  | 'same_trip'
  | 'url_slug'

type ScrapedTrip = {
  name: string
  start_date: string
  end_date: string
  url: string
  source_type: SourceType
  source_key: string
  name_source: NameSource
}

type DuplicateTrip = {
  name: string
  start_date: string
  end_date: string
  kept_source: SourceType
  removed_source: SourceType
}

type ExistingTrip = {
  id: string
  name: string
  country: string
  start_date: string
  end_date: string
  url: string | null
  source_url: string | null
  source_key: string | null
  source_type: string | null
}

const SOURCES: TripSource[] = [
  {
    sourceType: 'pelimatka',
    sourceUrl:
      'https://golfpassi.fi/pelimatkat/',
    requiredPath: '/pelimatkat/',
  },
  {
    sourceType: 'kurssimatka',
    sourceUrl:
      'https://golfpassi.fi/kurssimatkat/',
    requiredPath: '/kurssimatkat/',
  },
]

const MINIMUM_TOTAL_TRIPS = 20

const REJECTED_TITLES = [
  'lue lisää',
  'näytä',
  'varaa',
  'varaa matkasi',
  'lisätietoa',
  'aiemmat',
  'myöhemmät',
  'seuraava',
  'edellinen',
  'kaikki matkat',
]

const REJECTED_PHRASES = [
  'varaa syksyn',
  'varaa kevään',
  'varaa matkasi',
  'nauti monipuolisesta',
  'parhaana palkittu',
  'lähdöt joka viikko',
]

const CATEGORY_WORDS = [
  'all inclusive',
  'budjetti',
  'erilainen golfmatka',
  'european tour kohde',
  'golf & fysiikka',
  'golf + kaupunki',
  'golf & luonto',
  'golf + ranta',
  'golf & viini',
  'golf+gourmet',
  'kaukomatka',
  'kesäpelit',
  'kisamatka',
  'kisaviikonloppu',
  'laadukas',
  'lennä lähelle',
  'leppoinen kisa',
  'links life by golfpassi',
  'long stay',
  'luksus',
  'merinäköalat',
  'paras vastine rahoille',
  'pron matkassa',
  'puolihoito',
  'rajaton golf',
  'resortloma',
  'sinkkumatka',
  'suosittu',
  'teemamatka',
  'top-kentät',
  'uutuus',
]

const COUNTRY_NAMES: Record<
  string,
  string
> = {
  alankomaat: 'Alankomaat',
  arabiemiraatit:
    'Arabiemiirikunnat',
  bulgaria: 'Bulgaria',
  egypt: 'Egypti',
  egyptia: 'Egypti',
  englanti: 'Englanti',
  espanja: 'Espanja',
  'etela-afrikka':
    'Etelä-Afrikka',
  indonesia: 'Indonesia',
  irlanti: 'Irlanti',
  islanti: 'Islanti',
  italia: 'Italia',
  kanariansaaret:
    'Kanariansaaret',
  kreikka: 'Kreikka',
  kroatia: 'Kroatia',
  kypros: 'Kypros',
  latvia: 'Latvia',
  liettua: 'Liettua',
  marokko: 'Marokko',
  markko: 'Marokko',
  mauritius: 'Mauritius',
  'pohjois-kypros':
    'Pohjois-Kypros',
  portugali: 'Portugali',
  puola: 'Puola',
  ranska: 'Ranska',
  ruotsi: 'Ruotsi',
  saksa: 'Saksa',
  skotlanti: 'Skotlanti',
  suomi: 'Suomi',
  thaimaa: 'Thaimaa',
  tsekki: 'Tšekki',
  tunisia: 'Tunisia',
  turkki: 'Turkki',
  unkari: 'Unkari',
  vietnam: 'Vietnam',
  viro: 'Viro',
}

function normalizeText(
  value: string
) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTripUrl(
  url: URL
) {
  url.hash = ''
  url.search = ''

  return url.toString()
}

function toIsoDate(
  day: number,
  month: number,
  year: number
) {
  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  )

  const valid =
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() === day

  if (!valid) {
    return null
  }

  return [
    String(year).padStart(
      4,
      '0'
    ),
    String(month).padStart(
      2,
      '0'
    ),
    String(day).padStart(
      2,
      '0'
    ),
  ].join('-')
}

function findDateRange(
  value: string
): DateRange | null {
  const text =
    normalizeText(value)

  const differentMonthPattern =
    /(\d{1,2})\.(\d{1,2})\.(\d{4})?\s*(?:–|—|-|\.\.\.)\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/

  const differentMonthMatch =
    text.match(
      differentMonthPattern
    )

  if (differentMonthMatch) {
    const startDay = Number(
      differentMonthMatch[1]
    )

    const startMonth = Number(
      differentMonthMatch[2]
    )

    const endDay = Number(
      differentMonthMatch[4]
    )

    const endMonth = Number(
      differentMonthMatch[5]
    )

    const endYear = Number(
      differentMonthMatch[6]
    )

    let startYear =
      differentMonthMatch[3]
        ? Number(
            differentMonthMatch[3]
          )
        : endYear

    if (
      !differentMonthMatch[3] &&
      startMonth > endMonth
    ) {
      startYear -= 1
    }

    const startDate = toIsoDate(
      startDay,
      startMonth,
      startYear
    )

    const endDate = toIsoDate(
      endDay,
      endMonth,
      endYear
    )

    if (startDate && endDate) {
      return {
        startDate,
        endDate,
        matchedText:
          differentMonthMatch[0],
      }
    }
  }

  const sameMonthPattern =
    /(\d{1,2})\.\s*(?:–|—|-|\.\.\.)\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/

  const sameMonthMatch =
    text.match(
      sameMonthPattern
    )

  if (sameMonthMatch) {
    const startDay = Number(
      sameMonthMatch[1]
    )

    const endDay = Number(
      sameMonthMatch[2]
    )

    const month = Number(
      sameMonthMatch[3]
    )

    const year = Number(
      sameMonthMatch[4]
    )

    const startDate = toIsoDate(
      startDay,
      month,
      year
    )

    const endDate = toIsoDate(
      endDay,
      month,
      year
    )

    if (startDate && endDate) {
      return {
        startDate,
        endDate,
        matchedText:
          sameMonthMatch[0],
      }
    }
  }

  return null
}

function cleanTripName(
  value: string,
  matchedDate?: string
) {
  let name =
    normalizeText(value)

  if (matchedDate) {
    name = name.replace(
      matchedDate,
      ''
    )
  }

  return name
    .replace(
      /\s+(?:–|—|-)\s*$/,
      ''
    )
    .replace(
      /^[,;:|\s]+/,
      ''
    )
    .replace(
      /[,;:|\s]+$/,
      ''
    )
    .trim()
}

function countOccurrences(
  value: string,
  character: string
) {
  return (
    value.split(character).length -
    1
  )
}

function countCategoryWords(
  value: string
) {
  const normalized =
    value.toLocaleLowerCase(
      'fi-FI'
    )

  return CATEGORY_WORDS.filter(
    (category) =>
      normalized.includes(
        category
      )
  ).length
}

function hasUnparsedDate(
  value: string
) {
  return (
    /\d{1,2}\.\d{1,2}\./.test(
      value
    ) ||
    /\d{1,2}\.\s*(?:–|—|-|\.\.\.)/.test(
      value
    )
  )
}

function isUsableTitle(
  value: string
) {
  const title =
    normalizeText(value)

  if (
    title.length < 4 ||
    title.length > 180
  ) {
    return false
  }

  const normalized =
    title.toLocaleLowerCase(
      'fi-FI'
    )

  if (
    REJECTED_TITLES.some(
      (rejected) =>
        normalized === rejected ||
        normalized.startsWith(
          `${rejected} `
        )
    )
  ) {
    return false
  }

  if (
    REJECTED_PHRASES.some(
      (phrase) =>
        normalized.includes(
          phrase
        )
    )
  ) {
    return false
  }

  if (
    countOccurrences(
      title,
      ','
    ) >= 2
  ) {
    return false
  }

  if (
    countCategoryWords(
      title
    ) >= 3
  ) {
    return false
  }

  if (
    hasUnparsedDate(title)
  ) {
    return false
  }

  return true
}

function createTitleCandidate(
  value: string,
  isHeading: boolean
): TitleCandidate | null {
  const originalText =
    normalizeText(value)

  if (!originalText) {
    return null
  }

  const dateRange =
    findDateRange(
      originalText
    )

  const name = cleanTripName(
    originalText,
    dateRange?.matchedText
  )

  if (!isUsableTitle(name)) {
    return null
  }

  let score = 100

  if (isHeading) {
    score += 150
  }

  if (dateRange) {
    score += 20
  }

  score += Math.min(
    name.length,
    100
  )

  score -=
    countOccurrences(
      name,
      ','
    ) * 25

  score -=
    countCategoryWords(
      name
    ) * 30

  return {
    name,
    score,
  }
}

function getPathParts(
  url: URL
) {
  return url.pathname
    .split('/')
    .filter(Boolean)
}

function getLastSlug(
  url: URL
) {
  const pathParts =
    getPathParts(url)

  return (
    pathParts[
      pathParts.length - 1
    ] || 'matka'
  )
}

function removeDateFromSlug(
  slug: string
) {
  return slug
    .replace(
      /-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{4}(?:-\d+)*$/,
      ''
    )
    .replace(
      /-\d{1,2}-\d{1,2}-\d{4}(?:-\d+)*$/,
      ''
    )
}

function getCountrySlugFromUrl(
  url: URL
) {
  const parts =
    getPathParts(url)

  const sourceIndex =
    parts.findIndex(
      (part) =>
        part === 'pelimatkat' ||
        part === 'kurssimatkat'
    )

  if (sourceIndex < 0) {
    return 'muu'
  }

  return (
    parts[sourceIndex + 1] ||
    'muu'
  )
}

function getTripIdentity(
  url: URL
) {
  const countrySlug =
    getCountrySlugFromUrl(url)

  const familySlug =
    removeDateFromSlug(
      getLastSlug(url)
    )

  return [
    countrySlug,
    familySlug,
  ].join('|')
}

function humanizeSlug(
  url: URL
) {
  const withoutDate =
    removeDateFromSlug(
      getLastSlug(url)
    )

  const name =
    decodeURIComponent(
      withoutDate
    )
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  if (!name) {
    return 'Nimetön matka'
  }

  return (
    name.charAt(0).toUpperCase() +
    name.slice(1)
  )
}

function isAllowedTripUrl(
  url: URL,
  source: TripSource
) {
  if (
    url.hostname !==
      'golfpassi.fi' &&
    url.hostname !==
      'www.golfpassi.fi'
  ) {
    return false
  }

  const pathname =
    url.pathname

  if (
    !pathname.startsWith(
      source.requiredPath
    )
  ) {
    return false
  }

  if (
    pathname ===
      source.requiredPath ||
    pathname.includes(
      '/matkatyypit/'
    ) ||
    pathname.includes(
      '/kategoriat/'
    ) ||
    pathname.includes(
      '/kohteet/'
    ) ||
    pathname.includes(
      '/tag/'
    ) ||
    pathname.includes(
      '/page/'
    )
  ) {
    return false
  }

  return true
}

function saveBestTitle(
  map: Map<
    string,
    TitleCandidate
  >,
  key: string,
  candidate: TitleCandidate
) {
  const existing =
    map.get(key)

  if (
    !existing ||
    candidate.score >
      existing.score
  ) {
    map.set(
      key,
      candidate
    )
  }
}

async function scrapeSource(
  source: TripSource
) {
  const response =
    await fetch(
      source.sourceUrl,
      {
        cache: 'no-store',
        headers: {
          'User-Agent':
            'Golfpassi-Marketing-Tracker/1.0',
          Accept:
            'text/html,application/xhtml+xml',
        },
      }
    )

  if (!response.ok) {
    throw new Error(
      `Sivun haku epäonnistui: ${source.sourceUrl} (${response.status})`
    )
  }

  const html =
    await response.text()

  const $ =
    cheerio.load(html)

  const titleByExactUrl =
    new Map<
      string,
      TitleCandidate
    >()

  const titleByFamily =
    new Map<
      string,
      TitleCandidate
    >()

  $('a[href]').each(
    (_index, element) => {
      const anchor =
        $(element)

      const href =
        anchor
          .attr('href')
          ?.trim()

      if (!href) {
        return
      }

      let tripUrl: URL

      try {
        tripUrl = new URL(
          href,
          source.sourceUrl
        )
      } catch {
        return
      }

      if (
        !isAllowedTripUrl(
          tripUrl,
          source
        )
      ) {
        return
      }

      const exactUrl =
        normalizeTripUrl(
          tripUrl
        )

      const familyKey =
        getTripIdentity(
          tripUrl
        )

      const isHeading =
        anchor.parents(
          'h1, h2, h3, h4, h5'
        ).length > 0

      const possibleTexts = [
        anchor.text(),
        anchor.attr(
          'title'
        ) || '',
        anchor
          .find('img')
          .attr('alt') || '',
      ]

      for (
        const text of
        possibleTexts
      ) {
        const candidate =
          createTitleCandidate(
            text,
            isHeading
          )

        if (!candidate) {
          continue
        }

        saveBestTitle(
          titleByExactUrl,
          exactUrl,
          candidate
        )

        saveBestTitle(
          titleByFamily,
          familyKey,
          candidate
        )
      }
    }
  )

  const trips =
    new Map<
      string,
      ScrapedTrip
    >()

  $('a[href]').each(
    (_index, element) => {
      const anchor =
        $(element)

      const anchorText =
        normalizeText(
          anchor.text()
        )

      const dateRange =
        findDateRange(
          anchorText
        )

      if (!dateRange) {
        return
      }

      const href =
        anchor
          .attr('href')
          ?.trim()

      if (!href) {
        return
      }

      let tripUrl: URL

      try {
        tripUrl = new URL(
          href,
          source.sourceUrl
        )
      } catch {
        return
      }

      if (
        !isAllowedTripUrl(
          tripUrl,
          source
        )
      ) {
        return
      }

      const exactUrl =
        normalizeTripUrl(
          tripUrl
        )

      const familyKey =
        getTripIdentity(
          tripUrl
        )

      const exactTitle =
        titleByExactUrl.get(
          exactUrl
        )?.name

      const familyTitle =
        titleByFamily.get(
          familyKey
        )?.name

      let name: string
      let nameSource:
        NameSource

      if (exactTitle) {
        name = exactTitle
        nameSource =
          'exact_url'
      } else if (
        familyTitle
      ) {
        name = familyTitle
        nameSource =
          'same_trip'
      } else {
        name =
          humanizeSlug(
            tripUrl
          )

        nameSource =
          'url_slug'
      }

      const temporaryKey = [
        source.sourceType,
        exactUrl,
        dateRange.startDate,
        dateRange.endDate,
      ].join('|')

      trips.set(
        temporaryKey,
        {
          name,
          start_date:
            dateRange.startDate,
          end_date:
            dateRange.endDate,
          url: exactUrl,
          source_type:
            source.sourceType,
          source_key:
            temporaryKey,
          name_source:
            nameSource,
        }
      )
    }
  )

  return Array.from(
    trips.values()
  ).sort((a, b) => {
    const dateComparison =
      a.start_date.localeCompare(
        b.start_date
      )

    if (
      dateComparison !== 0
    ) {
      return dateComparison
    }

    return a.name.localeCompare(
      b.name,
      'fi'
    )
  })
}

function getDuplicateKey(
  trip: ScrapedTrip
) {
  const url =
    new URL(trip.url)

  return [
    getTripIdentity(url),
    trip.start_date,
    trip.end_date,
  ].join('|')
}

function getNameDuplicateKey(
  trip: ScrapedTrip
) {
  const url =
    new URL(trip.url)

  return [
    getCountrySlugFromUrl(url),
    normalizeTripIdentityText(
      trip.name
    ),
    trip.start_date,
    trip.end_date,
  ].join('|')
}

function getPermanentSourceKey(
  trip: ScrapedTrip
) {
  const url =
    new URL(trip.url)

  return [
    'golfpassi',
    getTripIdentity(url),
    trip.start_date,
    trip.end_date,
  ].join('|')
}

function getTripPreferenceScore(
  trip: ScrapedTrip
) {
  let score = 0

  if (
    trip.source_type ===
    'pelimatka'
  ) {
    score += 100
  }

  if (
    trip.name_source ===
    'exact_url'
  ) {
    score += 20
  }

  if (
    trip.name_source ===
    'same_trip'
  ) {
    score += 10
  }

  return score
}

function deduplicateTrips(
  trips: ScrapedTrip[]
) {
  const uniqueTrips =
    new Map<string, ScrapedTrip>()

  const canonicalKeyByAlias =
    new Map<string, string>()

  const duplicates:
    DuplicateTrip[] = []

  for (const trip of trips) {
    const urlDuplicateKey =
      getDuplicateKey(trip)

    const nameDuplicateKey =
      getNameDuplicateKey(trip)

    const canonicalKey =
      canonicalKeyByAlias.get(
        urlDuplicateKey
      ) ||
      canonicalKeyByAlias.get(
        nameDuplicateKey
      ) ||
      urlDuplicateKey

    const existing =
      uniqueTrips.get(
        canonicalKey
      )

    if (!existing) {
      uniqueTrips.set(
        canonicalKey,
        trip
      )

      canonicalKeyByAlias.set(
        urlDuplicateKey,
        canonicalKey
      )

      canonicalKeyByAlias.set(
        nameDuplicateKey,
        canonicalKey
      )

      continue
    }

    const existingScore =
      getTripPreferenceScore(
        existing
      )

    const newScore =
      getTripPreferenceScore(
        trip
      )

    if (
      newScore >
      existingScore
    ) {
      duplicates.push({
        name: trip.name,
        start_date:
          trip.start_date,
        end_date:
          trip.end_date,
        kept_source:
          trip.source_type,
        removed_source:
          existing.source_type,
      })

      uniqueTrips.set(
        canonicalKey,
        trip
      )
    } else {
      duplicates.push({
        name: existing.name,
        start_date:
          existing.start_date,
        end_date:
          existing.end_date,
        kept_source:
          existing.source_type,
        removed_source:
          trip.source_type,
      })
    }

    canonicalKeyByAlias.set(
      urlDuplicateKey,
      canonicalKey
    )

    canonicalKeyByAlias.set(
      nameDuplicateKey,
      canonicalKey
    )
  }

  const deduplicated =
    Array.from(
      uniqueTrips.values()
    )
      .map((trip) => ({
        ...trip,
        source_key:
          getPermanentSourceKey(
            trip
          ),
      }))
      .sort((a, b) => {
        const dateComparison =
          a.start_date.localeCompare(
            b.start_date
          )

        if (
          dateComparison !== 0
        ) {
          return dateComparison
        }

        return a.name.localeCompare(
          b.name,
          'fi'
        )
      })

  return {
    trips: deduplicated,
    duplicates,
  }
}

function titleCaseSlug(
  value: string
) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => {
      return (
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
      )
    })
    .join(' ')
}

function getCountryFromUrl(
  value: string
) {
  try {
    const url =
      new URL(value)

    const countrySlug =
      getCountrySlugFromUrl(
        url
      )

    return (
      COUNTRY_NAMES[
        countrySlug
      ] ||
      titleCaseSlug(
        countrySlug
      )
    )
  } catch {
    return 'Muu'
  }
}

function isSaveAllowed(
  request: Request
) {
  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    return true
  }

  const expectedSecret =
    process.env.SYNC_SECRET

  if (!expectedSecret) {
    return false
  }

  const authorization =
    request.headers.get(
      'authorization'
    )

  const querySecret =
    new URL(request.url)
      .searchParams
      .get('secret')

  return (
    authorization ===
      `Bearer ${expectedSecret}` ||
    querySecret ===
      expectedSecret
  )
}

async function startSyncRun() {
  const { data, error } =
    await supabase
      .from('trip_sync_runs')
      .insert({
        status: 'running',
      })
      .select('id')
      .single()

  if (error) {
    throw new Error(
      `Synkronointiraportin aloitus epäonnistui: ${error.message}`
    )
  }

  return String(data.id)
}

async function finishSyncRun(
  runId: string,
  values: {
    status:
      | 'success'
      | 'failed'
    found_count?: number
    added_count?: number
    updated_count?: number
    missing_count?: number
    error_message?:
      | string
      | null
  }
) {
  const { error } =
    await supabase
      .from('trip_sync_runs')
      .update({
        ...values,
        finished_at:
          new Date()
            .toISOString(),
      })
      .eq('id', runId)

  if (error) {
    console.error(
      'Synkronointiraportin päivitys epäonnistui:',
      error.message
    )
  }
}

function getExistingTripMatchScore(
  existingTrip: ExistingTrip,
  scrapedTrip: ScrapedTrip
) {
  if (
    existingTrip.start_date !==
      scrapedTrip.start_date ||
    existingTrip.end_date !==
      scrapedTrip.end_date
  ) {
    return 0
  }

  const scrapedCountry =
    getCountryFromUrl(
      scrapedTrip.url
    )

  if (
    normalizeTripIdentityText(
      existingTrip.country
    ) !==
    normalizeTripIdentityText(
      scrapedCountry
    )
  ) {
    return 0
  }

  const existingUrls = [
    existingTrip.url,
    existingTrip.source_url,
  ].filter(
    (url): url is string =>
      Boolean(url)
  )

  for (const existingUrl of existingUrls) {
    try {
      if (
        getTripIdentity(
          new URL(existingUrl)
        ) ===
        getTripIdentity(
          new URL(
            scrapedTrip.url
          )
        )
      ) {
        return 200
      }
    } catch {
      // Vanhat käsin lisätyt URL-osoitteet
      // voivat olla puutteellisia.
    }
  }

  return getTripNameSimilarity(
    existingTrip.name,
    scrapedTrip.name
  )
}

function findMatchingScrapedTrip(
  existingTrip: ExistingTrip,
  scrapedTrips: ScrapedTrip[]
) {
  const matches =
    scrapedTrips
      .map((trip) => ({
        trip,
        score:
          getExistingTripMatchScore(
            existingTrip,
            trip
          ),
      }))
      .filter(
        (match) =>
          match.score >= 80
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )

  if (matches.length === 0) {
    return null
  }

  if (
    matches.length > 1 &&
    matches[0].score ===
      matches[1].score
  ) {
    return null
  }

  return matches[0].trip
}

async function moveTripReferences(
  duplicateId: string,
  canonicalId: string
) {
  const relatedTables = [
    'marketing_actions',
    'marketing_plan',
    'marketing_requests',
  ] as const

  for (const table of relatedTables) {
    const { error } =
      await supabase
        .from(table)
        .update({
          trip_id: canonicalId,
        })
        .eq(
          'trip_id',
          duplicateId
        )

    if (error) {
      throw new Error(
        `Matkan ${duplicateId} tietojen siirto taulussa ${table} epäonnistui: ${error.message}`
      )
    }
  }
}

async function mergeExistingDuplicates(
  existingTrips: ExistingTrip[],
  scrapedTrips: ScrapedTrip[]
) {
  const canonicalBySourceKey =
    new Map(
      existingTrips
        .filter(
          (trip) =>
            trip.source_key &&
            scrapedTrips.some(
              (scrapedTrip) =>
                scrapedTrip.source_key ===
                trip.source_key
            )
        )
        .map((trip) => [
          trip.source_key!,
          trip,
        ])
    )

  const canonicalIds = new Set(
    Array.from(
      canonicalBySourceKey.values()
    ).map((trip) => trip.id)
  )

  const mergedTripIds =
    new Set<string>()

  let skippedCount = 0

  for (const existingTrip of existingTrips) {
    if (
      canonicalIds.has(
        existingTrip.id
      )
    ) {
      continue
    }

    const matchingScrapedTrip =
      findMatchingScrapedTrip(
        existingTrip,
        scrapedTrips
      )

    if (!matchingScrapedTrip) {
      continue
    }

    const canonicalTrip =
      canonicalBySourceKey.get(
        matchingScrapedTrip.source_key
      )

    if (!canonicalTrip) {
      skippedCount += 1
      continue
    }

    await moveTripReferences(
      existingTrip.id,
      canonicalTrip.id
    )

    const { error: deleteError } =
      await supabase
        .from('trips')
        .delete()
        .eq('id', existingTrip.id)

    if (deleteError) {
      throw new Error(
        `Yhdistetyn kaksoismatkan poistaminen epäonnistui: ${deleteError.message}`
      )
    }

    mergedTripIds.add(
      existingTrip.id
    )
  }

  return {
    merged_count:
      mergedTripIds.size,
    merge_skipped_count:
      skippedCount,
    merged_trip_ids:
      mergedTripIds,
  }
}

async function saveTripsToSupabase(
  trips: ScrapedTrip[]
) {
  const now =
    new Date()
      .toISOString()

    const {
      data: existingData,
      error: existingError,
    } = await supabase
      .from('trips')
      .select(
        'id, name, country, start_date, end_date, url, source_url, source_key, source_type'
      )

    if (existingError) {
      throw new Error(
        `Nykyisten matkojen haku epäonnistui: ${existingError.message}`
      )
    }

    const existingTrips =
      (existingData ||
        []) as ExistingTrip[]

    const trackedExistingTrips =
      existingTrips.filter(
        (trip) =>
          trip.source_type ===
            'pelimatka' ||
          trip.source_type ===
            'kurssimatka'
      )

    const existingKeySet =
      new Set(
        trackedExistingTrips
          .map(
            (trip) =>
              trip.source_key
          )
          .filter(
            (
              key
            ): key is string =>
              Boolean(key)
          )
      )

    const currentKeySet =
      new Set(
        trips.map(
          (trip) =>
            trip.source_key
        )
      )

    const addedCount =
      trips.filter(
        (trip) =>
          !existingKeySet.has(
            trip.source_key
          )
      ).length

    const updatedCount =
      trips.length -
      addedCount

    const databaseRows =
      trips.map((trip) => ({
        name: trip.name,

        country:
          getCountryFromUrl(
            trip.url
          ),

        trip_type:
          trip.source_type ===
          'kurssimatka'
            ? 'Kurssimatka'
            : 'Pelimatka',

        start_date:
          trip.start_date,

        end_date:
          trip.end_date,

        status: 'active',

        url: trip.url,

        source_key:
          trip.source_key,

        source_type:
          trip.source_type,

        source_url:
          trip.url,

        last_seen_at: now,

        last_synced_at: now,

        is_missing_from_source:
          false,
      }))

    const {
      error: upsertError,
    } = await supabase
      .from('trips')
      .upsert(
        databaseRows,
        {
          onConflict:
            'source_key',
        }
      )

    if (upsertError) {
      throw new Error(
        `Matkojen tallennus epäonnistui: ${upsertError.message}`
      )
    }

    const {
      data: refreshedData,
      error: refreshedError,
    } = await supabase
      .from('trips')
      .select(
        'id, name, country, start_date, end_date, url, source_url, source_key, source_type'
      )

    if (refreshedError) {
      throw new Error(
        `Matkojen yhdistämistietojen haku epäonnistui: ${refreshedError.message}`
      )
    }

    const mergeResult =
      await mergeExistingDuplicates(
        (refreshedData ||
          []) as ExistingTrip[],
        trips
      )

    const missingIds =
      trackedExistingTrips
        .filter((trip) => {
          return (
            trip.source_key &&
            !currentKeySet.has(
              trip.source_key
            ) &&
            !mergeResult.merged_trip_ids.has(
              trip.id
            )
          )
        })
        .map(
          (trip) =>
            trip.id
        )

    if (
      missingIds.length > 0
    ) {
      const {
        error: missingError,
      } = await supabase
        .from('trips')
        .update({
          status: 'inactive',

          is_missing_from_source:
            true,

          last_synced_at:
            now,
        })
        .in(
          'id',
          missingIds
        )

      if (missingError) {
        throw new Error(
          `Kadonneiden matkojen merkintä epäonnistui: ${missingError.message}`
        )
      }
    }

  return {
    added_count:
      addedCount,

    updated_count:
      updatedCount,

    missing_count:
      missingIds.length,

    merged_count:
      mergeResult.merged_count,

    merge_skipped_count:
      mergeResult.merge_skipped_count,
  }
}

export async function GET(
  request: Request
) {
  const startedAt = Date.now()
  const requestUrl =
    new URL(request.url)
  const shouldSave =
    requestUrl
      .searchParams
      .get('save') === '1'
  let runId: string | null = null

  try {
    if (
      shouldSave &&
      !isSaveAllowed(
        request
      )
    ) {
      return Response.json(
        {
          success: false,

          error:
            'Tallennus ei ole sallittu. Tuotantoon pitää lisätä SYNC_SECRET-ympäristömuuttuja.',
        },
        {
          status: 403,
        }
      )
    }

    if (shouldSave) {
      runId =
        await startSyncRun()

      console.log(
        JSON.stringify({
          level: 'info',
          message:
            'Trip synchronization started',
          route:
            '/api/sync-trips',
          run_id: runId,
          request_id:
            request.headers.get(
              'x-vercel-id'
            ),
        })
      )
    }

    const sourceResults =
      await Promise.all(
        SOURCES.map(
          async (source) => {
            const trips =
              await scrapeSource(
                source
              )

            return {
              source_type:
                source.sourceType,

              source_url:
                source.sourceUrl,

              found:
                trips.length,

              trips,
            }
          }
        )
      )

    const allTrips =
      sourceResults.flatMap(
        (result) =>
          result.trips
      )

    const {
      trips: uniqueTrips,
      duplicates,
    } = deduplicateTrips(
      allTrips
    )

    const emptySource =
      sourceResults.find(
        (result) =>
          result.found === 0
      )

    if (emptySource) {
      throw new Error(
        `Synkronointi keskeytettiin: lähteestä ${emptySource.source_url} ei löytynyt yhtään matkaa.`
      )
    }

    if (
      uniqueTrips.length <
      MINIMUM_TOTAL_TRIPS
    ) {
      throw new Error(
        `Synkronointi keskeytettiin: löytyi vain ${uniqueTrips.length} yksilöllistä matkaa.`
      )
    }

    const urlSlugNames =
      uniqueTrips.filter(
        (trip) =>
          trip.name_source ===
          'url_slug'
      )

    if (!shouldSave) {
      return Response.json(
        {
          success: true,

          mode: 'preview',

          message:
            'Esikatselu onnistui. Mitään ei vielä tallennettu Supabaseen.',

          raw_total_found:
            allTrips.length,

          unique_total_found:
            uniqueTrips.length,

          duplicates_removed:
            duplicates.length,

          sources:
            sourceResults.map(
              (result) => ({
                source_type:
                  result.source_type,

                source_url:
                  result.source_url,

                found:
                  result.found,
              })
            ),

          review: {
            url_slug_name_count:
              urlSlugNames.length,

            url_slug_names:
              urlSlugNames,

            duplicate_examples:
              duplicates.slice(
                0,
                25
              ),
          },

          trips:
            uniqueTrips,
        },
        {
          status: 200,

          headers: {
            'Cache-Control':
              'no-store, max-age=0',
          },
        }
      )
    }

    const saveResult =
      await saveTripsToSupabase(
        uniqueTrips
      )

    await finishSyncRun(
      runId!,
      {
        status: 'success',

        found_count:
          uniqueTrips.length,

        added_count:
          saveResult.added_count,

        updated_count:
          saveResult.updated_count,

        missing_count:
          saveResult.missing_count,

        error_message: null,
      }
    )

    console.log(
      JSON.stringify({
        level: 'info',
        message:
          'Trip synchronization completed',
        route:
          '/api/sync-trips',
        run_id: runId,
        duration_ms:
          Date.now() - startedAt,
        found_count:
          uniqueTrips.length,
        added_count:
          saveResult.added_count,
        updated_count:
          saveResult.updated_count,
        missing_count:
          saveResult.missing_count,
        merged_count:
          saveResult.merged_count,
        merge_skipped_count:
          saveResult.merge_skipped_count,
      })
    )

    return Response.json(
      {
        success: true,

        mode: 'save',

        message:
          'Matkat tallennettiin Supabaseen.',

        raw_total_found:
          allTrips.length,

        unique_total_found:
          uniqueTrips.length,

        duplicates_removed:
          duplicates.length,

        ...saveResult,
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Tuntematon virhe'

    if (runId) {
      await finishSyncRun(
        runId,
        {
          status: 'failed',
          error_message:
            message,
        }
      )
    }

    console.error(
      JSON.stringify({
        level: 'error',
        message:
          'Trip synchronization failed',
        route:
          '/api/sync-trips',
        mode: shouldSave
          ? 'save'
          : 'preview',
        run_id: runId,
        duration_ms:
          Date.now() - startedAt,
        error: message,
      })
    )

    return Response.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    )
  }
}
