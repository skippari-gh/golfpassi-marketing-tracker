import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTripsWithPriority } from '../../../lib/trips'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

export default async function NewRequestPage() {
  const trips = (await getTripsWithPriority())
    .filter((trip) => trip.status === 'active')
    .filter((trip) => trip.days_to_start >= 0)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  async function createRequest(formData: FormData) {
    'use server'

    const tripId = String(formData.get('trip_id') || '')
    const requesterName = String(
      formData.get('requester_name') || ''
    ).trim()
    const requestText = String(
      formData.get('request_text') || ''
    ).trim()
    const priority = String(formData.get('priority') || 'normal')
    const desiredDate = String(formData.get('desired_date') || '')

    if (!tripId || !requesterName || !requestText) {
      throw new Error('Täytä matka, nimi ja markkinointitoive.')
    }

    const { error } = await supabase
      .from('marketing_requests')
      .insert({
        trip_id: tripId,
        requester_name: requesterName,
        request_text: requestText,
        priority,
        desired_date: desiredDate || null,
        status: 'open',
      })

    if (error) {
      throw new Error(error.message)
    }

    redirect('/')
  }

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        <Link href="/actions/new">Lisää merkintä</Link>
      </nav>

      <h1>Uusi markkinointitoive</h1>

      <article className="card">
        <form action={createRequest}>
          <label>
            Matka
            <select name="trip_id" required defaultValue="">
              <option value="" disabled>
                Valitse matka
              </option>

              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name} – {trip.country}
                </option>
              ))}
            </select>
          </label>

          <label>
            Toivojan nimi
            <input
              type="text"
              name="requester_name"
              placeholder="Esimerkiksi Petri"
              required
            />
          </label>

          <label>
            Markkinointitoive
            <textarea
              name="request_text"
              rows={6}
              placeholder="Mitä matkasta pitäisi markkinoida ja missä kanavassa?"
              required
            />
          </label>

          <label>
            Kiireellisyys
            <select name="priority" defaultValue="normal">
              <option value="low">Matala</option>
              <option value="normal">Normaali</option>
              <option value="high">Kiireellinen</option>
            </select>
          </label>

          <label>
            Toivottu päivämäärä
            <input type="date" name="desired_date" />
          </label>

          <div className="actions">
            <button className="button" type="submit">
              Tallenna toive
            </button>

            <Link className="button secondary" href="/">
              Peruuta
            </Link>
          </div>
        </form>
      </article>
    </main>
  )
}