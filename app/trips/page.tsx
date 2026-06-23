import Link from 'next/link'
import { getTripsWithPriority } from '../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function TripsPage({
  searchParams,
}: {
  searchParams: { country?: string; type?: string; month?: string }
}) {
  const trips = (await getTripsWithPriority()).sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  )

  const countries = Array.from(new Set(trips.map((t) => t.country))).sort()
  const types = Array.from(new Set(trips.map((t) => t.trip_type))).sort()
  const months = Array.from(
    new Set(trips.map((t) => t.start_date.slice(0, 7)))
  ).sort()

  const filtered = trips.filter((t) => {
    if (searchParams.country && t.country !== searchParams.country) return false
    if (searchParams.type && t.trip_type !== searchParams.type) return false
    if (searchParams.month && !t.start_date.startsWith(searchParams.month)) return false
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
        <select name="country" defaultValue={searchParams.country || ''}>
          <option value="">Kaikki maat</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select name="type" defaultValue={searchParams.type || ''}>
          <option value="">Kaikki tyypit</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select name="month" defaultValue={searchParams.month || ''}>
          <option value="">Kaikki kuukaudet</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <button type="submit">Suodata</button>
        <Link className="button secondary" href="/trips">Tyhjennä</Link>
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
          {filtered.map((t) => (
            <tr key={t.id}>
              <td><Link href={`/trips/${t.id}`}>{t.name}</Link></td>
              <td>{t.country}</td>
              <td>{t.trip_type}</td>
              <td>{t.start_date}–{t.end_date}</td>
              <td>{t.last_marketed_at || 'ei koskaan'}</td>
              <td>{t.priority_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
