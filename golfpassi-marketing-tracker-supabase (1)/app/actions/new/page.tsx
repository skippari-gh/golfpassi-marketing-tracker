import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getChannels, getTripsWithPriority } from '../../../lib/trips'

async function createMarketingAction(formData: FormData) {
  'use server'
  const trip_id = String(formData.get('trip_id') || '')
  const channel_id = String(formData.get('channel_id') || '')
  const action_date = String(formData.get('action_date') || '')
  const title = String(formData.get('title') || '')
  const notes = String(formData.get('notes') || '')

  if (!trip_id || !channel_id || !action_date) throw new Error('Matka, kanava ja päivämäärä ovat pakollisia.')

  const { error } = await supabase.from('marketing_actions').insert({ trip_id, channel_id, action_date, title, notes })
  if (error) throw new Error(error.message)
  redirect('/')
}

export default async function NewActionPage({ searchParams }: { searchParams: { trip?: string } }) {
  const trips = await getTripsWithPriority()
  const channels = await getChannels()
  const today = new Date().toISOString().slice(0, 10)

  return <main className="container">
    <nav className="nav"><Link href="/">Nosta seuraavaksi</Link><Link href="/trips">Matkat</Link><Link href="/actions/new">Lisää merkintä</Link></nav>
    <h1>Lisää markkinointimerkintä</h1>
    <form className="form" action={createMarketingAction}>
      <label>Matka<select name="trip_id" defaultValue={searchParams.trip || ''} required>
        <option value="" disabled>Valitse matka</option>
        {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
      </select></label>
      <label>Kanava<select name="channel_id" required>
        {channels.map((channel: any) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
      </select></label>
      <label>Päivämäärä<input type="date" name="action_date" defaultValue={today} required /></label>
      <label>Otsikko<input name="title" placeholder="Esim. Uutiskirjeen pääosto" /></label>
      <label>Huomio<textarea name="notes" rows={4} placeholder="Esim. Kesädiilit, viimeiset paikat, karuselli..." /></label>
      <button type="submit">Tallenna merkintä</button>
    </form>
  </main>
}
