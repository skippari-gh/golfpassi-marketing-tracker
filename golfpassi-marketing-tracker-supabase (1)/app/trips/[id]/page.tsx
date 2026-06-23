import Link from 'next/link'
import { priorityReason } from '../../../lib/priority'
import { getTripWithPriority } from '../../../lib/trips'

export default async function TripPage({ params }: { params: { id: string } }) {
  const trip = await getTripWithPriority(params.id)
  if (!trip) return <main className="container"><p>Matkaa ei löytynyt.</p></main>
  return <main className="container">
    <nav className="nav"><Link href="/">Nosta seuraavaksi</Link><Link href="/trips">Matkat</Link><Link href={`/actions/new?trip=${trip.id}`}>Lisää merkintä</Link></nav>
    <article className="card">
      <span className="score">Prioriteetti {trip.priority_score}</span>
      <h1>{trip.name}</h1>
      <p>{trip.country} · {trip.start_date}–{trip.end_date}</p>
      <p><strong>Viimeksi markkinoitu:</strong> {trip.last_marketed_at || 'ei koskaan'}</p>
      <p><strong>Käytetyt kanavat:</strong> {trip.channels_used.join(', ') || 'ei vielä yhtään'}</p>
      <p className="reason"><strong>Suositus:</strong> Nosta seuraavaksi. {priorityReason(trip)}.</p>
    </article>
  </main>
}
