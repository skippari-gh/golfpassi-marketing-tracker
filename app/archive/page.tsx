import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import ConfirmActionButton from '../components/ConfirmActionButton'
import { restoreEntity } from '../../lib/archive'
import { supabaseAdmin } from '../../lib/supabase-admin'

export const dynamic = 'force-dynamic'

type ArchivedRow = Record<string, unknown> & {
  id: string
  archived_at: string
  trip_id?: string | null
}

type ArchiveEvent = {
  id: string
  entity_type:
    | 'marketing_action'
    | 'marketing_plan'
    | 'marketing_request'
  entity_id: string
  action: 'archived' | 'restored'
  snapshot: Record<string, unknown>
  created_at: string
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return ''
}

function getItemTitle(
  type: 'plan' | 'action' | 'request',
  row: Record<string, unknown>
) {
  if (type === 'request') {
    return firstText(
      row.request_text,
      row.title
    ) || 'Markkinointitoive'
  }

  return firstText(
    row.title,
    row.action,
    row.action_type,
    row.content_type
  ) ||
    (type === 'plan'
      ? 'Suunniteltu markkinointitoimi'
      : 'Tehty markkinointimerkintä')
}

function getItemDate(
  type: 'plan' | 'action' | 'request',
  row: Record<string, unknown>
) {
  if (type === 'plan') {
    return firstText(row.planned_date)
  }

  if (type === 'action') {
    return firstText(row.action_date)
  }

  return firstText(row.desired_date, row.created_at)
}

function getEventEntityType(
  value: ArchiveEvent['entity_type']
) {
  if (value === 'marketing_plan') {
    return 'Suunnitelma'
  }

  if (value === 'marketing_action') {
    return 'Tehty merkintä'
  }

  return 'Markkinointitoive'
}

async function restoreArchivedItem(
  formData: FormData
) {
  'use server'

  const archiveItemId = String(
    formData.get('archive_item_id') || ''
  )

  if (!archiveItemId) {
    throw new Error('Palautettavan kohteen tunniste puuttuu.')
  }

  const restored = await restoreEntity(
    archiveItemId
  )

  revalidatePath('/')
  revalidatePath('/archive')

  if (restored.tripId) {
    revalidatePath(`/trips/${restored.tripId}`)
  }
}

export default async function ArchivePage() {
  const [
    actionsResult,
    plansResult,
    requestsResult,
    tripsResult,
    eventsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('marketing_actions')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false }),
    supabaseAdmin
      .from('marketing_plan')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false }),
    supabaseAdmin
      .from('marketing_requests')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false }),
    supabaseAdmin
      .from('trips')
      .select('id, name, country'),
    supabaseAdmin
      .from('archive_events')
      .select(
        'id, entity_type, entity_id, action, snapshot, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const queryError = [
    actionsResult.error,
    plansResult.error,
    requestsResult.error,
    tripsResult.error,
    eventsResult.error,
  ].find(Boolean)

  if (queryError) {
    throw new Error(queryError.message)
  }

  const tripById = new Map(
    (tripsResult.data || []).map((trip) => [
      trip.id,
      trip,
    ])
  )

  const groups = [
    {
      type: 'plan' as const,
      title: 'Suunnitelmat',
      rows: (plansResult.data || []) as ArchivedRow[],
    },
    {
      type: 'action' as const,
      title: 'Tehdyt merkinnät',
      rows: (actionsResult.data || []) as ArchivedRow[],
    },
    {
      type: 'request' as const,
      title: 'Markkinointitoiveet',
      rows: (requestsResult.data || []) as ArchivedRow[],
    },
  ]

  const archivedCount = groups.reduce(
    (count, group) => count + group.rows.length,
    0
  )

  const events = (eventsResult.data || []) as ArchiveEvent[]

  return (
    <main className="container archive-page">
      <nav className="nav">
        <Link href="/">Etusivu</Link>
        <Link href="/trips">Matkat</Link>
        <Link href="/sync-status">Synkronointi</Link>
      </nav>

      <div className="archive-heading">
        <div>
          <p className="archive-overline">Säilytetyt tiedot</p>
          <h1>Arkisto</h1>
          <p className="meta">
            Arkistoidut kohteet eivät näy aktiivisessa kalenterissa,
            toivelistassa tai prioriteettilaskennassa. Ne voi palauttaa
            ilman että historia, keskustelut tai liitteet katoavat.
          </p>
        </div>

        <span className="archive-count">
          {archivedCount} arkistossa
        </span>
      </div>

      {archivedCount === 0 ? (
        <section className="card archive-empty">
          <h2>Arkisto on tyhjä</h2>
          <p className="meta">
            Arkistoidut suunnitelmat, tehdyt merkinnät ja toiveet
            ilmestyvät tänne.
          </p>
        </section>
      ) : (
        groups.map((group) =>
          group.rows.length > 0 ? (
            <section className="archive-section" key={group.type}>
              <h2>{group.title}</h2>

              <div className="grid">
                {group.rows.map((row) => {
                  const trip = row.trip_id
                    ? tripById.get(row.trip_id)
                    : null

                  return (
                    <article className="card" key={row.id}>
                      <span className="archive-tag">Arkistoitu</span>
                      <h3>{getItemTitle(group.type, row)}</h3>

                      {trip && (
                        <p className="meta">
                          {trip.name} · {trip.country}
                        </p>
                      )}

                      {getItemDate(group.type, row) && (
                        <p className="meta">
                          Kohteen päivä: {getItemDate(group.type, row)}
                        </p>
                      )}

                      <p className="meta">
                        Arkistoitu {formatDateTime(row.archived_at)}
                      </p>

                      <div className="actions">
                        {group.type === 'request' && (
                          <Link
                            className="button secondary"
                            href={`/requests/${row.id}`}
                          >
                            Avaa keskustelu
                          </Link>
                        )}

                        <ConfirmActionButton
                          action={restoreArchivedItem}
                          itemId={`${group.type}-${row.id}`}
                          fieldName="archive_item_id"
                          label="Palauta"
                          confirmMessage="Palautetaanko kohde takaisin aktiivisiin näkymiin?"
                          buttonClassName="button"
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null
        )
      )}

      <section className="archive-section">
        <h2>Muutoshistoria</h2>

        {events.length === 0 ? (
          <p className="card meta">Muutoksia ei ole vielä kirjattu.</p>
        ) : (
          <div className="archive-history card">
            {events.map((event) => {
              const type =
                event.entity_type === 'marketing_plan'
                  ? 'plan'
                  : event.entity_type === 'marketing_action'
                    ? 'action'
                    : 'request'

              return (
                <div className="archive-history-row" key={event.id}>
                  <div>
                    <strong>
                      {event.action === 'archived'
                        ? 'Arkistoitu'
                        : 'Palautettu'}
                    </strong>{' '}
                    · {getEventEntityType(event.entity_type)}
                    <p className="meta">
                      {getItemTitle(type, event.snapshot)}
                    </p>
                  </div>

                  <time dateTime={event.created_at}>
                    {formatDateTime(event.created_at)}
                  </time>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
