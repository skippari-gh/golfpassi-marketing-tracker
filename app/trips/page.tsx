import Link from 'next/link'
import { getTripsWithPriority } from '../../lib/trips'

export const dynamic = 'force-dynamic'

type TripsPageProps = {
  searchParams?: Promise<{
    q?: string
  }>
}

export default async function TripsPage({
  searchParams,
}: TripsPageProps) {
  const params = await searchParams
  const search = params?.q?.trim().toLowerCase() || ''

  const trips = (await getTripsWithPriority())
    .filter((trip) => {
      if (!search) return true

      return `${trip.name} ${trip.country}`
        .toLowerCase()
        .includes(search)
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        <Link href="/actions/new">Lisää merkintä</Link>
      </nav>

      <h1>Matkat</h1>

      <form className="search-form" method="get">
        <input
          type="search"
          name="q"
          placeholder="Hae matkaa tai maata..."
          defaultValue={params?.q || ''}
        />

        <button type="submit">Hae</button>

        {search && (
          <Link href="/trips" className="button secondary">
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
                <Link href={`/trips/${trip.id}`}>
                  {trip.name}
                </Link>
              </td>

              <td>{trip.country}</td>

              <td>
                {trip.start_date}–{trip.end_date}
              </td>

              <td>{trip.status}</td>

              <td>{trip.last_marketed_at || 'ei koskaan'}</td>

              <td>{trip.priority_score}</td>
            </tr>
          ))}

          {trips.length === 0 && (
            <tr>
              <td colSpan={6}>Hakua vastaavia matkoja ei löytynyt.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  )
}