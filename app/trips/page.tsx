import Link from 'next/link'
import { getTripsWithPriority } from '../../lib/trips'

export const dynamic = 'force-dynamic'

type TripsPageProps = {
  searchParams?: Promise<{
    q?: string
  }>
}

type ParsedDate = {
  day: number
  month: number
  year: number
}

type TripItem = Awaited<
  ReturnType<typeof getTripsWithPriority>
>[number]

function parseDate(
  value?: string | null
): ParsedDate | null {
  if (!value) {
    return null
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  )

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function formatDate(
  value?: string | null
) {
  const date = parseDate(value)

  if (!date) {
    return value || 'ei koskaan'
  }

  return `${date.day}.${date.month}.${date.year}`
}

function formatDateRange(
  startValue: string,
  endValue: string
) {
  const start = parseDate(startValue)
  const end = parseDate(endValue)

  if (!start || !end) {
    return `${startValue}–${endValue}`
  }

  if (
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day
  ) {
    return `${start.day}.${start.month}.${start.year}`
  }

  if (
    start.year === end.year &&
    start.month === end.month
  ) {
    return `${start.day}.–${end.day}.${end.month}.${end.year}`
  }

  if (start.year === end.year) {
    return `${start.day}.${start.month}.–${end.day}.${end.month}.${end.year}`
  }

  return `${start.day}.${start.month}.${start.year}–${end.day}.${end.month}.${end.year}`
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ja ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTripDuplicateKey(
  trip: TripItem
) {
  return [
    normalizeText(trip.name),
    normalizeText(trip.country),
    trip.start_date.slice(0, 10),
    trip.end_date.slice(0, 10),
  ].join('|')
}

function getTripDataScore(
  trip: TripItem
) {
  let score = 0

  /*
   * Duplikaateista säilytetään ensisijaisesti
   * rivi, johon on jo liitetty markkinointitietoja.
   */
  if (trip.last_marketed_at) {
    score += 100
  }

  score += trip.channels_used.length * 10

  if (trip.has_newsletter) {
    score += 5
  }

  if (trip.has_social) {
    score += 5
  }

  if (trip.url) {
    score += 1
  }

  return score
}

function removeDuplicateTrips(
  trips: TripItem[]
) {
  const uniqueTrips = new Map<
    string,
    TripItem
  >()

  for (const trip of trips) {
    const duplicateKey =
      getTripDuplicateKey(trip)

    const existingTrip =
      uniqueTrips.get(duplicateKey)

    if (!existingTrip) {
      uniqueTrips.set(
        duplicateKey,
        trip
      )

      continue
    }

    const existingScore =
      getTripDataScore(existingTrip)

    const newScore =
      getTripDataScore(trip)

    if (newScore > existingScore) {
      uniqueTrips.set(
        duplicateKey,
        trip
      )
    }
  }

  return Array.from(
    uniqueTrips.values()
  )
}

export default async function TripsPage({
  searchParams,
}: TripsPageProps) {
  const params = await searchParams

  const search =
    normalizeText(
      params?.q?.trim() || ''
    )

  const allTrips =
    await getTripsWithPriority()

  const uniqueTrips =
    removeDuplicateTrips(allTrips)

  const trips = uniqueTrips
    .filter((trip) => {
      if (!search) {
        return true
      }

      const searchableText =
        normalizeText(
          `${trip.name} ${trip.country}`
        )

      return searchableText.includes(
        search
      )
    })
    .sort((a, b) => {
      const dateComparison =
        a.start_date.localeCompare(
          b.start_date
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return a.name.localeCompare(
        b.name,
        'fi'
      )
    })

  const hiddenDuplicateCount =
    allTrips.length -
    uniqueTrips.length

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">
          Nosta seuraavaksi
        </Link>

        <Link href="/trips">
          Matkat
        </Link>

        <Link href="/actions/new">
          Lisää merkintä
        </Link>
      </nav>

      <h1>Matkat</h1>

      <form
        className="search-form"
        method="get"
      >
        <input
          type="search"
          name="q"
          placeholder="Hae matkaa tai maata..."
          defaultValue={params?.q || ''}
        />

        <button type="submit">
          Hae
        </button>

        {search && (
          <Link
            href="/trips"
            className="button secondary"
          >
            Tyhjennä
          </Link>
        )}
      </form>

      <p className="search-result-count">
        Näytetään {trips.length} matkaa

        {!search &&
          hiddenDuplicateCount > 0 && (
            <>
              {' '}
              · {hiddenDuplicateCount}{' '}
              tuplaa piilotettu
            </>
          )}
      </p>

      <table>
        <thead>
          <tr>
            <th>Matka</th>
            <th>Maa</th>
            <th>Päivämäärät</th>
            <th>Status</th>
            <th>Viimeksi</th>
            <th>Prioriteetti</th>
          </tr>
        </thead>

        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>
                <Link
                  href={`/trips/${trip.id}`}
                >
                  {trip.name}
                </Link>
              </td>

              <td>
                {trip.country}
              </td>

              <td
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDateRange(
                  trip.start_date,
                  trip.end_date
                )}
              </td>

              <td>
                {trip.status}
              </td>

              <td
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDate(
                  trip.last_marketed_at
                )}
              </td>

              <td>
                {trip.priority_score}
              </td>
            </tr>
          ))}

          {trips.length === 0 && (
            <tr>
              <td colSpan={6}>
                Hakua vastaavia matkoja ei
                löytynyt.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  )
}