import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../lib/supabase'
import { getMarketingPlanItems } from '../../../lib/marketing-plan'
import { groupTripsByDestination } from '../../../lib/trip-destinations'
import MarketingPlanItems from '../../components/MarketingPlanItems'
import {
  getChannels,
  getTripsWithPriority,
} from '../../../lib/trips'

export const dynamic = 'force-dynamic'

type PlanPageSearchParams =
  Promise<{
    trip?: string | string[]
    destination?: string | string[]
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

async function createMarketingPlan(
  formData: FormData
) {
  'use server'

  const destinationId = String(
    formData.get('destination_id') || ''
  )

  const createdBy = String(
    formData.get(
      'created_by'
    ) || ''
  ).trim()

  if (!destinationId) {
    throw new Error(
      'Valitse kohde.'
    )
  }

  if (!createdBy) {
    throw new Error(
      'Kirjoita suunnittelijan nimi.'
    )
  }

  const planItems = getMarketingPlanItems(formData)

  const {
    data: representativeTrip,
    error: tripError,
  } = await supabase
    .from('trips')
    .select('id')
    .eq('destination_id', destinationId)
    .eq('status', 'active')
    .gte('end_date', getToday())
    .order('start_date', {
      ascending: true,
    })
    .limit(1)
    .single()

  if (tripError || !representativeTrip) {
    throw new Error(
      'Kohteelle ei löytynyt tulevaa lähtöä.'
    )
  }

  const { error } = await supabase
    .from('marketing_plan')
    .insert(
      planItems.map((item) => ({
        destination_id: destinationId,
        trip_id: representativeTrip.id,
        ...item,
        status: 'planned',
        created_by: createdBy,
      }))
    )

  if (error) {
    throw new Error(
      error.message
    )
  }

  revalidatePath('/')
  revalidatePath(
    `/trips/${representativeTrip.id}`
  )

  const selectedMonth =
    planItems
      .map((item) => item.planned_date)
      .sort()[0]
      .slice(0, 7)

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

  const requestedDestinationId =
    getSingleParam(
      resolvedSearchParams.destination
    )

  const [allTrips, channels] =
    await Promise.all([
      getTripsWithPriority(),
      getChannels(),
    ])

  const destinations =
    groupTripsByDestination(
      allTrips.filter(
        (trip) =>
          trip.status === 'active' &&
          trip.days_to_start >= 0
      )
    ).sort((a, b) =>
      a.name.localeCompare(
        b.name,
        'fi'
      )
    )

  const requestedDestination =
    destinations.find(
      (destination) =>
        destination.key === requestedDestinationId ||
        destination.trips.some(
          (trip) =>
            trip.id === requestedTripId
        )
    )

  const defaultDestinationId =
    requestedDestination
      ?.key || ''

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
              Kaikki suoritukset näkyvät etusivun
              markkinointikalenterissa saman kohteen kortilla.
            </p>
          </div>

          <form
            className="plan-form"
            action={
              createMarketingPlan
            }
          >
            <div className="plan-field">
              <label htmlFor="destination_id">
                Kohde{' '}
                <span className="required-mark">
                  *
                </span>
              </label>

              <select
                id="destination_id"
                name="destination_id"
                defaultValue={
                  defaultDestinationId
                }
                required
              >
                <option value="">
                  Valitse kohde
                </option>

                {destinations.map((destination) => (
                  <option
                    key={destination.key}
                    value={destination.key}
                  >
                    {destination.name} ·{' '}
                    {destination.country}
                  </option>
                ))}
              </select>

              <p className="trip-count">
                Valittavana{' '}
                {destinations.length}{' '}
                {destinations.length === 1
                  ? 'kohde'
                  : 'kohdetta'}.
                Lähtöpäivät eivät näy valinnassa.
              </p>
            </div>

            <MarketingPlanItems
              channelNames={channels.map((channel) => channel.name)}
              defaultDate={getToday()}
            />

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
