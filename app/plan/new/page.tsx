import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../lib/supabase'
import {
  getChannels,
  getTripsWithPriority,
} from '../../../lib/trips'

export const dynamic = 'force-dynamic'

type PlanPageSearchParams =
  Promise<{
    trip?: string | string[]
  }>

function getSingleParam(
  value:
    | string
    | string[]
    | undefined
) {
  return Array.isArray(value)
    ? value[0]
    : value
}

function getToday() {
  return new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone:
        'Europe/Helsinki',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  ).format(new Date())
}

function formatTripDate(
  dateValue: string
) {
  const date = new Date(
    `${dateValue}T12:00:00`
  )

  if (
    Number.isNaN(date.getTime())
  ) {
    return dateValue
  }

  return new Intl.DateTimeFormat(
    'fi-FI',
    {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }
  ).format(date)
}

function getTripGroup(
  trip: {
    status: string
    days_to_start: number
  }
) {
  const isActive =
    trip.status === 'active'

  const isFuture =
    trip.days_to_start >= 0

  if (isActive && isFuture) {
    return 0
  }

  if (isActive && !isFuture) {
    return 1
  }

  if (!isActive && isFuture) {
    return 2
  }

  return 3
}

function getTripStatusLabel(
  trip: {
    status: string
    days_to_start: number
  }
) {
  if (
    trip.status === 'active' &&
    trip.days_to_start >= 0
  ) {
    return 'aktiivinen'
  }

  if (
    trip.status === 'active' &&
    trip.days_to_start < 0
  ) {
    return 'päättynyt'
  }

  if (
    trip.status !== 'active' &&
    trip.days_to_start >= 0
  ) {
    return 'passiivinen'
  }

  return 'passiivinen, päättynyt'
}

async function createMarketingPlan(
  formData: FormData
) {
  'use server'

  const tripId = String(
    formData.get('trip_id') || ''
  )

  const plannedDate = String(
    formData.get(
      'planned_date'
    ) || ''
  )

  const channel = String(
    formData.get('channel') || ''
  ).trim()

  const title = String(
    formData.get('title') || ''
  ).trim()

  const notes = String(
    formData.get('notes') || ''
  ).trim()

  const createdBy = String(
    formData.get(
      'created_by'
    ) || ''
  ).trim()

  if (!tripId) {
    throw new Error(
      'Valitse matka.'
    )
  }

  if (!plannedDate) {
    throw new Error(
      'Valitse suunniteltu päivämäärä.'
    )
  }

  if (!channel) {
    throw new Error(
      'Valitse markkinointikanava.'
    )
  }

  if (!title) {
    throw new Error(
      'Kirjoita suunniteltu markkinointitoimi.'
    )
  }

  if (!createdBy) {
    throw new Error(
      'Kirjoita suunnittelijan nimi.'
    )
  }

  const { error } = await supabase
    .from('marketing_plan')
    .insert({
      trip_id: tripId,
      planned_date:
        plannedDate,
      channel,
      title,
      notes: notes || null,
      status: 'planned',
      created_by: createdBy,
    })

  if (error) {
    throw new Error(
      error.message
    )
  }

  revalidatePath('/')
  revalidatePath(
    `/trips/${tripId}`
  )

  const selectedMonth =
    plannedDate.slice(0, 7)

  redirect(
    `/?month=${selectedMonth}&view=planned`
  )
}

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams:
    PlanPageSearchParams
}) {
  const resolvedSearchParams =
    await searchParams

  const requestedTripId =
    getSingleParam(
      resolvedSearchParams.trip
    )

  const [allTrips, channels] =
    await Promise.all([
      getTripsWithPriority(),
      getChannels(),
    ])

  /*
   * Kaikki matkat ovat mukana.
   * Aktiiviset tulevat matkat
   * näytetään listan alussa.
   */
  const trips = [
    ...allTrips,
  ].sort((a, b) => {
    const groupDifference =
      getTripGroup(a) -
      getTripGroup(b)

    if (
      groupDifference !== 0
    ) {
      return groupDifference
    }

    return a.start_date.localeCompare(
      b.start_date
    )
  })

  const selectedTripExists =
    trips.some(
      (trip) =>
        trip.id ===
        requestedTripId
    )

  const defaultTripId =
    selectedTripExists
      ? requestedTripId
      : ''

  return (
    <>
      <style>{`
        .plan-container {
          max-width: 850px;
        }

        .plan-card {
          background: #ffffff;
          border: 1px solid #dbe5ee;
          border-radius: 18px;
          padding: 26px;
          box-shadow:
            0 8px 24px
            rgba(0, 60, 112, 0.06);
        }

        .plan-heading {
          margin-bottom: 24px;
        }

        .plan-heading h2 {
          margin: 0 0 7px;
          color: #003c70;
        }

        .plan-heading p {
          margin: 0;
        }

        .plan-form {
          display: grid;
          gap: 20px;
        }

        .plan-form-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(210px, 0.45fr);
          gap: 18px;
        }

        .plan-field {
          display: grid;
          gap: 7px;
        }

        .plan-field label {
          color: #003c70;
          font-size: 14px;
          font-weight: 750;
        }

        .plan-field input,
        .plan-field select,
        .plan-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd8e3;
          border-radius: 10px;
          background: #ffffff;
          color: #132235;
          font: inherit;
          padding: 11px 12px;
        }

        .plan-field textarea {
          min-height: 120px;
          resize: vertical;
        }

        .plan-field input:focus,
        .plan-field select:focus,
        .plan-field textarea:focus {
          border-color: #00aaff;
          outline:
            3px solid
            rgba(0, 170, 255, 0.14);
        }

        .required-mark {
          color: #c9252d;
        }

        .plan-help {
          margin: 0;
          color: #687789;
          font-size: 12px;
          line-height: 1.4;
        }

        .plan-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 4px;
        }

        .trip-count {
          margin: 0;
          color: #687789;
          font-size: 12px;
        }

        @media (
          max-width: 680px
        ) {
          .plan-form-grid {
            grid-template-columns:
              1fr;
          }

          .plan-card {
            padding: 20px;
          }
        }
      `}</style>

      <header className="header">
        <h1>
          Golfpassi Marketing Tracker
        </h1>

        <p>
          Lisää tuleva
          markkinointitoimi
          kalenteriin.
        </p>
      </header>

      <main className="container plan-container">
        <nav className="nav">
          <Link href="/">
            Etusivu
          </Link>

          <Link href="/trips">
            Matkat
          </Link>

          <Link href="/actions/new">
            Lisää tehty merkintä
          </Link>
        </nav>

        <section className="plan-card">
          <div className="plan-heading">
            <h2>
              Suunnittele markkinointia
            </h2>

            <p className="meta">
              Merkintä näkyy etusivun
              markkinointikalenterissa.
            </p>
          </div>

          <form
            className="plan-form"
            action={
              createMarketingPlan
            }
          >
            <div className="plan-field">
              <label htmlFor="trip_id">
                Matka{' '}
                <span className="required-mark">
                  *
                </span>
              </label>

              <select
                id="trip_id"
                name="trip_id"
                defaultValue={
                  defaultTripId
                }
                required
              >
                <option value="">
                  Valitse matka
                </option>

                {trips.map((trip) => (
                  <option
                    key={trip.id}
                    value={trip.id}
                  >
                    {trip.name} ·{' '}
                    {trip.country} ·{' '}
                    {formatTripDate(
                      trip.start_date
                    )}{' '}
                    ·{' '}
                    {getTripStatusLabel(
                      trip
                    )}
                  </option>
                ))}
              </select>

              <p className="trip-count">
                Valittavana{' '}
                {trips.length} matkaa.
                Mukana ovat aktiiviset,
                passiiviset ja päättyneet
                matkat.
              </p>
            </div>

            <div className="plan-form-grid">
              <div className="plan-field">
                <label htmlFor="planned_date">
                  Suunniteltu
                  päivämäärä{' '}
                  <span className="required-mark">
                    *
                  </span>
                </label>

                <input
                  id="planned_date"
                  name="planned_date"
                  type="date"
                  defaultValue={
                    getToday()
                  }
                  required
                />
              </div>

              <div className="plan-field">
                <label htmlFor="channel">
                  Kanava{' '}
                  <span className="required-mark">
                    *
                  </span>
                </label>

                <select
                  id="channel"
                  name="channel"
                  defaultValue=""
                  required
                >
                  <option value="">
                    Valitse kanava
                  </option>

                  {channels.map(
                    (channel) => (
                      <option
                        key={channel.id}
                        value={
                          channel.name
                        }
                      >
                        {channel.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="plan-field">
              <label htmlFor="title">
                Suunniteltu
                toimenpide{' '}
                <span className="required-mark">
                  *
                </span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="Esimerkiksi Facebook-postaus, uutiskirjenosto tai bannerikampanja"
                required
              />

              <p className="plan-help">
                Kirjoita lyhyesti,
                mitä aiotaan julkaista
                tai tehdä.
              </p>
            </div>

            <div className="plan-field">
              <label htmlFor="notes">
                Lisätiedot
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Sisältöidea, kampanjan tavoite, aineistot tai muut huomioitavat asiat"
              />
            </div>

            <div className="plan-field">
              <label htmlFor="created_by">
                Suunnittelija{' '}
                <span className="required-mark">
                  *
                </span>
              </label>

              <input
                id="created_by"
                name="created_by"
                type="text"
                placeholder="Oma nimi"
                required
              />
            </div>

            <div className="plan-actions">
              <button
                className="button"
                type="submit"
              >
                Lisää kalenteriin
              </button>

              <Link
                className="button secondary"
                href="/"
              >
                Peruuta
              </Link>
            </div>
          </form>
        </section>
      </main>
    </>
  )
}