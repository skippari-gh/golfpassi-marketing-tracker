import Link from 'next/link'
import { getTripsWithPriority } from '../../lib/trips'
import { groupTripsByDestination } from '../../lib/trip-destinations'

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

export default async function TripsPage({
  searchParams,
}: TripsPageProps) {
  const params = await searchParams

  const search = normalizeText(
    params?.q?.trim() || ''
  )

  const allTrips =
    await getTripsWithPriority()

  const activeTrips = allTrips.filter(
    (trip) =>
      trip.status === 'active' &&
      trip.days_to_start >= 0
  )

  const destinations =
    groupTripsByDestination(activeTrips)
    .filter((destination) => {
      if (!search) {
        return true
      }

      const searchableText =
        normalizeText(
          [
            destination.name,
            destination.country,
            ...destination.trips.map(
              (trip) => trip.name
            ),
          ].join(' ')
        )

      return searchableText.includes(
        search
      )
    })
    .sort((a, b) => {
      const dateComparison =
        a.trips[0].start_date.localeCompare(
          b.trips[0].start_date
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return a.name.localeCompare(
        b.name,
        'fi'
      )
    })

  const departureCount = destinations.reduce(
    (count, destination) =>
      count + destination.trips.length,
    0
  )

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
        Näytetään {destinations.length}{' '}
        {destinations.length === 1
          ? 'kohde'
          : 'kohdetta'}{' '}
        · {departureCount}{' '}
        {departureCount === 1
          ? 'lähtö'
          : 'lähtöä'}
      </p>

      <div className="trips-table-wrapper">
        <table className="trips-table">
          <thead>
            <tr>
              <th>Kohde</th>
              <th>Maa</th>
              <th>Lähdöt</th>
              <th>Seuraava lähtö</th>
              <th>Viimeksi</th>
              <th>Prioriteetti</th>
            </tr>
          </thead>

          <tbody>
            {destinations.map((destination) => {
            const nextTrip = destination.trips[0]

            const lastMarketedAt =
              destination.trips
                .map((trip) => trip.last_marketed_at)
                .filter(
                  (date): date is string => Boolean(date)
                )
                .sort()
                .at(-1) || null

            const priorityScore = Math.max(
              ...destination.trips.map(
                (trip) => trip.priority_score
              )
            )

            return (
              <tr key={destination.key}>
                <td
                  className="trip-destination-cell"
                  colSpan={6}
                >
                  <details className="trip-destination-details">
                    <summary className="trip-destination-summary">
                      <span className="trip-destination-name">
                        <span
                          aria-hidden="true"
                          className="trip-destination-arrow"
                        >
                          ›
                        </span>
                        {destination.name}
                      </span>

                      <span>{destination.country}</span>

                      <span>
                        {destination.trips.length}{' '}
                        {destination.trips.length === 1
                          ? 'lähtö'
                          : 'lähtöä'}
                      </span>

                      <span className="trip-date">
                        {formatDateRange(
                          nextTrip.start_date,
                          nextTrip.end_date
                        )}
                      </span>

                      <span className="trip-date">
                        {formatDate(lastMarketedAt)}
                      </span>

                      <span>{priorityScore}</span>
                    </summary>

                    <div className="trip-departure-rows">
                      <div className="trip-destination-actions">
                        <div>
                          <strong>Kohteen markkinointi</strong>
                          <p className="meta">
                            Kaikki lähtöpäivät, suunnitelmat ja tehdyt toimet yhdessä näkymässä.
                          </p>
                        </div>

                        <Link
                          className="button"
                          href={`/destinations/${destination.key}`}
                        >
                          Avaa markkinointinäkymä
                        </Link>
                      </div>

                      {destination.trips.map((departure) => (
                        <div
                          className="trip-departure-list-row"
                          key={departure.id}
                        >
                          <Link
                            className="trip-departure-link"
                            href={`/trips/${departure.id}`}
                          >
                            {departure.name}
                          </Link>

                          <span>{departure.country}</span>

                          <span className="trip-departure-label">
                            Lähtö
                          </span>

                          <span className="trip-date">
                            {formatDateRange(
                              departure.start_date,
                              departure.end_date
                            )}
                          </span>

                          <span className="trip-date">
                            {formatDate(
                              departure.last_marketed_at
                            )}
                          </span>

                          <span>{departure.priority_score}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </td>
              </tr>
            )
            })}

            {destinations.length === 0 && (
              <tr>
                <td colSpan={6}>
                  Hakua vastaavia matkoja ei löytynyt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
