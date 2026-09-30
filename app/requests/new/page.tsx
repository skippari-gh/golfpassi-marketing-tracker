import Link from 'next/link'
import { getTripsWithPriority } from '../../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams?: Promise<{ trip?: string | string[] }>
}) {
  const params = await searchParams
  const tripParam = params?.trip
  const selectedTripId = Array.isArray(tripParam) ? tripParam[0] : tripParam || ''

  const allTrips = await getTripsWithPriority()
  const activeTrips = allTrips
    .filter((trip) => trip.status === 'active' && trip.days_to_start >= 0)
    .sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name, 'fi')
      return nameComparison !== 0 ? nameComparison : a.start_date.localeCompare(b.start_date)
    })

  return (
    <main className="container request-page">
      <nav className="nav">
        <Link href="/">← Takaisin etusivulle</Link>
        <Link href="/trips">Matkat</Link>
      </nav>

      <article className="card request-form-card">
        <div className="request-form-heading">
          <span className="request-form-kicker">Nopea pyyntö markkinoinnille</span>
          <h1>Pyydä markkinointia</h1>
          <p className="meta">
            Kerro, mitä kohdetta pitäisi nostaa. Pyyntö näkyy heti markkinoinnin etusivulla.
          </p>
        </div>

        <form
          className="request-form"
          action="/api/marketing-requests"
          method="post"
        >
          <label>
            Kohde
            <select name="trip_id" defaultValue={selectedTripId} required>
              <option value="" disabled>Valitse kohde</option>
              {activeTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name} · {trip.country} · {trip.start_date}
                </option>
              ))}
            </select>
          </label>

          <label>
            Oma nimi
            <input
              type="text"
              name="requester_name"
              placeholder="Kirjoita nimesi"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Mitä pitäisi markkinoida?
            <textarea
              name="request_text"
              rows={5}
              placeholder="Esimerkiksi: Nosta kohdetta ensi viikon uutiskirjeessä ja Facebookissa."
              required
            />
          </label>

          <label className="request-urgent-field">
            <input type="checkbox" name="urgent" />
            <span>
              <strong>Kiireellinen</strong>
              <small>Valitse vain, jos pyyntö vaatii nopeaa reagointia.</small>
            </span>
          </label>

          <div className="actions">
            <button className="button" type="submit">Lähetä pyyntö</button>
            <Link className="button secondary" href="/">Peruuta</Link>
          </div>
        </form>
      </article>
    </main>
  )
}
