import Link from 'next/link'
import { getTripsWithPriority } from '../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{
    country?: string
    type?: string
    month?: string
    unmarketed?: string
  }>
}) {
  const params = await searchParams

  const trips = (await getTripsWithPriority()).sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  )

  const countries = Array.from(new Set(trips.map((t) => t.country))).sort()
  const types = Array.from(new Set(trips.map((t) => t.trip_type))).sort()
  const months = Array.from(new Set(trips.map((t) => t.start_date.slice(0, 7)))).sort()

  const filtered = trips.filter((trip) => {
    if (params.country && trip.country !== params.country) return false
    if (params.type && trip.trip_type !== params.type) return false
    if (params.month && !trip.start_date.startsWith(params.month)) return false
    if (params.unmarketed === '1' && trip.last_marketed_at) return false
    return true
  })

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        <Link href="/actions/new">Lisää merkintä</Link>
      </nav>

      <h1>Matkat</h1>
      <p>Matkoja: {filtered.length}</p>

      <form className="filters">
        <select name="country" defaultValue={params.country || ''}>
          <option value="">Kaikki maat</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <select name="type" defaultValue={params.type || ''}>
          <option value="">Kaikki tyypit</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select name="month" defaultValue={params.month || ''}>
          <option value="">Kaikki kuukaudet</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <label className="checkbox">
          <input
            type="checkbox"
            name="unmarketed"
            value="1"
            defaultChecked={params.unmarketed === '1'}
          />
          Vain markkinoimattomat
        </label>

        <button type="submit">Suodata</button>

        <Link className="button secondary" href="/trips">
          Tyhjennä
        </Link>
      </form>

      <table>
        <thead>
          <tr>
            <th>Matka</th>
            <th>Maa</th>
            <th>Tyyppi</th>
            <th>Päivämäärät</th>
            <th>Viimeksi</th>
            <th>Prioriteetti</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((trip) => (
            <tr key={trip.id}>
              <td>
                <Link href={`/trips/${trip.id}`}>{trip.name}</Link>
              </td>
              <td>{trip.country}</td>
              <td>{trip.trip_type}</td>
              <td>
                {trip.start_date}–{trip.end_date}
              </td>
              <td>{trip.last_marketed_at || 'ei koskaan'}</td>
              <td>{trip.priority_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
