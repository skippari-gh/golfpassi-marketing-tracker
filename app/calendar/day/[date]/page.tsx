import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMarketingCalendar, type MarketingCalendarItem } from '../../../../lib/trips'

export const dynamic = 'force-dynamic'

function formatLongDate(dateValue: string) {
  return new Intl.DateTimeFormat('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Helsinki',
  }).format(new Date(`${dateValue}T12:00:00`))
}

export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  const calendarItems = await getMarketingCalendar()
  const items = calendarItems.filter((item) => {
    if (item.kind === 'done') return item.date === date
    return item.performances.some((performance) => performance.date === date)
  })

  const planned = items.filter((item) => item.kind === 'planned')
  const done = items.filter((item) => item.kind === 'done')

  return (
    <>
      <header className="header">
        <h1>Golfpassi Marketing Tracker</h1>
        <p>Päivän markkinointisuunnitelma</p>
      </header>

      <main className="container day-container">
        <nav className="nav">
          <Link href={`/?month=${date.slice(0, 7)}&layout=month`}>← Kuukausikalenteriin</Link>
          <Link className="button" href={`/plan/new?date=${date}`}>+ Lisää suorite tälle päivälle</Link>
        </nav>

        <section className="card day-heading">
          <p className="day-kicker">Markkinointipäivä</p>
          <h2>{formatLongDate(date)}</h2>
          <p className="meta">
            {planned.reduce((sum, item) => sum + (item.kind === 'planned' ? item.performances.filter((p) => p.date === date).length : 0), 0)} tulossa · {done.length} tehty
          </p>
        </section>

        <section className="day-section">
          <h2>Tulossa</h2>
          {planned.length === 0 ? (
            <p className="card meta">Tälle päivälle ei ole suunniteltuja markkinointisuoritteita.</p>
          ) : (
            <div className="day-list">
              {planned.map((item) => (
                <DayPlannedItem key={item.id} item={item} date={date} />
              ))}
            </div>
          )}
        </section>

        <section className="day-section">
          <h2>Tehdyt</h2>
          {done.length === 0 ? (
            <p className="card meta">Tälle päivälle ei ole tehtyjä merkintöjä.</p>
          ) : (
            <div className="day-list">
              {done.map((item) => (
                <article className="card day-item" key={item.id}>
                  <strong>{item.trip_name}</strong>
                  <span className="day-channel">{item.kind === 'done' ? item.channel : ''}</span>
                  <p>{item.kind === 'done' ? item.title : ''}</p>
                  {item.kind === 'done' && item.notes ? <p className="meta">{item.notes}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .day-container { max-width: 920px; }
        .day-heading { margin-bottom: 26px; }
        .day-heading h2 { margin: 4px 0 6px; color: var(--navy); text-transform: capitalize; }
        .day-kicker { margin: 0; color: var(--blue); font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .day-section { margin-top: 26px; }
        .day-section > h2 { color: var(--navy); }
        .day-list { display: grid; gap: 12px; }
        .day-item { display: grid; gap: 6px; }
        .day-item strong { color: var(--navy); font-size: 17px; }
        .day-item p { margin: 0; }
        .day-channel { width: fit-content; padding: 4px 7px; border-radius: 6px; background: #eef7fc; color: var(--navy); font-size: 11px; font-weight: 800; }
        .day-performances { display: grid; gap: 8px; margin-top: 5px; }
        .day-performance { padding: 10px 12px; border: 1px solid #dbe4ee; border-radius: 10px; background: #f8fbfd; }
      `}</style>
    </>
  )
}

function DayPlannedItem({
  item,
  date,
}: {
  item: Extract<MarketingCalendarItem, { kind: 'planned' }>
  date: string
}) {
  const performances = item.performances.filter((performance) => performance.date === date)

  return (
    <article className="card day-item">
      {item.trip_id ? <Link href={`/trips/${item.trip_id}`}><strong>{item.trip_name}</strong></Link> : <strong>{item.trip_name}</strong>}
      {item.country ? <span className="meta">{item.country}</span> : null}
      <div className="day-performances">
        {performances.map((performance) => (
          <div className="day-performance" key={performance.id}>
            <span className="day-channel">{performance.channel}</span>
            <p><strong>{performance.title}</strong></p>
            {performance.destinations && performance.destinations.length > 1 ? (
              <p className="meta">
                Kohteet: {performance.destinations.map((destination) => destination.name).join(', ')}
              </p>
            ) : null}
            {performance.notes ? <p className="meta">{performance.notes}</p> : null}
          </div>
        ))}
      </div>
    </article>
  )
}
