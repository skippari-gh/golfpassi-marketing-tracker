import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { priorityReason } from '../../../lib/priority'
import { supabase } from '../../../lib/supabase'
import { getTripDestination } from '../../../lib/trip-destinations'
import {
  getTripsWithPriority,
  getMarketingActionsForTrip,
  getMarketingPlan,
  getChannels,
} from '../../../lib/trips'

export const dynamic = 'force-dynamic'

function parseDate(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function formatDateRange(startValue: string, endValue: string) {
  const start = parseDate(startValue)
  const end = parseDate(endValue)
  if (!start || !end) return `${startValue}–${endValue}`
  if (start.year === end.year && start.month === end.month && start.day === end.day) {
    return `${start.day}.${start.month}.${start.year}`
  }
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}.–${end.day}.${end.month}.${end.year}`
  }
  if (start.year === end.year) {
    return `${start.day}.${start.month}.–${end.day}.${end.month}.${end.year}`
  }
  return `${start.day}.${start.month}.${start.year}–${end.day}.${end.month}.${end.year}`
}

async function markPlanDone(formData: FormData) {
  'use server'

  const planId = String(formData.get('plan_id') || '')
  const destinationId = String(formData.get('destination_id') || '')
  if (!planId || !destinationId) throw new Error('Suunnitelman tunniste puuttuu.')

  const { error } = await supabase
    .from('marketing_plan')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('destination_id', destinationId)
    .is('archived_at', null)

  if (error) throw new Error(error.message)
  revalidatePath(`/destinations/${destinationId}`)
  revalidatePath('/')
}

async function updatePlanPerformance(formData: FormData) {
  'use server'

  const planId = String(formData.get('plan_id') || '')
  const destinationId = String(formData.get('destination_id') || '')
  const plannedDate = String(formData.get('planned_date') || '').trim()
  const channel = String(formData.get('channel') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!planId || !destinationId) {
    throw new Error('Suunnitelman tunniste puuttuu.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(plannedDate) || !channel || !title) {
    throw new Error('Täytä päivämäärä, kanava ja toimenpide.')
  }

  const { error } = await supabase
    .from('marketing_plan')
    .update({
      planned_date: plannedDate,
      channel,
      title,
      notes: notes || null,
    })
    .eq('id', planId)
    .eq('destination_id', destinationId)
    .is('archived_at', null)

  if (error) throw new Error(error.message)

  revalidatePath(`/destinations/${destinationId}`)
  revalidatePath('/')
}

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: destinationId } = await params
  const [allTrips, channels] = await Promise.all([
    getTripsWithPriority(),
    getChannels(),
  ])
  const departures = allTrips
    .filter((trip) => trip.destination_id === destinationId)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  if (departures.length === 0) notFound()

  const destination = getTripDestination(departures[0])
  const activeDepartures = departures.filter(
    (trip) => trip.status === 'active' && trip.days_to_start >= 0
  )
  const representativeTrip = activeDepartures[0] || departures[0]
  const [actions, marketingPlan] = representativeTrip
    ? await Promise.all([
        getMarketingActionsForTrip(representativeTrip.id),
        getMarketingPlan(representativeTrip.id),
      ])
    : [[], []]
  const priorityTrip = activeDepartures.reduce(
    (highest, trip) =>
      !highest || trip.priority_score > highest.priority_score ? trip : highest,
    activeDepartures[0]
  )
  const statusLabel = {
    planned: 'Suunniteltu',
    in_progress: 'Työn alla',
    done: 'Valmis',
    cancelled: 'Peruttu',
  } as const

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        {representativeTrip && (
          <Link href={`/actions/new?trip=${representativeTrip.id}`}>Lisää merkintä</Link>
        )}
      </nav>

      <article className="card destination-marketing-hero">
        {priorityTrip && <span className="score">Prioriteetti {priorityTrip.priority_score}</span>}
        <h1>{destination.name}</h1>
        <p>
          {departures[0].country} · {activeDepartures.length}{' '}
          {activeDepartures.length === 1 ? 'tuleva lähtö' : 'tulevaa lähtöä'}
        </p>
        {priorityTrip && (
          <>
            <p><strong>Viimeksi markkinoitu:</strong> {priorityTrip.last_marketed_at || 'ei koskaan'}</p>
            <p><strong>Käytetyt kanavat:</strong> {priorityTrip.channels_used.join(', ') || 'ei vielä yhtään'}</p>
            <p className="reason"><strong>Suositus:</strong> {priorityReason(priorityTrip)}</p>
          </>
        )}
      </article>

      <section className="departure-section">
        <div className="departure-heading">
          <div>
            <h2>Tulevat lähtöpäivät</h2>
            <p className="meta">Kaikki kohteen myynnissä olevat lähdöt.</p>
          </div>
          <span className="departure-count">
            {activeDepartures.length} {activeDepartures.length === 1 ? 'lähtö' : 'lähtöä'}
          </span>
        </div>
        <div className="departure-list">
          {activeDepartures.length === 0 ? (
            <article className="departure-row"><span>Ei tulevia lähtöjä.</span></article>
          ) : activeDepartures.map((departure) => (
            <article className="departure-row" key={departure.id}>
              <div>
                <strong>{formatDateRange(departure.start_date, departure.end_date)}</strong>
                <p className="meta">{departure.name}</p>
              </div>
              {departure.url && (
                <a className="button secondary" href={departure.url} rel="noreferrer" target="_blank">
                  Avaa matka
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="destination-section-heading">
        <div>
          <h2>Markkinointisuunnitelma</h2>
          <p className="meta">Kaikki kohteen tulevat ja valmistuneet markkinointisuoritteet.</p>
        </div>
        <Link className="button" href={`/plan/new?destination=${destinationId}`}>Lisää suoritteita</Link>
      </div>

      <div className="trips-table-wrapper">
        <table>
          <thead><tr><th>Päivä</th><th>Kanava</th><th>Otsikko</th><th>Huomiot</th><th>Tila</th><th></th></tr></thead>
          <tbody>
            {marketingPlan.length === 0 ? (
              <tr><td colSpan={6}>Ei vielä suunniteltuja markkinointisuoritteita.</td></tr>
            ) : marketingPlan.map((plan: any) => (
              <tr key={plan.id}>
                <td>{plan.planned_date}</td><td>{plan.channel}</td><td>{plan.title}</td>
                <td>{plan.notes || '-'}</td>
                <td>{statusLabel[plan.status as keyof typeof statusLabel] || plan.status}</td>
                <td>
                  <div className="plan-row-actions">
                    <details className="plan-edit-details">
                      <summary className="button secondary">Muokkaa</summary>
                      <form className="plan-edit-form" action={updatePlanPerformance}>
                        <input type="hidden" name="plan_id" value={plan.id} />
                        <input type="hidden" name="destination_id" value={destinationId} />

                        <label>
                          Päivämäärä
                          <input type="date" name="planned_date" defaultValue={plan.planned_date} required />
                        </label>

                        <label>
                          Kanava
                          <select name="channel" defaultValue={plan.channel} required>
                            {!channels.some((item) => item.name === plan.channel) && (
                              <option value={plan.channel}>{plan.channel}</option>
                            )}
                            {channels.map((item) => (
                              <option key={item.id} value={item.name}>{item.name}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Toimenpide
                          <input type="text" name="title" defaultValue={plan.title} required />
                        </label>

                        <label>
                          Huomiot
                          <textarea name="notes" defaultValue={plan.notes || ''} rows={3} />
                        </label>

                        <button className="button" type="submit">Tallenna muutokset</button>
                      </form>
                    </details>

                    {plan.status !== 'done' && plan.status !== 'cancelled' && (
                      <form action={markPlanDone}>
                        <input type="hidden" name="plan_id" value={plan.id} />
                        <input type="hidden" name="destination_id" value={destinationId} />
                        <button className="button secondary" type="submit">Merkitse valmiiksi</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="destination-section-heading">
        <div>
          <h2>Markkinointihistoria</h2>
          <p className="meta">Kaikki kohteelle tehdyt markkinointitoimet.</p>
        </div>
        {representativeTrip && (
          <Link className="button secondary" href={`/actions/new?trip=${representativeTrip.id}`}>
            Lisää tehty merkintä
          </Link>
        )}
      </div>

      <div className="trips-table-wrapper">
        <table>
          <thead><tr><th>Päivä</th><th>Kanava</th><th>Otsikko</th><th>Huomiot</th></tr></thead>
          <tbody>
            {actions.length === 0 ? (
              <tr><td colSpan={4}>Ei merkintöjä.</td></tr>
            ) : actions.map((action: any) => (
              <tr key={action.id}>
                <td>{action.action_date}</td><td>{action.channels?.name || '-'}</td>
                <td>{action.title || '-'}</td><td>{action.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
