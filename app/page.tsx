import Link from 'next/link'
import { priorityReason } from '../lib/priority'
import { getTripsWithPriority } from '../lib/trips'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const trips = (await getTripsWithPriority())
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 10)

  return (
    <>
      <header className="header">
        <h1>Golfpassi Marketing Tracker</h1>
        <p>Nosta esiin matkat, joita ei ole hetkeen markkinoitu.</p>
      </header>

      <main className="container">
        <nav className="nav">
          <Link href="/">Nosta seuraavaksi</Link>
          <Link href="/trips">Matkat</Link>
          <Link href="/actions/new">Lisää merkintä</Link>
        </nav>

        <h2>Nosta seuraavaksi</h2>

        <div className="grid">
          {trips.map((trip) => (
            <article className="card" key={trip.id}>
              <span className="score">Prioriteetti {trip.priority_score}</span>
              <h2>{trip.name}</h2>
              <p className="meta">{trip.country} · {trip.start_date}–{trip.end_date}</p>
              <p className="meta">Viimeksi markkinoitu: {trip.last_marketed_at || 'ei koskaan'}</p>
              <p className="meta">
                Lähtöön: {trip.days_to_start} pv · Kanavat:{' '}
                {trip.channels_used.join(', ') || 'ei vielä'}
              </p>
              <p className="reason">
                <strong>Syy:</strong> {priorityReason(trip)}
              </p>

              <div className="actions">
                <Link className="button" href={`/trips/${trip.id}`}>
                  Avaa matka
                </Link>

                <Link
                  className="button secondary"
                  href={`/actions/new?trip=${trip.id}`}
                >
                  Lisää nosto
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  )
}
