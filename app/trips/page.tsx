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

function parseDate(value?: string | null): ParsedDate | null {
  if (!value) {
    return null
  }

  /*
   * Toimii sekä päivämäärälle
   * 2026-08-02 että aikaleimalle
   * 2026-08-02T10:30:00.000Z.
   */
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

function formatDate(value?: string | null) {
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

  /*
   * Sama päivä:
   * 2.8.2026
   */
  if (
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day
  ) {
    return `${start.day}.${start.month}.${start.year}`
  }

  /*
   * Sama kuukausi:
   * 2.–5.8.2026
   */
  if (
    start.year === end.year &&
    start.month === end.month
  ) {
    return `${start.day}.–${end.day}.${end.month}.${end.year}`
  }

  /*
   * Sama vuosi:
   * 29.10.–5.11.2026
   */
  if (start.year === end.year) {
    return `${start.day}.${start.month}.–${end.day}.${end.month}.${end.year}`
  }

  /*
   * Eri vuodet:
   * 29.12.2026–5.1.2027
   */
  return `${start.day}.${start.month}.${start.year}–${end.day}.${end.month}.${end.year}`
}

export default async function TripsPage({
  searchParams,
}: TripsPageProps) {
  const params = await searchParams

  const search =
    params?.q?.trim().toLowerCase() || ''

  const trips = (await getTripsWithPriority())
    .filter((trip) => {
      if (!search) {
        return true
      }

      return `${trip.name} ${trip.country}`
        .toLowerCase()
        .includes(search)
    })
    .sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
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
        Näytetään {trips.length} matkaa
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
                {trip.last_marketed_at
                  ? formatDate(
                      trip.last_marketed_at
                    )
                  : 'ei koskaan'}
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