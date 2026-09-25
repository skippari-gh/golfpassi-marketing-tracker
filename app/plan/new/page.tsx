import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../lib/supabase'
import { getMarketingPlanItems } from '../../../lib/marketing-plan'
import { groupTripsByDestination } from '../../../lib/trip-destinations'
import MarketingPlanItems from '../../components/MarketingPlanItems'
import DestinationSelector from '../../components/DestinationSelector'
import {
  getChannels,
  getTripsWithPriority,
} from '../../../lib/trips'

export const dynamic = 'force-dynamic'

type PlanPageSearchParams =
  Promise<{
    trip?: string | string[]
    destination?: string | string[]
    date?: string | string[]
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

  const destinationIds = formData
    .getAll('destination_id')
    .map((value) => String(value))
    .filter(Boolean)

  const generalMarketing = formData.get('general_marketing') === 'true'

  const planItems = getMarketingPlanItems(formData)

  const { data: representativeTrips, error: tripError } = destinationIds.length
    ? await supabase
        .from('trips')
        .select('id, destination_id, start_date')
        .in('destination_id', destinationIds)
        .eq('status', 'active')
        .gte('end_date', getToday())
        .order('start_date', { ascending: true })
    : { data: [], error: null }

  if (tripError) {
    throw new Error(tripError.message)
  }

  const tripByDestination = new Map<string, string>()

  for (const trip of representativeTrips || []) {
    if (!tripByDestination.has(trip.destination_id)) {
      tripByDestination.set(trip.destination_id, trip.id)
    }
  }

  const missingDestination = destinationIds.find(
    (destinationId) => !tripByDestination.has(destinationId)
  )

  if (missingDestination) {
    throw new Error('Jollekin valitulle kohteelle ei löytynyt tulevaa lähtöä.')
  }

  const representativeDestinationId = destinationIds[0] || null
  const representativeTripId = representativeDestinationId
    ? tripByDestination.get(representativeDestinationId) || null
    : null

  for (const item of planItems) {
    const { data: plan, error } = await supabase
      .from('marketing_plan')
      .insert({
        destination_id: representativeDestinationId,
        trip_id: representativeTripId,
        ...item,
        status: 'planned',
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const destinationLinks = destinationIds.map((destinationId) => ({
      marketing_plan_id: plan.id,
      destination_id: destinationId,
      trip_id: tripByDestination.get(destinationId),
    }))

    const { error: linkError } = destinationLinks.length
      ? await supabase
          .from('marketing_plan_destinations')
          .insert(destinationLinks)
      : { error: null }

    if (linkError) {
      await supabase
        .from('marketing_plan')
        .delete()
        .eq('id', plan.id)

      throw new Error(linkError.message)
    }
  }

  revalidatePath('/')

  for (const tripId of tripByDestination.values()) {
    revalidatePath(`/trips/${tripId}`)
  }

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

  const requestedDate =
    getSingleParam(
      resolvedSearchParams.date
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

        .destination-checkboxes {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
          max-height: 330px;
          overflow-y: auto;
          padding: 2px;
        }

        .destination-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid #dbe5ee;
          border-radius: 10px;
          background: #f8fbfd;
          cursor: pointer;
        }

        .destination-checkbox input {
          width: 17px;
          height: 17px;
          margin-top: 2px;
          accent-color: #00aaff;
        }

        .destination-checkbox span {
          display: grid;
          gap: 2px;
        }

        .destination-checkbox strong {
          color: #003c70;
          font-size: 13px;
        }

        .destination-checkbox small {
          color: #687789;
          font-size: 11px;
        }

        .selected-destinations {
          margin-top: 12px;
          padding: 12px 14px;
          border: 1px solid #c9e0ee;
          border-radius: 10px;
          background: #f3fbff;
          color: #003c70;
          font-size: 13px;
        }

        .selected-destinations > strong { display: block; margin-bottom: 6px; }
        .selected-destinations ul { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
        .selected-destinations li { padding: 4px 8px; border-radius: 999px; background: #fff; border: 1px solid #c9e0ee; }
        .selected-destinations p { margin: 0; color: #687789; }

        .trip-count {
          margin: 8px 0 0;
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

          .destination-checkboxes {
            grid-template-columns: 1fr;
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
              Yksi suorite voidaan liittää useaan kohteeseen.
              Kalenterissa se näkyy yhtenä markkinointisuoritteena.
            </p>
          </div>

          <form
            className="plan-form"
            action={
              createMarketingPlan
            }
          >
            <fieldset className="plan-items-fieldset">
              <legend>Kohteet <span className="required-mark">*</span></legend>
              <p className="plan-items-intro">
                Valitse kaikki kohteet, jotka ovat mukana tässä markkinointisuoritteessa.
              </p>
              <DestinationSelector
                destinations={destinations.map((destination) => ({
                  id: destination.key,
                  name: destination.name,
                  country: destination.country,
                  defaultChecked: destination.key === defaultDestinationId,
                }))}
              />
              <p className="trip-count">
                Valittavana {destinations.length} {destinations.length === 1 ? 'kohde' : 'kohdetta'}.
              </p>
            </fieldset>

            <MarketingPlanItems
              channelNames={channels.map((channel) => channel.name)}
              defaultDate={requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : getToday()}
            />



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
