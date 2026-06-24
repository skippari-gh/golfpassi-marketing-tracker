import Link from 'next/link'
import { priorityReason } from '../../../lib/priority'
import {
  getTripWithPriority,
  getMarketingActionsForTrip,
} from '../../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function TripPage({
  params,
}: {
  params: { id: string }
}) {
  const trip = await getTripWithPriority(params.id)

  if (!trip) {
    return (
      <main className="container">
        <p>Matkaa ei löytynyt.</p>
      </main>
    )
  }

  const actions = await getMarketingActionsForTrip(params.id)

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        <Link href={`/actions/new?trip=${trip.id}`}>Lisää merkintä</Link>
      </nav>

      <article className="card">
        <span className="score">Prioriteetti {trip.priority_score}</span>

        <h1>{trip.name}</h1>

        <p>
          {trip.country} · {trip.start_date}–{trip.end_date}
        </p>

        <p>
          <strong>Viimeksi markkinoitu:</strong>{' '}
          {trip.last_marketed_at || 'ei koskaan'}
        </p>

        <p>
          <strong>Käytetyt kanavat:</strong>{' '}
          {trip.channels_used.join(', ') || 'ei vielä yhtään'}
        </p>

        <p className="reason">
          <strong>Suositus:</strong> {priorityReason(trip)}
        </p>
      </article>

      <h2 style={{ marginTop: '32px' }}>Markkinointihistoria</h2>

      <table>
        <thead>
          <tr>
            <th>Päivä</th>
            <th>Kanava</th>
            <th>Otsikko</th>
            <th>Huomiot</th>
          </tr>
        </thead>

        <tbody>
          {actions.length === 0 ? (
            <tr>
              <td colSpan={4}>Ei merkintöjä</td>
            </tr>
          ) : (
            actions.map((action: any) => (
              <tr key={action.id}>
                <td>{action.action_date}</td>
                <td>{action.channels?.name || '-'}</td>
                <td>{action.title || '-'}</td>
                <td>{action.notes || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  )
}
