import Link from 'next/link'
import { groupTripsByDestination } from '../../../lib/trip-destinations'
import { getTripsWithPriority } from '../../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function NewRequestPage() {
  const allTrips = await getTripsWithPriority()
  const destinations = groupTripsByDestination(
    allTrips.filter(
      (trip) => trip.status === 'active' && trip.days_to_start >= 0
    )
  ).sort((a, b) => a.name.localeCompare(b.name, 'fi'))

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
            <select name="trip_id" defaultValue="" required>
              <option value="" disabled>Valitse kohde</option>
              {destinations.map((destination) => (
                <option
                  key={destination.key}
                  value={destination.trips[0]?.id || ''}
                >
                  {destination.name} · {destination.country}
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
