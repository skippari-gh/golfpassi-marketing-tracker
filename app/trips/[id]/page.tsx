import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { priorityReason } from '../../../lib/priority'
import { supabase } from '../../../lib/supabase'
import {
  getTripsWithPriority,
  getMarketingActionsForTrip,
  getMarketingPlan,
} from '../../../lib/trips'
import { getTripDestination } from '../../../lib/trip-destinations'

export const dynamic = 'force-dynamic'

type ParsedDate = {
  day: number
  month: number
  year: number
}

function parseDate(
  value?: string | null
): ParsedDate | null {
  if (!value) {
    return null
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  )

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function formatDateRange(
  startValue: string,
  endValue: string
) {
  const start = parseDate(startValue)
  const end = parseDate(endValue)

  if (!start || !end) {
    return `${startValue}–${endValue}`
  }

  if (
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day
  ) {
    return `${start.day}.${start.month}.${start.year}`
  }

  if (
    start.year === end.year &&
    start.month === end.month
  ) {
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

  const [allTrips, actions, marketingPlan] = await Promise.all([
    getTripsWithPriority(),
    getMarketingActionsForTrip(id),
    getMarketingPlan(id),
  ])

  const trip = allTrips.find(
    (item) => item.id === id
  )

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

  const destination =
    getTripDestination(trip)

  const departureTrips = allTrips
    .filter(
      (item) =>
        item.status === 'active' &&
        item.days_to_start >= 0 &&
        getTripDestination(item).key ===
          destination.key
    )
    .sort((a, b) => {
      const startComparison =
        a.start_date.localeCompare(
          b.start_date
        )

      if (startComparison !== 0) {
        return startComparison
      }

      return a.end_date.localeCompare(
        b.end_date
      )
    })

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

        <h1>{destination.name}</h1>

        <p>
          {trip.country} ·{' '}
          {departureTrips.length}{' '}
          {departureTrips.length === 1
            ? 'tuleva lähtö'
            : 'tulevaa lähtöä'}
        </p>

        <h2 className="selected-departure-title">
          {trip.name}
        </h2>

        <p>
          <strong>Valittu lähtö:</strong>{' '}
          {formatDateRange(
            trip.start_date,
            trip.end_date
          )}
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

      <section className="departure-section">
        <div className="departure-heading">
          <div>
            <h2>Lähtöpäivät</h2>

            <p className="meta">
              Valitse lähtö nähdäksesi sen suunnitelman ja
              markkinointihistorian.
            </p>
          </div>

          <span className="departure-count">
            {departureTrips.length}{' '}
            {departureTrips.length === 1
              ? 'lähtö'
              : 'lähtöä'}
          </span>
        </div>

        <div className="departure-list">
          {departureTrips.map((departure) => {
            const isSelected = departure.id === trip.id

            return (
              <article
                className={`departure-row${
                  isSelected ? ' selected' : ''
                }`}
                key={departure.id}
              >
                <div>
                  <strong>
                    {formatDateRange(
                      departure.start_date,
                      departure.end_date
                    )}
                  </strong>

                  <p className="meta">
                    {departure.name}
                  </p>
                </div>

                {isSelected ? (
                  <span className="departure-selected">
                    Valittu lähtö
                  </span>
                ) : (
                  <Link
                    className="button secondary"
                    href={`/trips/${departure.id}`}
                  >
                    Avaa lähtö
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      </section>

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
          Lisää suoritteita
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
