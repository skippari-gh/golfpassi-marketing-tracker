import Link from 'next/link'
import { getTripsWithPriority } from '../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function TripsPage() {
  const trips = (await getTripsWithPriority()).sort((a, b) => a.start_date.localeCompare(b.start_date))
  return <main className="container">
    <nav className="nav"><Link href="/">Nosta seuraavaksi</Link><Link href="/trips">Matkat</Link><Link href="/actions/new">Lisää merkintä</Link></nav>
    <h1>Matkat</h1>
    <table><thead><tr><th>Matka</th><th>Maa</th><th>Päivämäärät</th><th>Status</th><th>Viimeksi</th><th>Prioriteetti</th></tr></thead><tbody>
      {trips.map((t) => <tr key={t.id}><td><Link href={`/trips/${t.id}`}>{t.name}</Link></td><td>{t.country}</td><td>{t.start_date}–{t.end_date}</td><td>{t.status}</td><td>{t.last_marketed_at || 'ei koskaan'}</td><td>{t.priority_score}</td></tr>)}
    </tbody></table>
  </main>
}
