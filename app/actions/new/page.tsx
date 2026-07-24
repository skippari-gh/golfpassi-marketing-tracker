import Link from 'next/link'
import {
  redirect,
} from 'next/navigation'
import {
  revalidatePath,
} from 'next/cache'
import {
  getChannels,
  getTripsWithPriority,
} from '../../../lib/trips'
import {
  supabase,
} from '../../../lib/supabase'

export const dynamic =
  'force-dynamic'

type NewActionSearchParams =
  Promise<{
    trip?:
      | string
      | string[]
  }>

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

async function createMarketingAction(
  formData: FormData
) {
  'use server'

  const tripId = String(
    formData.get('trip_id') ||
      ''
  )

  const channelId = String(
    formData.get(
      'channel_id'
    ) || ''
  )

  const actionDate = String(
    formData.get(
      'action_date'
    ) || ''
  )

  const title = String(
    formData.get('title') ||
      ''
  ).trim()

  const notes = String(
    formData.get('notes') ||
      ''
  ).trim()

  if (!tripId) {
    throw new Error(
      'Valitse matka.'
    )
  }

  if (!channelId) {
    throw new Error(
      'Valitse markkinointikanava.'
    )
  }

  if (!actionDate) {
    throw new Error(
      'Valitse päivämäärä.'
    )
  }

  if (!title) {
    throw new Error(
      'Kirjoita tehdyn toimenpiteen otsikko.'
    )
  }

  const { error } =
    await supabase
      .from(
        'marketing_actions'
      )
      .insert({
        trip_id: tripId,
        channel_id:
          channelId,
        action_date:
          actionDate,
        title,
        notes:
          notes || null,
      })

  if (error) {
    throw new Error(
      `Merkinnän tallennus epäonnistui: ${error.message}`
    )
  }

  revalidatePath('/')
  revalidatePath('/trips')
  revalidatePath(
    `/trips/${tripId}`
  )

  redirect(
    `/trips/${tripId}`
  )
}

export default async function NewMarketingActionPage({
  searchParams,
}: {
  searchParams:
    NewActionSearchParams
}) {
  const resolvedSearchParams =
    await searchParams

  const tripParam =
    resolvedSearchParams.trip

  const selectedTripId =
    Array.isArray(tripParam)
      ? tripParam[0]
      : tripParam || ''

  const [
    trips,
    channels,
  ] = await Promise.all([
    getTripsWithPriority(),
    getChannels(),
  ])

  const sortedTrips = [
    ...trips,
  ].sort((a, b) => {
    const dateComparison =
      a.start_date.localeCompare(
        b.start_date
      )

    if (
      dateComparison !== 0
    ) {
      return dateComparison
    }

    return a.name.localeCompare(
      b.name,
      'fi'
    )
  })

  return (
    <>
      <style>{`
        .action-page {
          min-height: 100vh;
          background: #f7fafb;
        }

        .action-header {
          border-bottom: 1px solid #dce6eb;
          background: #ffffff;
        }

        .action-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(
            920px,
            calc(100% - 40px)
          );
          min-height: 70px;
          margin: 0 auto;
          gap: 20px;
        }

        .action-brand {
          color: #003c70;
          font-size: 18px;
          font-weight: 900;
          text-decoration: none;
        }

        .action-navigation {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .action-navigation a {
          padding: 8px 11px;
          border-radius: 6px;
          color: #003c70;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
        }

        .action-navigation a:hover {
          background: #eef8fc;
        }

        .action-main {
          width: min(
            760px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding: 42px 0 70px;
        }

        .action-intro {
          margin-bottom: 24px;
        }

        .action-overline {
          margin: 0 0 7px;
          color: #03bfa5;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .action-intro h1 {
          margin: 0;
          color: #003c70;
          font-size: clamp(
            30px,
            5vw,
            44px
          );
          line-height: 1.08;
          letter-spacing: -0.035em;
        }

        .action-intro p {
          max-width: 620px;
          margin: 12px 0 0;
          color: #637888;
          font-size: 15px;
          line-height: 1.55;
        }

        .action-card {
          overflow: hidden;
          border: 1px solid #d9e3e9;
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 10px 28px
            rgba(
              0,
              60,
              112,
              0.07
            );
        }

        .action-card-top {
          height: 5px;
          background: #ff8200;
        }

        .action-form {
          display: grid;
          gap: 21px;
          padding: 28px;
        }

        .action-field {
          display: grid;
          gap: 8px;
        }

        .action-field label {
          color: #21384b;
          font-size: 13px;
          font-weight: 850;
        }

        .action-required {
          color: #cf3c30;
        }

        .action-field select,
        .action-field input,
        .action-field textarea {
          width: 100%;
          border: 1px solid #bdccd5;
          border-radius: 8px;
          background: #ffffff;
          color: #21384b;
          font: inherit;
          font-size: 15px;
          outline: none;
          transition:
            border-color 140ms ease,
            box-shadow 140ms ease;
        }

        .action-field select,
        .action-field input {
          min-height: 46px;
          padding: 9px 12px;
        }

        .action-field textarea {
          min-height: 130px;
          padding: 12px;
          line-height: 1.5;
          resize: vertical;
        }

        .action-field select:focus,
        .action-field input:focus,
        .action-field textarea:focus {
          border-color: #00aaff;
          box-shadow:
            0 0 0 3px
            rgba(
              0,
              170,
              255,
              0.13
            );
        }

        .action-help {
          margin: 0;
          color: #758794;
          font-size: 12px;
          line-height: 1.45;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 4px;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 9px 18px;
          border: 1px solid #ff8200;
          border-radius: 999px;
          background: #ff8200;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          line-height: 1;
          text-decoration: none;
          cursor: pointer;
        }

        .action-button:hover {
          border-color: #e87300;
          background: #e87300;
        }

        .action-button.secondary {
          border-color: #b9cbd6;
          background: #ffffff;
          color: #003c70;
        }

        .action-button.secondary:hover {
          border-color: #00aaff;
          background: #eef8fc;
        }

        @media (
          max-width: 640px
        ) {
          .action-header-inner {
            align-items: flex-start;
            flex-direction: column;
            padding: 16px 0;
          }

          .action-form {
            padding: 21px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="action-page">
        <header className="action-header">
          <div className="action-header-inner">
            <Link
              className="action-brand"
              href="/"
            >
              Golfpassi Marketing
              Tracker
            </Link>

            <nav className="action-navigation">
              <Link href="/">
                Etusivu
              </Link>

              <Link href="/trips">
                Matkat
              </Link>

              <Link href="/plan/new">
                Suunnittele
              </Link>
            </nav>
          </div>
        </header>

        <main className="action-main">
          <div className="action-intro">
            <p className="action-overline">
              Markkinointihistoria
            </p>

            <h1>
              Lisää tehty merkintä
            </h1>

            <p>
              Tallenna toteutettu
              markkinointitoimi. Merkintä
              näkyy matkan historiassa ja
              vaikuttaa matkan
              markkinointipisteytykseen.
            </p>
          </div>

          <section className="action-card">
            <div className="action-card-top" />

            <form
              className="action-form"
              action={
                createMarketingAction
              }
            >
              <div className="action-field">
                <label htmlFor="trip_id">
                  Matka{' '}
                  <span className="action-required">
                    *
                  </span>
                </label>

                <select
                  id="trip_id"
                  name="trip_id"
                  defaultValue={
                    selectedTripId
                  }
                  required
                >
                  <option value="">
                    Valitse matka
                  </option>

                  {sortedTrips.map(
                    (trip) => (
                      <option
                        key={trip.id}
                        value={trip.id}
                      >
                        {trip.name}
                        {' – '}
                        {trip.start_date}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="action-field">
                <label htmlFor="channel_id">
                  Markkinointikanava{' '}
                  <span className="action-required">
                    *
                  </span>
                </label>

                <select
                  id="channel_id"
                  name="channel_id"
                  defaultValue=""
                  required
                >
                  <option value="">
                    Valitse kanava
                  </option>

                  {channels.map(
                    (channel) => (
                      <option
                        key={
                          channel.id
                        }
                        value={
                          channel.id
                        }
                      >
                        {
                          channel.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="action-field">
                <label htmlFor="action_date">
                  Päivämäärä{' '}
                  <span className="action-required">
                    *
                  </span>
                </label>

                <input
                  id="action_date"
                  name="action_date"
                  type="date"
                  defaultValue={
                    getToday()
                  }
                  required
                />
              </div>

              <div className="action-field">
                <label htmlFor="title">
                  Mitä tehtiin?{' '}
                  <span className="action-required">
                    *
                  </span>
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Esimerkiksi uutiskirje, Facebook-julkaisu tai bannerikampanja"
                  required
                />
              </div>

              <div className="action-field">
                <label htmlFor="notes">
                  Huomiot
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Lisätietoja sisällöstä, kampanjasta tai tuloksista"
                />

                <p className="action-help">
                  Huomiot ovat vapaaehtoisia.
                </p>
              </div>

              <div className="action-buttons">
                <button
                  className="action-button"
                  type="submit"
                >
                  Tallenna merkintä
                </button>

                <Link
                  className="action-button secondary"
                  href={
                    selectedTripId
                      ? `/trips/${selectedTripId}`
                      : '/trips'
                  }
                >
                  Peruuta
                </Link>
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  )
}