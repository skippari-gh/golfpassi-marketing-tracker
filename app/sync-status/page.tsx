import Link from 'next/link'
import { supabaseAdmin } from '../../lib/supabase-admin'

export const dynamic = 'force-dynamic'

type SyncRun = {
  id: string
  status: 'running' | 'success' | 'failed'
  started_at: string
  finished_at: string | null
  found_count: number | null
  added_count: number | null
  updated_count: number | null
  missing_count: number | null
  error_message: string | null
}

const FRESHNESS_LIMIT_MS =
  30 * 60 * 60 * 1000

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return '–'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'fi-FI',
    {
      timeZone: 'Europe/Helsinki',
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(date)
}

function formatDuration(
  run: SyncRun
) {
  if (!run.finished_at) {
    return 'kesken'
  }

  const duration =
    new Date(
      run.finished_at
    ).getTime() -
    new Date(
      run.started_at
    ).getTime()

  if (
    !Number.isFinite(duration) ||
    duration < 0
  ) {
    return '–'
  }

  if (duration < 1000) {
    return '< 1 s'
  }

  if (duration < 60_000) {
    return `${Math.round(
      duration / 1000
    )} s`
  }

  return `${Math.round(
    duration / 60_000
  )} min`
}

function countValue(
  value: number | null
) {
  return value ?? '–'
}

export default async function SyncStatusPage() {
  const { data, error } =
    await supabaseAdmin
      .from('trip_sync_runs')
      .select(
        'id, status, started_at, finished_at, found_count, added_count, updated_count, missing_count, error_message'
      )
      .order('started_at', {
        ascending: false,
      })
      .limit(20)

  const runs =
    (data || []) as SyncRun[]

  const latestRun =
    runs[0] || null

  const latestSuccess =
    runs.find(
      (run) =>
        run.status === 'success'
    ) || null

  const latestFailure =
    runs.find(
      (run) =>
        run.status === 'failed'
    ) || null

  const latestSuccessTime =
    latestSuccess?.finished_at ||
    latestSuccess?.started_at ||
    null

  const isFresh =
    latestSuccessTime
      ? Date.now() -
          new Date(
            latestSuccessTime
          ).getTime() <=
        FRESHNESS_LIMIT_MS
      : false

  const isStuck =
    latestRun?.status ===
      'running' &&
    Date.now() -
      new Date(
        latestRun.started_at
      ).getTime() >
      15 * 60 * 1000

  let statusClass =
    'sync-status warning'
  let statusTitle =
    'Ensimmäistä ajoa odotetaan'
  let statusText =
    'Ajohistoriassa ei ole vielä onnistunutta synkronointia.'

  if (error) {
    statusClass =
      'sync-status error'
    statusTitle =
      'Valvontatietoja ei voitu lukea'
    statusText = error.message
  } else if (
    latestRun?.status ===
    'failed'
  ) {
    statusClass =
      'sync-status error'
    statusTitle =
      'Viimeisin synkronointi epäonnistui'
    statusText =
      latestRun.error_message ||
      'Ajosta ei tallentunut tarkempaa virheilmoitusta.'
  } else if (isStuck) {
    statusClass =
      'sync-status error'
    statusTitle =
      'Synkronointi näyttää keskeytyneen'
    statusText =
      'Ajo on ollut käynnissä yli 15 minuuttia.'
  } else if (
    latestRun?.status ===
    'running'
  ) {
    statusClass =
      'sync-status running'
    statusTitle =
      'Synkronointi on käynnissä'
    statusText =
      'Matkoja luetaan parhaillaan Golfpassin sivuilta.'
  } else if (isFresh) {
    statusClass =
      'sync-status success'
    statusTitle =
      'Synkronointi toimii normaalisti'
    statusText =
      'Viimeisin päivittäinen ajo onnistui alle 30 tuntia sitten.'
  } else if (latestSuccess) {
    statusClass =
      'sync-status warning'
    statusTitle =
      'Synkronointi on myöhässä'
    statusText =
      'Viimeisestä onnistuneesta ajosta on yli 30 tuntia.'
  }

  return (
    <>
      <style>{`
        .sync-page {
          min-height: 100vh;
          background: #f5f8fa;
          color: #263b4b;
        }

        .sync-header {
          border-bottom: 1px solid #dce5eb;
          background: #ffffff;
        }

        .sync-header-inner,
        .sync-main {
          width: min(1080px, calc(100% - 40px));
          margin: 0 auto;
        }

        .sync-header-inner {
          display: flex;
          min-height: 70px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .sync-brand {
          color: #003c70;
          font-size: 18px;
          font-weight: 900;
          text-decoration: none;
        }

        .sync-main {
          padding: 42px 0 80px;
        }

        .sync-heading {
          margin-bottom: 24px;
        }

        .sync-heading h1 {
          margin: 0 0 8px;
          color: #003c70;
          font-size: clamp(30px, 5vw, 46px);
        }

        .sync-heading p {
          margin: 0;
          color: #6d7e8b;
        }

        .sync-status {
          margin-bottom: 22px;
          padding: 22px 24px;
          border: 1px solid;
          border-radius: 14px;
          background: #ffffff;
        }

        .sync-status.success {
          border-color: #79c49a;
          background: #effaf3;
        }

        .sync-status.warning,
        .sync-status.running {
          border-color: #efbd72;
          background: #fff8ec;
        }

        .sync-status.error {
          border-color: #df8d92;
          background: #fff0f1;
        }

        .sync-status h2 {
          margin: 0 0 6px;
          color: #003c70;
          font-size: 21px;
        }

        .sync-status p {
          margin: 0;
          overflow-wrap: anywhere;
        }

        .sync-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 28px;
        }

        .sync-metric,
        .sync-panel {
          border: 1px solid #dce5eb;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 60, 112, 0.06);
        }

        .sync-metric {
          padding: 20px;
        }

        .sync-metric span {
          display: block;
          margin-bottom: 8px;
          color: #6d7e8b;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .sync-metric strong {
          color: #003c70;
          font-size: 32px;
        }

        .sync-panel {
          margin-bottom: 24px;
          padding: 24px;
        }

        .sync-panel h2 {
          margin: 0 0 16px;
          color: #003c70;
        }

        .sync-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 24px;
          margin: 0;
        }

        .sync-details div {
          padding-bottom: 12px;
          border-bottom: 1px solid #edf2f5;
        }

        .sync-details dt {
          color: #6d7e8b;
          font-size: 13px;
          font-weight: 700;
        }

        .sync-details dd {
          margin: 4px 0 0;
          font-weight: 800;
        }

        .sync-error-message {
          overflow-wrap: anywhere;
          color: #9c252d;
        }

        .sync-table-wrap {
          overflow-x: auto;
        }

        .sync-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sync-table th,
        .sync-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #e6edf1;
          text-align: left;
          white-space: nowrap;
        }

        .sync-table th {
          color: #6d7e8b;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .run-label {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .run-label.success {
          background: #e6f7ed;
          color: #19723d;
        }

        .run-label.failed {
          background: #fff0f1;
          color: #a3262e;
        }

        .run-label.running {
          background: #fff3df;
          color: #8a560d;
        }

        @media (max-width: 760px) {
          .sync-header-inner {
            align-items: flex-start;
            flex-direction: column;
            padding: 18px 0;
          }

          .sync-metrics,
          .sync-details {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .sync-header-inner,
          .sync-main {
            width: min(100% - 28px, 1080px);
          }

          .sync-metrics,
          .sync-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="sync-page">
        <header className="sync-header">
          <div className="sync-header-inner">
            <Link
              className="sync-brand"
              href="/"
            >
              Golfpassi Marketing Tracker
            </Link>

            <nav className="nav">
              <Link href="/">
                Etusivu
              </Link>

              <Link href="/trips">
                Matkat
              </Link>
            </nav>
          </div>
        </header>

        <main className="sync-main">
          <div className="sync-heading">
            <h1>
              Matkojen synkronointi
            </h1>

            <p>
              Golfpassin matkat päivitetään automaattisesti joka aamu.
            </p>
          </div>

          <section className={statusClass}>
            <h2>{statusTitle}</h2>
            <p>{statusText}</p>
          </section>

          <section
            className="sync-metrics"
            aria-label="Viimeisimmän onnistuneen ajon luvut"
          >
            <article className="sync-metric">
              <span>Löydetty</span>
              <strong>
                {countValue(
                  latestSuccess?.found_count ?? null
                )}
              </strong>
            </article>

            <article className="sync-metric">
              <span>Uusia</span>
              <strong>
                {countValue(
                  latestSuccess?.added_count ?? null
                )}
              </strong>
            </article>

            <article className="sync-metric">
              <span>Päivitetty</span>
              <strong>
                {countValue(
                  latestSuccess?.updated_count ?? null
                )}
              </strong>
            </article>

            <article className="sync-metric">
              <span>Passivoitu</span>
              <strong>
                {countValue(
                  latestSuccess?.missing_count ?? null
                )}
              </strong>
            </article>
          </section>

          <section className="sync-panel">
            <h2>Viimeisin onnistunut ajo</h2>

            <dl className="sync-details">
              <div>
                <dt>Valmistui</dt>
                <dd>
                  {formatDateTime(
                    latestSuccessTime
                  )}
                </dd>
              </div>

              <div>
                <dt>Kesto</dt>
                <dd>
                  {latestSuccess
                    ? formatDuration(
                        latestSuccess
                      )
                    : '–'}
                </dd>
              </div>

              <div>
                <dt>Viimeisin virhe</dt>
                <dd>
                  {latestFailure
                    ? formatDateTime(
                        latestFailure.finished_at ||
                          latestFailure.started_at
                      )
                    : 'Ei tallennettuja virheitä'}
                </dd>
              </div>

              <div>
                <dt>Virheilmoitus</dt>
                <dd className="sync-error-message">
                  {latestFailure?.error_message ||
                    'Ei virheitä'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="sync-panel">
            <h2>Ajohistoria</h2>

            {runs.length === 0 ? (
              <p>
                Ei vielä tallennettuja ajoja.
              </p>
            ) : (
              <div className="sync-table-wrap">
                <table className="sync-table">
                  <thead>
                    <tr>
                      <th>Aloitettu</th>
                      <th>Tila</th>
                      <th>Löydetty</th>
                      <th>Uusia</th>
                      <th>Päivitetty</th>
                      <th>Passivoitu</th>
                      <th>Kesto</th>
                    </tr>
                  </thead>

                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id}>
                        <td>
                          {formatDateTime(
                            run.started_at
                          )}
                        </td>

                        <td>
                          <span
                            className={`run-label ${run.status}`}
                          >
                            {run.status === 'success'
                              ? 'Onnistui'
                              : run.status === 'failed'
                                ? 'Epäonnistui'
                                : 'Käynnissä'}
                          </span>
                        </td>

                        <td>
                          {countValue(
                            run.found_count
                          )}
                        </td>

                        <td>
                          {countValue(
                            run.added_count
                          )}
                        </td>

                        <td>
                          {countValue(
                            run.updated_count
                          )}
                        </td>

                        <td>
                          {countValue(
                            run.missing_count
                          )}
                        </td>

                        <td>
                          {formatDuration(run)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  )
}
