import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { priorityReason } from '../../../lib/priority'
import { supabase } from '../../../lib/supabase'
import {
  getTripWithPriority,
  getMarketingActionsForTrip,
  getMarketingPlan,
} from '../../../lib/trips'

export const dynamic = 'force-dynamic'

async function markPlanDone(formData: FormData) {
  'use server'

  const planId = String(formData.get('plan_id') || '')
  const tripId = String(formData.get('trip_id') || '')

  if (!planId || !tripId) {
    throw new Error('Suunnitelman tunniste puuttuu.')
  }

  const { error } = await supabase
    .from('marketing_plan')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .is('archived_at', null)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/trips/${tripId}`)
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [trip, actions, marketingPlan] = await Promise.all([
    getTripWithPriority(id),
    getMarketingActionsForTrip(id),
    getMarketingPlan(id),
  ])

  if (!trip) {
    return (
      <main className="container">
        <p>Matkaa ei löytynyt.</p>

        <Link className="button" href="/trips">
          Takaisin matkoihin
        </Link>
      </main>
    )
  }

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
        <Link href={`/actions/new?trip=${trip.id}`}>
          Lisää merkintä
        </Link>
      </nav>

      <article className="card">
        <span className="score">
          Prioriteetti {trip.priority_score}
        </span>

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

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginTop: '32px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px' }}>
            Markkinointisuunnitelma
          </h2>

          <p className="meta" style={{ margin: 0 }}>
            Tulevat ja valmistuneet markkinointitehtävät tälle matkalle.
          </p>
        </div>

        <Link
          className="button"
          href={`/trips/${trip.id}/plan/new`}
          style={{ flexShrink: 0 }}
        >
          Lisää suunniteltu julkaisu
        </Link>
      </div>

      <table>
        <thead>
          <tr>
            <th>Päivä</th>
            <th>Kanava</th>
            <th>Otsikko</th>
            <th>Huomiot</th>
            <th>Tila</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {marketingPlan.length === 0 ? (
            <tr>
              <td colSpan={6}>
                Ei vielä suunniteltuja markkinointitehtäviä.
              </td>
            </tr>
          ) : (
            marketingPlan.map((plan: any) => (
              <tr key={plan.id}>
                <td>{plan.planned_date}</td>
                <td>{plan.channel}</td>
                <td>{plan.title}</td>
                <td>{plan.notes || '-'}</td>
                <td>
                  {statusLabel[
                    plan.status as keyof typeof statusLabel
                  ] || plan.status}
                </td>
                <td>
                  {plan.status !== 'done' &&
                    plan.status !== 'cancelled' && (
                      <form action={markPlanDone}>
                        <input
                          type="hidden"
                          name="plan_id"
                          value={plan.id}
                        />

                        <input
                          type="hidden"
                          name="trip_id"
                          value={trip.id}
                        />

                        <button
                          className="button secondary"
                          type="submit"
                        >
                          Merkitse valmiiksi
                        </button>
                      </form>
                    )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: '32px' }}>
        Markkinointihistoria
      </h2>

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
