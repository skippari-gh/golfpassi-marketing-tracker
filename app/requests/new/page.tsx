import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { groupTripsByDestination } from '../../../lib/trip-destinations'
import { getTripsWithPriority } from '../../../lib/trips'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

function getToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function createMarketingRequest(formData: FormData) {
  'use server'

  const destinationId = String(formData.get('destination_id') || '')
  const requesterName = String(formData.get('requester_name') || '').trim()
  const requestText = String(formData.get('request_text') || '').trim()
  const priority = formData.get('urgent') === 'on' ? 'high' : 'normal'

  if (!destinationId || !requesterName || !requestText) {
    throw new Error('Valitse kohde ja täytä nimi sekä markkinointipyyntö.')
  }

  const { data: representativeTrip, error: tripError } = await supabase
    .from('trips')
    .select('id')
    .eq('destination_id', destinationId)
    .eq('status', 'active')
    .gte('end_date', getToday())
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  if (tripError || !representativeTrip) {
    throw new Error('Kohteelle ei löytynyt tulevaa lähtöä.')
  }

  const { error } = await supabase
    .from('marketing_requests')
    .insert({
      destination_id: destinationId,
      trip_id: representativeTrip.id,
      requester_name: requesterName,
      request_text: requestText,
      priority,
      desired_date: null,
      status: 'open',
    })

  if (error) throw new Error(error.message)

  revalidatePath('/')
  redirect('/')
}

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

        <form className="request-form" action={createMarketingRequest}>
          <label>
            Kohde
            <select name="destination_id" defaultValue="" required>
              <option value="" disabled>Valitse kohde</option>
              {destinations.map((destination) => (
                <option key={destination.key} value={destination.key}>
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
