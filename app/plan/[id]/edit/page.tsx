import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../../lib/supabase'
import { groupTripsByDestination } from '../../../../lib/trip-destinations'
import { getChannels, getTripsWithPriority } from '../../../../lib/trips'

export const dynamic = 'force-dynamic'

function getToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function updateMarketingPlan(formData: FormData) {
  'use server'

  const planId = String(formData.get('plan_id') || '')
  const destinationIds = formData.getAll('destination_id').map(String).filter(Boolean)
  const plannedDate = String(formData.get('planned_date') || '')
  const channel = String(formData.get('channel') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!planId || destinationIds.length === 0 || !plannedDate || !channel || !title) {
    throw new Error('Täytä päivämäärä, kanava ja toimenpide sekä valitse vähintään yksi kohde.')
  }

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, destination_id, start_date')
    .in('destination_id', destinationIds)
    .eq('status', 'active')
    .gte('end_date', getToday())
    .order('start_date', { ascending: true })

  if (tripsError) throw new Error(tripsError.message)

  const tripByDestination = new Map<string, string>()
  for (const trip of trips || []) {
    if (!tripByDestination.has(trip.destination_id)) {
      tripByDestination.set(trip.destination_id, trip.id)
    }
  }

  const missingDestination = destinationIds.find((id) => !tripByDestination.has(id))
  if (missingDestination) {
    throw new Error('Jollekin valitulle kohteelle ei löytynyt tulevaa lähtöä.')
  }

  const representativeDestinationId = destinationIds[0]
  const representativeTripId = tripByDestination.get(representativeDestinationId)

  const { error: updateError } = await supabase
    .from('marketing_plan')
    .update({
      planned_date: plannedDate,
      channel,
      title,
      notes: notes || null,
      destination_id: representativeDestinationId,
      trip_id: representativeTripId,
    })
    .eq('id', planId)
    .is('archived_at', null)

  if (updateError) throw new Error(updateError.message)

  const { error: deleteLinksError } = await supabase
    .from('marketing_plan_destinations')
    .delete()
    .eq('marketing_plan_id', planId)

  if (deleteLinksError) throw new Error(deleteLinksError.message)

  const { error: linkError } = await supabase
    .from('marketing_plan_destinations')
    .insert(destinationIds.map((destinationId) => ({
      marketing_plan_id: planId,
      destination_id: destinationId,
      trip_id: tripByDestination.get(destinationId),
    })))

  if (linkError) throw new Error(linkError.message)

  revalidatePath('/')
  revalidatePath(`/calendar/day/${plannedDate}`)
  revalidatePath(`/plan/${planId}/edit`)
  redirect(`/calendar/day/${plannedDate}`)
}

export default async function EditMarketingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [{ data: plan, error: planError }, { data: links, error: linksError }, allTrips, channels] =
    await Promise.all([
      supabase.from('marketing_plan').select('*').eq('id', id).is('archived_at', null).maybeSingle(),
      supabase.from('marketing_plan_destinations').select('destination_id').eq('marketing_plan_id', id),
      getTripsWithPriority(),
      getChannels(),
    ])

  if (planError) throw new Error(planError.message)
  if (linksError) throw new Error(linksError.message)
  if (!plan) notFound()

  const destinations = groupTripsByDestination(
    allTrips.filter((trip) => trip.status === 'active' && trip.days_to_start >= 0)
  ).sort((a, b) => a.name.localeCompare(b.name, 'fi'))

  const selectedDestinationIds = new Set(
    (links || []).map((link) => link.destination_id)
  )
  if (selectedDestinationIds.size === 0 && plan.destination_id) {
    selectedDestinationIds.add(plan.destination_id)
  }

  return (
    <>
      <header className="header">
        <h1>Golfpassi Marketing Tracker</h1>
        <p>Muokkaa markkinointisuoritetta.</p>
      </header>

      <main className="container edit-plan-container">
        <nav className="nav">
          <Link href={`/calendar/day/${plan.planned_date}`}>← Päivänäkymään</Link>
          <Link href="/">Etusivu</Link>
        </nav>

        <section className="card edit-plan-card">
          <h2>Muokkaa suoritetta</h2>
          <form action={updateMarketingPlan} className="edit-plan-form">
            <input type="hidden" name="plan_id" value={id} />

            <fieldset>
              <legend>Kohteet *</legend>
              <div className="destination-checkboxes">
                {destinations.map((destination) => (
                  <label className="destination-checkbox" key={destination.key}>
                    <input
                      type="checkbox"
                      name="destination_id"
                      value={destination.key}
                      defaultChecked={selectedDestinationIds.has(destination.key)}
                    />
                    <span>
                      <strong>{destination.name}</strong>
                      <small>{destination.country}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="edit-grid">
              <label>
                <span>Päivämäärä *</span>
                <input name="planned_date" type="date" defaultValue={plan.planned_date} required />
              </label>
              <label>
                <span>Kanava *</span>
                <select name="channel" defaultValue={plan.channel} required>
                  <option value="">Valitse kanava</option>
                  {channels.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <span>Toimenpide *</span>
              <input name="title" type="text" defaultValue={plan.title} required />
            </label>

            <label>
              <span>Lisätiedot</span>
              <textarea name="notes" rows={4} defaultValue={plan.notes || ''} />
            </label>

            <div className="actions">
              <button className="button" type="submit">Tallenna muutokset</button>
              <Link className="button secondary" href={`/calendar/day/${plan.planned_date}`}>Peruuta</Link>
            </div>
          </form>
        </section>
      </main>

      <style>{`
        .edit-plan-container { max-width: 850px; }
        .edit-plan-card { padding: 26px; }
        .edit-plan-card h2 { margin-top: 0; color: var(--navy); }
        .edit-plan-form { display: grid; gap: 20px; }
        .edit-plan-form fieldset { border: 0; padding: 0; margin: 0; }
        .edit-plan-form legend, .edit-plan-form label > span { display: block; margin-bottom: 7px; color: var(--navy); font-size: 14px; font-weight: 750; }
        .edit-plan-form input, .edit-plan-form select, .edit-plan-form textarea { width: 100%; box-sizing: border-box; border: 1px solid #cbd8e3; border-radius: 10px; padding: 11px 12px; font: inherit; background: #fff; }
        .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .destination-checkboxes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; max-height: 330px; overflow-y: auto; }
        .destination-checkbox { display: flex; gap: 10px; padding: 11px 12px; border: 1px solid #dbe5ee; border-radius: 10px; background: #f8fbfd; }
        .destination-checkbox input { width: 17px; height: 17px; margin-top: 2px; }
        .destination-checkbox span { display: grid; gap: 2px; }
        .destination-checkbox small { color: #687789; }
        @media (max-width: 680px) { .edit-grid, .destination-checkboxes { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}
