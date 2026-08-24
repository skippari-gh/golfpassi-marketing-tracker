import Image from 'next/image'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { priorityReason } from '../lib/priority'
import { supabase } from '../lib/supabase'
import DeleteItemButton from './components/DeleteItemButton'
import {
  getMarketingCalendar,
  getMarketingRequests,
  getTripsWithPriority,
  type MarketingCalendarItem,
  type TripWithPriority,
} from '../lib/trips'

export const dynamic = 'force-dynamic'

type CalendarView = 'all' | 'planned' | 'done'

type HomeSearchParams = Promise<{
  month?: string | string[]
  view?: string | string[]
}>

function getSingleParam(
  value: string | string[] | undefined
) {
  return Array.isArray(value) ? value[0] : value
}

function getToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getCurrentMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function normalizeMonth(
  value: string | undefined,
  fallback: string
) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return fallback
  }

  const monthNumber = Number(value.slice(5, 7))

  if (monthNumber < 1 || monthNumber > 12) {
    return fallback
  }

  return value
}

function normalizeView(
  value: string | undefined
): CalendarView {
  if (
    value === 'all' ||
    value === 'planned' ||
    value === 'done'
  ) {
    return value
  }

  return 'all'
}

function changeMonth(
  monthValue: string,
  amount: number
) {
  const [year, month] = monthValue
    .split('-')
    .map(Number)

  const date = new Date(
    Date.UTC(year, month - 1 + amount, 1)
  )

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
  ].join('-')
}

function formatMonth(monthValue: string) {
  const [year, month] = monthValue
    .split('-')
    .map(Number)

  const date = new Date(
    Date.UTC(year, month - 1, 1, 12)
  )

  const formatted = new Intl.DateTimeFormat('fi-FI', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Helsinki',
  }).format(date)

  return (
    formatted.charAt(0).toUpperCase() +
    formatted.slice(1)
  )
}

function formatDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat('fi-FI', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function getCalendarUrl(
  month: string,
  view: CalendarView
) {
  return `/?month=${month}&view=${view}`
}

function compactPriorityReason(
  trip: TripWithPriority
) {
  const reasons: string[] = []

  if (!trip.last_marketed_at) {
    reasons.push('Ei vielä markkinoitu')
  } else if (trip.days_since_marketed >= 14) {
    reasons.push(
      `${trip.days_since_marketed} päivää edellisestä nostosta`
    )
  }

  if (
    trip.days_to_start >= 0 &&
    trip.days_to_start <= 30
  ) {
    reasons.push('lähtö alle 30 päivässä')
  } else if (
    trip.days_to_start > 30 &&
    trip.days_to_start <= 60
  ) {
    reasons.push('lähtö alle 60 päivässä')
  }

  if (!trip.has_newsletter) {
    reasons.push('ei uutiskirjeessä')
  }

  if (!trip.has_social) {
    reasons.push('ei somessa')
  }

  return reasons.join(' · ') || priorityReason(trip)
}

function CalendarRow({
  item,
  today,
}: {
  item: MarketingCalendarItem
  today: string
}) {
  const overdue =
    item.kind === 'planned' &&
    item.performances.some(
      (performance) => performance.date < today
    )

  const statusLabel =
    item.kind === 'done'
      ? 'Tehty'
      : overdue
        ? 'Myöhässä'
        : 'Tulossa'

  const statusClass =
    item.kind === 'done'
      ? 'calendar-status done'
      : overdue
        ? 'calendar-status overdue'
        : 'calendar-status upcoming'

  return (
    <article
      className={`calendar-row ${
        overdue ? 'calendar-row-overdue' : ''
      }`}
    >
      <div className="calendar-date">
        {formatDate(item.date)}
      </div>

      <div className="calendar-content">
        <div className="calendar-row-top">
          <span className={statusClass}>
            {statusLabel}
          </span>

          <span className="calendar-channel">
            {item.kind === 'planned'
              ? `${item.performances.length} ${
                  item.performances.length === 1
                    ? 'suorite'
                    : 'suoritetta'
                }`
              : item.channel}
          </span>
        </div>

        {item.trip_id ? (
          <Link
            className="calendar-title-link"
            href={`/trips/${item.trip_id}`}
          >
            {item.trip_name}
          </Link>
        ) : (
          <h3 className="calendar-title">
            {item.trip_name}
          </h3>
        )}

        {item.country && (
          <p className="calendar-country">
            {item.country}
          </p>
        )}

        {item.kind === 'planned' ? (
          <div className="calendar-performances">
            {item.performances.map((performance) => (
              <div
                className="calendar-performance"
                key={performance.id}
              >
                <div className="calendar-performance-top">
                  <strong>{performance.channel}</strong>
                  <span>{formatDate(performance.date)}</span>
                  {performance.date < today ? (
                    <span className="calendar-performance-overdue">
                      Myöhässä
                    </span>
                  ) : null}
                </div>

                <p className="calendar-action">
                  {performance.title}
                </p>

                {performance.notes ? (
                  <p className="calendar-notes">
                    {performance.notes}
                  </p>
                ) : null}

                <DeleteItemButton
                  action={deleteCalendarItem}
                  itemId={performance.id}
                  fieldName="calendar_item_id"
                  label="Poista suorite"
                  confirmMessage="Poistetaanko tämä markkinointisuorite suunnitelmasta?"
                  formClassName="calendar-delete-form"
                  buttonClassName="button danger calendar-delete-button"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="calendar-action">
              {item.title}
            </p>

            {item.notes ? (
              <p className="calendar-notes">
                {item.notes}
              </p>
            ) : null}

            <DeleteItemButton
              action={deleteCalendarItem}
              itemId={item.id}
              fieldName="calendar_item_id"
              label="Poista kalenterista"
              confirmMessage="Poistetaanko tämä tehty markkinointimerkintä? Se poistuu myös matkan historiasta ja vaikuttaa pisteytykseen."
              formClassName="calendar-delete-form"
              buttonClassName="button danger calendar-delete-button"
            />
          </>
        )}
      </div>
    </article>
  )
}

async function deleteCalendarItem(
  formData: FormData
) {
  'use server'

  const calendarItemId = String(
    formData.get('calendar_item_id') || ''
  )

  const separatorIndex =
    calendarItemId.indexOf('-')

  if (separatorIndex < 1) {
    throw new Error(
      'Kalenterimerkinnän tunniste puuttuu.'
    )
  }

  const itemType = calendarItemId.slice(
    0,
    separatorIndex
  )

  const databaseId = calendarItemId.slice(
    separatorIndex + 1
  )

  if (!databaseId) {
    throw new Error(
      'Kalenterimerkinnän tunniste puuttuu.'
    )
  }

  const tableName =
    itemType === 'plan'
      ? 'marketing_plan'
      : itemType === 'action'
        ? 'marketing_actions'
        : null

  if (!tableName) {
    throw new Error(
      'Tuntematon kalenterimerkinnän tyyppi.'
    )
  }

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', databaseId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/')
}

async function markRequestDone(
  formData: FormData
) {
  'use server'

  const requestId = String(
    formData.get('request_id') || ''
  )

  if (!requestId) {
    throw new Error(
      'Markkinointitoiveen tunniste puuttuu.'
    )
  }

  const { error } = await supabase
    .from('marketing_requests')
    .update({ status: 'done' })
    .eq('id', requestId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/')
}

async function deleteMarketingRequest(
  formData: FormData
) {
  'use server'

  const requestId = String(
    formData.get('request_id') || ''
  )

  if (!requestId) {
    throw new Error(
      'Markkinointitoiveen tunniste puuttuu.'
    )
  }

  const { error: commentsError } = await supabase
    .from('marketing_request_comments')
    .delete()
    .eq('request_id', requestId)

  if (commentsError) {
    throw new Error(commentsError.message)
  }

  const { error: requestError } = await supabase
    .from('marketing_requests')
    .delete()
    .eq('id', requestId)

  if (requestError) {
    throw new Error(requestError.message)
  }

  revalidatePath('/')
}

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams
}) {
  const resolvedSearchParams =
    await searchParams

  const currentMonth = getCurrentMonth()

  const selectedMonth = normalizeMonth(
    getSingleParam(resolvedSearchParams.month),
    currentMonth
  )

  const selectedView = normalizeView(
    getSingleParam(resolvedSearchParams.view)
  )

  const previousMonth = changeMonth(
    selectedMonth,
    -1
  )

  const nextMonth = changeMonth(
    selectedMonth,
    1
  )

  const [
    allTrips,
    marketingRequests,
    calendarItems,
  ] = await Promise.all([
    getTripsWithPriority(),
    getMarketingRequests(),
    getMarketingCalendar(),
  ])

  const today = getToday()

  const activeTrips = allTrips
    .filter((trip) => trip.status === 'active')
    .filter((trip) => trip.days_to_start >= 0)
    .sort(
      (a, b) =>
        b.priority_score - a.priority_score
    )

  const priorityTrips = activeTrips.slice(0, 10)

  const monthCalendarItems =
    calendarItems.filter((item) =>
      item.date.startsWith(selectedMonth)
    )

  const plannedItems = monthCalendarItems
    .filter((item) => item.kind === 'planned')
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    )

  const completedItems = monthCalendarItems
    .filter((item) => item.kind === 'done')
    .sort((a, b) =>
      b.date.localeCompare(a.date)
    )

  const overdueCount = plannedItems.filter(
    (item) => item.kind === 'planned'
  ).reduce(
    (count, item) =>
      count +
      item.performances.filter(
        (performance) => performance.date < today
      ).length,
    0
  )

  const plannedPerformanceCount = plannedItems.reduce(
    (count, item) =>
      count +
      (item.kind === 'planned'
        ? item.performances.length
        : 0),
    0
  )

  const showPlanned =
    selectedView === 'all' ||
    selectedView === 'planned'

  const showCompleted =
    selectedView === 'all' ||
    selectedView === 'done'

  const priorityLabel = {
    low: 'Matala',
    normal: 'Normaali',
    high: 'Kiireellinen',
  } as const

  return (
    <>
      <style>{`
        :root {
          --gp-navy: #003c70;
          --gp-blue: #00aaff;
          --gp-dark-blue: #0a4d82;
          --gp-light-blue: #eef7fc;
          --gp-pale-blue: #f7fbfe;
          --gp-orange: #ff8200;
          --gp-orange-dark: #e87300;
          --gp-text: #263b4b;
          --gp-muted: #6d7e8b;
          --gp-border: #dce5eb;
          --gp-white: #ffffff;
          --gp-red: #c83038;
          --gp-red-light: #fff0f1;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f8fa;
          color: var(--gp-text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          color: inherit;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        .page-shell {
          min-height: 100vh;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          border-bottom: 1px solid var(--gp-border);
          background: rgba(255, 255, 255, 0.98);
          box-shadow:
            0 2px 14px
            rgba(0, 60, 112, 0.06);
          backdrop-filter: blur(12px);
        }

        .topbar-inner {
          display: flex;
          align-items: center;
          width: min(
            1500px,
            calc(100% - 48px)
          );
          min-height: 76px;
          margin: 0 auto;
          gap: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          text-decoration: none;
        }

        .brand-logo {
          display: block;
          width: 200px;
          height: auto;
          object-fit: contain;
        }

        .tracker-title {
          padding-left: 24px;
          border-left: 1px solid #dce4e9;
          color: var(--gp-navy);
          font-size: 13px;
          font-weight: 850;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }

        .main-nav a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 9px 14px;
          border-radius: 8px;
          color: var(--gp-navy);
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
        }

        .main-nav a:hover {
          background: var(--gp-light-blue);
          color: var(--gp-blue);
        }

        .main-nav .nav-cta {
          min-height: 42px;
          padding-right: 20px;
          padding-left: 20px;
          background: var(--gp-orange);
          color: #ffffff;
          box-shadow:
            0 6px 17px
            rgba(255, 130, 0, 0.22);
        }

        .main-nav .nav-cta:hover {
          background: var(--gp-orange-dark);
          color: #ffffff;
        }

        .hero {
          position: relative;
          width: 100%;
          height: 374px;
          overflow: hidden;
          border-bottom: 1px solid var(--gp-border);
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.96) 0%,
              rgba(255, 255, 255, 0.9) 26%,
              rgba(255, 255, 255, 0.62) 44%,
              rgba(255, 255, 255, 0.12) 70%,
              rgba(255, 255, 255, 0.02) 100%
            ),
            url('/hero-golf.png');
          background-position: center center;
          background-repeat: no-repeat;
          background-size: cover;
        }

        .hero-inner {
          display: flex;
          align-items: center;
          width: min(
            1500px,
            calc(100% - 48px)
          );
          height: 100%;
          margin: 0 auto;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: min(600px, 60%);
        }

        .hero-kicker {
          margin: 0 0 13px;
          color: var(--gp-blue);
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .hero-content h1 {
          margin: 0;
          color: var(--gp-navy);
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: clamp(46px, 5.4vw, 74px);
          font-weight: 700;
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .hero-description {
          max-width: 570px;
          margin: 21px 0 0;
          color: #2b4558;
          font-size: 19px;
          line-height: 1.55;
        }

        .hero-line {
          width: 72px;
          height: 5px;
          margin-top: 24px;
          border-radius: 999px;
          background: var(--gp-orange);
        }

        .dashboard {
          display: grid;
          grid-template-columns:
            minmax(0, 2fr)
            minmax(300px, 1fr)
            minmax(300px, 1fr);
          align-items: start;
          gap: 18px;
          width: min(
            1500px,
            calc(100% - 48px)
          );
          margin: 20px auto 60px;
        }

        .panel {
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--gp-border);
          border-radius: 14px;
          background: var(--gp-white);
          box-shadow:
            0 8px 25px
            rgba(0, 60, 112, 0.055);
        }

        .panel-inner {
          padding: 21px;
        }

        .panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 17px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e7edf1;
        }

        .panel-overline {
          display: block;
          margin-bottom: 5px;
          color: var(--gp-blue);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .panel-heading h2 {
          margin: 0;
          color: var(--gp-navy);
          font-size: 21px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .panel-heading p {
          margin: 6px 0 0;
          color: var(--gp-muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .priority-info {
          position: relative;
          flex: 0 0 auto;
        }

        .priority-info-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 31px;
          height: 31px;
          border: 1px solid #b9d8ea;
          border-radius: 50%;
          background: var(--gp-light-blue);
          color: var(--gp-blue);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 800;
          font-style: italic;
          line-height: 1;
          list-style: none;
          cursor: pointer;
          user-select: none;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            color 140ms ease,
            transform 140ms ease;
        }

        .priority-info-button::-webkit-details-marker {
          display: none;
        }

        .priority-info-button:hover {
          border-color: var(--gp-blue);
          background: var(--gp-blue);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .priority-info-button:focus-visible {
          outline: 3px solid rgba(255, 130, 0, 0.35);
          outline-offset: 3px;
        }

        .priority-info[open] .priority-info-button {
          border-color: var(--gp-navy);
          background: var(--gp-navy);
          color: #ffffff;
        }

        .priority-info-popover {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 100;
          width: min(310px, calc(100vw - 64px));
          padding: 16px;
          border: 1px solid #c9dce7;
          border-radius: 11px;
          background: #ffffff;
          color: var(--gp-text);
          box-shadow:
            0 14px 36px
            rgba(0, 60, 112, 0.2);
        }

        .priority-info-popover::before {
          position: absolute;
          top: -7px;
          right: 9px;
          width: 12px;
          height: 12px;
          border-top: 1px solid #c9dce7;
          border-left: 1px solid #c9dce7;
          background: #ffffff;
          content: '';
          transform: rotate(45deg);
        }

        .priority-info-popover h3 {
          margin: 0;
          color: var(--gp-navy);
          font-size: 15px;
          font-weight: 850;
          line-height: 1.3;
        }

        .priority-info-intro {
          margin: 7px 0 13px;
          color: var(--gp-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .priority-info-list {
          display: grid;
          gap: 7px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .priority-info-list li {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
          padding: 7px 0;
          border-bottom: 1px solid #edf1f4;
          color: #435a6b;
          font-size: 11px;
          line-height: 1.4;
        }

        .priority-info-list li:last-child {
          border-bottom: 0;
        }

        .priority-info-points {
          color: var(--gp-navy);
          font-weight: 900;
          white-space: nowrap;
        }

        .priority-info-note {
          margin: 12px 0 0;
          padding: 9px 10px;
          border-left: 3px solid var(--gp-orange);
          background: #fff8ef;
          color: #536674;
          font-size: 11px;
          line-height: 1.45;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 8px 13px;
          border: 1px solid var(--gp-orange);
          border-radius: 8px;
          background: var(--gp-orange);
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          text-decoration: none;
          cursor: pointer;
        }

        .button:hover {
          border-color: var(--gp-orange-dark);
          background: var(--gp-orange-dark);
          color: #ffffff;
        }

        .button.secondary {
          border-color: #cbd9e3;
          background: #ffffff;
          color: var(--gp-navy);
        }

        .button.secondary:hover {
          border-color: var(--gp-blue);
          background: var(--gp-light-blue);
          color: var(--gp-blue);
        }

        .button.danger {
          border-color: #efc3c5;
          background: #ffffff;
          color: var(--gp-red);
        }

        .button.danger:hover {
          border-color: var(--gp-red);
          background: var(--gp-red-light);
          color: var(--gp-red);
        }

        .calendar-toolbar {
          display: grid;
          gap: 12px;
          margin-bottom: 17px;
          padding: 13px;
          border: 1px solid #d5e6f0;
          border-radius: 10px;
          background: var(--gp-light-blue);
        }

        .month-navigation {
          display: grid;
          grid-template-columns: 38px 1fr 38px;
          align-items: center;
          gap: 10px;
        }

        .month-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 36px;
          border: 1px solid #bfd3df;
          border-radius: 7px;
          background: #ffffff;
          color: var(--gp-navy);
          font-size: 21px;
          font-weight: 900;
          text-decoration: none;
        }

        .month-button:hover {
          border-color: var(--gp-blue);
          background: var(--gp-blue);
          color: #ffffff;
        }

        .month-title {
          margin: 0;
          color: var(--gp-navy);
          font-size: 17px;
          font-weight: 850;
          text-align: center;
        }

        .calendar-toolbar-bottom {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 11px;
          border-top: 1px solid #d5e4ec;
        }

        .calendar-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .calendar-filter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 31px;
          padding: 6px 12px;
          border: 1px solid #bfced8;
          border-radius: 999px;
          background: #ffffff;
          color: var(--gp-navy);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .calendar-filter:hover {
          border-color: var(--gp-blue);
          color: var(--gp-blue);
        }

        .calendar-filter.active {
          border-color: var(--gp-navy);
          background: var(--gp-navy);
          color: #ffffff;
        }

        .current-month-link {
          color: var(--gp-blue);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .current-month-link:hover {
          text-decoration: underline;
        }

        .calendar-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 19px;
        }

        .summary-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border: 1px solid #c9e0ee;
          border-radius: 999px;
          background: var(--gp-pale-blue);
          color: var(--gp-blue);
          font-size: 12px;
          font-weight: 800;
        }

        .summary-pill.done {
          border-color: #bdd9ee;
          background: #eef7fd;
          color: var(--gp-dark-blue);
        }

        .summary-pill.alert {
          border-color: #efbfc2;
          background: var(--gp-red-light);
          color: var(--gp-red);
        }

        .calendar-section + .calendar-section {
          margin-top: 26px;
        }

        .calendar-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
          padding: 8px 0;
          border-bottom: 2px solid var(--gp-blue);
        }

        .calendar-section-heading h3 {
          margin: 0;
          color: var(--gp-navy);
          font-size: 16px;
          font-weight: 850;
        }

        .calendar-count {
          color: var(--gp-muted);
          font-size: 12px;
        }

        .calendar-list {
          max-height: 510px;
          overflow-y: auto;
          scrollbar-gutter: stable;
        }

        .calendar-row {
          display: grid;
          grid-template-columns: 95px minmax(0, 1fr);
          gap: 14px;
          padding: 14px 4px;
          border-bottom: 1px solid #e4eaee;
        }

        .calendar-row:hover {
          background: #fbfdfe;
        }

        .calendar-row-overdue {
          padding-left: 10px;
          border-left: 4px solid var(--gp-red);
          background: #fffafa;
        }

        .calendar-date {
          padding-top: 3px;
          color: var(--gp-navy);
          font-size: 13px;
          font-weight: 850;
          text-transform: capitalize;
        }

        .calendar-content {
          min-width: 0;
        }

        .calendar-row-top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
          margin-bottom: 5px;
        }

        .calendar-status {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .calendar-status.upcoming {
          background: #fff0dc;
          color: #bd6800;
        }

        .calendar-status.done {
          background: #e4f4fd;
          color: var(--gp-dark-blue);
        }

        .calendar-status.overdue {
          background: #ffe3e5;
          color: var(--gp-red);
        }

        .calendar-channel {
          color: var(--gp-muted);
          font-size: 11px;
          font-weight: 750;
        }

        .calendar-title,
        .calendar-title-link {
          display: block;
          margin: 0;
          color: var(--gp-navy);
          font-size: 15px;
          font-weight: 850;
          line-height: 1.3;
          text-decoration: none;
        }

        .calendar-title-link:hover {
          color: var(--gp-blue);
        }

        .calendar-country {
          margin: 3px 0 0;
          color: var(--gp-blue);
          font-size: 11px;
          font-weight: 800;
        }

        .calendar-action {
          margin: 6px 0 0;
          color: var(--gp-text);
          font-size: 13px;
          font-weight: 700;
        }

        .calendar-notes {
          display: -webkit-box;
          margin: 4px 0 0;
          overflow: hidden;
          color: var(--gp-muted);
          font-size: 12px;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .calendar-performances {
          display: grid;
          gap: 9px;
          margin-top: 11px;
        }

        .calendar-performance {
          padding: 10px 11px;
          border: 1px solid #dce7ee;
          border-radius: 9px;
          background: #f8fbfd;
        }

        .calendar-performance-top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
          color: var(--gp-muted);
          font-size: 11px;
        }

        .calendar-performance-top strong {
          color: var(--gp-navy);
          font-size: 12px;
        }

        .calendar-performance-overdue {
          padding: 3px 5px;
          border-radius: 4px;
          background: #ffe3e5;
          color: var(--gp-red);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .calendar-delete-form {
          margin: 10px 0 0;
        }

        .calendar-delete-button {
          min-height: 30px;
          padding: 6px 9px;
          font-size: 10px;
        }

        .empty-message {
          margin: 0;
          padding: 17px;
          border: 1px dashed #c8d6df;
          border-radius: 9px;
          background: #fbfdfe;
          color: var(--gp-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .compact-list {
          display: grid;
          gap: 12px;
          max-height: 1110px;
          overflow-y: auto;
          padding-right: 3px;
          scrollbar-gutter: stable;
        }

        .compact-card {
          position: relative;
          overflow: hidden;
          padding: 15px;
          border: 1px solid #dbe4e9;
          border-radius: 10px;
          background: #ffffff;
          box-shadow:
            0 4px 12px
            rgba(0, 60, 112, 0.04);
        }

        .compact-card::before {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--gp-orange);
          content: '';
        }

        .request-card::before {
          background: var(--gp-blue);
        }

        .compact-card:hover {
          border-color: #bfd3de;
          box-shadow:
            0 8px 18px
            rgba(0, 60, 112, 0.08);
        }

        .score {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 5px;
          background: var(--gp-orange);
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.03em;
        }

        .request-card .score {
          background: var(--gp-blue);
        }

        .compact-card h3 {
          margin: 9px 0 6px;
          color: var(--gp-navy);
          font-size: 16px;
          font-weight: 850;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .meta {
          margin: 4px 0;
          color: var(--gp-muted);
          font-size: 12px;
          line-height: 1.4;
        }

        .request-text {
          margin: 11px 0;
          color: var(--gp-text);
          font-size: 13px;
          line-height: 1.5;
        }

        .priority-summary {
          display: -webkit-box;
          margin: 11px 0 0;
          padding: 9px 10px;
          overflow: hidden;
          border-left: 3px solid var(--gp-orange);
          background: #fff8ef;
          color: #536674;
          font-size: 12px;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
        }

        .actions form {
          margin: 0;
        }

        .compact-card .button {
          min-height: 33px;
          padding: 7px 10px;
          font-size: 11px;
        }

        .panel-footer {
          margin-top: 16px;
          padding-top: 15px;
          border-top: 1px solid #e6ecef;
        }

        @media (max-width: 1180px) {
          .dashboard {
            grid-template-columns:
              minmax(0, 1fr)
              minmax(0, 1fr);
          }

          .calendar-panel {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 860px) {
          .topbar-inner {
            flex-wrap: wrap;
            padding: 13px 0;
          }

          .tracker-title {
            display: none;
          }

          .main-nav {
            width: 100%;
            margin-left: 0;
            overflow-x: auto;
          }

          .hero {
            height: 320px;
            background-position: 62% center;
          }

          .hero-content {
            width: min(620px, 78%);
          }

          .hero-description {
            font-size: 17px;
          }
        }

        @media (max-width: 760px) {
          .topbar-inner,
          .hero-inner,
          .dashboard {
            width: min(
              100% - 28px,
              1500px
            );
          }

          .brand-logo {
            width: 165px;
          }

          .dashboard {
            grid-template-columns: 1fr;
          }

          .calendar-panel {
            grid-column: auto;
          }

          .hero {
            height: 300px;
            background-position: 68% center;
          }

          .hero::after {
            position: absolute;
            inset: 0;
            background:
              rgba(255, 255, 255, 0.2);
            content: '';
          }

          .hero-content {
            width: 100%;
          }

          .hero-content h1 {
            font-size: 43px;
          }

          .hero-description {
            max-width: 460px;
            font-size: 16px;
          }

          .panel-heading {
            flex-direction: column;
          }

          .priority-panel-heading {
            flex-direction: row;
          }

          .calendar-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .calendar-toolbar-bottom {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="page-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <Link
              className="brand"
              href="/"
              aria-label="Golfpassi Marketing Tracker"
            >
              <Image
                className="brand-logo"
                src="/golfpassi-logo.png"
                alt="Golfpassi"
                width={500}
                height={147}
                priority
              />
            </Link>

            <div className="tracker-title">
              Marketing Tracker
            </div>

            <nav className="main-nav">
              <Link href="/">
                Etusivu
              </Link>

              <Link href="/trips">
                Matkat
              </Link>

              <Link href="/sync-status">
                Synkronointi
              </Link>

              <Link href="/requests/new">
                Lisää toive
              </Link>

              <Link
                className="nav-cta"
                href="/actions/new"
              >
                Lisää tehty merkintä
              </Link>
            </nav>
          </div>
        </header>

        <section className="hero">
          <div className="hero-inner">
            <div className="hero-content">
              <p className="hero-kicker">
                Markkinoinnin yhteinen työpöytä
              </p>

              <h1>
                Marketing Tracker
              </h1>

              <p className="hero-description">
                Näe yhdellä silmäyksellä,
                mitä on tehty, mitä on tulossa
                ja mitkä matkat tarvitsevat
                seuraavaksi markkinointia.
              </p>

              <div className="hero-line" />
            </div>
          </div>
        </section>

        <main className="dashboard">
          <section className="panel calendar-panel">
            <div className="panel-inner">
              <div className="panel-heading">
                <div>
                  <span className="panel-overline">
                    Markkinoinnin aikataulu
                  </span>

                  <h2>
                    Markkinointikalenteri
                  </h2>

                  <p>
                    Suunnitellut ja toteutetut
                    markkinointitoimet.
                  </p>
                </div>

                <Link
                  className="button"
                  href="/plan/new"
                >
                  Suunnittele markkinointia
                </Link>
              </div>

              <div className="calendar-toolbar">
                <div className="month-navigation">
                  <Link
                    className="month-button"
                    href={getCalendarUrl(
                      previousMonth,
                      selectedView
                    )}
                    aria-label="Edellinen kuukausi"
                  >
                    ‹
                  </Link>

                  <h3 className="month-title">
                    {formatMonth(selectedMonth)}
                  </h3>

                  <Link
                    className="month-button"
                    href={getCalendarUrl(
                      nextMonth,
                      selectedView
                    )}
                    aria-label="Seuraava kuukausi"
                  >
                    ›
                  </Link>
                </div>

                <div className="calendar-toolbar-bottom">
                  <div className="calendar-filters">
                    <Link
                      className={`calendar-filter ${
                        selectedView === 'all'
                          ? 'active'
                          : ''
                      }`}
                      href={getCalendarUrl(
                        selectedMonth,
                        'all'
                      )}
                    >
                      Kaikki
                    </Link>

                    <Link
                      className={`calendar-filter ${
                        selectedView === 'planned'
                          ? 'active'
                          : ''
                      }`}
                      href={getCalendarUrl(
                        selectedMonth,
                        'planned'
                      )}
                    >
                      Tulossa
                    </Link>

                    <Link
                      className={`calendar-filter ${
                        selectedView === 'done'
                          ? 'active'
                          : ''
                      }`}
                      href={getCalendarUrl(
                        selectedMonth,
                        'done'
                      )}
                    >
                      Tehdyt
                    </Link>
                  </div>

                  {selectedMonth !== currentMonth && (
                    <Link
                      className="current-month-link"
                      href={getCalendarUrl(
                        currentMonth,
                        selectedView
                      )}
                    >
                      Palaa tähän kuukauteen
                    </Link>
                  )}
                </div>
              </div>

              <div className="calendar-summary">
                <span className="summary-pill">
                  Tulossa {plannedPerformanceCount}
                </span>

                <span className="summary-pill done">
                  Tehty {completedItems.length}
                </span>

                {overdueCount > 0 && (
                  <span className="summary-pill alert">
                    Myöhässä {overdueCount}
                  </span>
                )}
              </div>

              {showPlanned && (
                <div className="calendar-section">
                  <div className="calendar-section-heading">
                    <h3>
                      Tulossa ja avoinna
                    </h3>

                    <span className="calendar-count">
                      {plannedItems.length}{' '}
                      {plannedItems.length === 1 ? 'matka' : 'matkaa'} ·{' '}
                      {plannedPerformanceCount}{' '}
                      {plannedPerformanceCount === 1
                        ? 'suorite'
                        : 'suoritetta'}
                    </span>
                  </div>

                  {plannedItems.length === 0 ? (
                    <p className="empty-message">
                      Tässä kuussa ei ole tulevia
                      markkinointitoimia.
                    </p>
                  ) : (
                    <div className="calendar-list">
                      {plannedItems.map((item) => (
                        <CalendarRow
                          key={item.id}
                          item={item}
                          today={today}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showCompleted && (
                <div className="calendar-section">
                  <div className="calendar-section-heading">
                    <h3>
                      Tehdyt
                    </h3>

                    <span className="calendar-count">
                      {completedItems.length} merkintää
                    </span>
                  </div>

                  {completedItems.length === 0 ? (
                    <p className="empty-message">
                      Tässä kuussa ei ole tehtyjä
                      markkinointimerkintöjä.
                    </p>
                  ) : (
                    <div className="calendar-list">
                      {completedItems.map((item) => (
                        <CalendarRow
                          key={item.id}
                          item={item}
                          today={today}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-inner">
              <div className="panel-heading priority-panel-heading">
                <div>
                  <span className="panel-overline">
                    Seuraavat nostot
                  </span>

                  <h2>
                    Pisteytetyt matkat
                  </h2>

                  <p>
                    Markkinointia eniten
                    tarvitsevat matkat.
                  </p>
                </div>

                <details className="priority-info">
                  <summary
                    className="priority-info-button"
                    aria-label="Näytä pisteytyksen perusteet"
                    title="Miten pisteet lasketaan?"
                  >
                    i
                  </summary>

                  <div className="priority-info-popover">
                    <h3>
                      Miten pisteet lasketaan?
                    </h3>

                    <p className="priority-info-intro">
                      Lista näyttää 10 aktiivista tulevaa
                      matkaa, joilla on korkein pistemäärä.
                      Mitä suurempi pistemäärä on, sitä
                      enemmän matka tarvitsee markkinointia.
                    </p>

                    <ul className="priority-info-list">
                      <li>
                        <span>
                          Matkaa ei ole markkinoitu koskaan
                        </span>
                        <span className="priority-info-points">
                          +60
                        </span>
                      </li>

                      <li>
                        <span>
                          Edellisestä nostosta vähintään
                          30 päivää
                        </span>
                        <span className="priority-info-points">
                          +50
                        </span>
                      </li>

                      <li>
                        <span>
                          Edellisestä nostosta 21–29 päivää
                        </span>
                        <span className="priority-info-points">
                          +35
                        </span>
                      </li>

                      <li>
                        <span>
                          Edellisestä nostosta 14–20 päivää
                        </span>
                        <span className="priority-info-points">
                          +20
                        </span>
                      </li>

                      <li>
                        <span>
                          Lähtöön 0–30 päivää
                        </span>
                        <span className="priority-info-points">
                          +50
                        </span>
                      </li>

                      <li>
                        <span>
                          Lähtöön 31–60 päivää
                        </span>
                        <span className="priority-info-points">
                          +35
                        </span>
                      </li>

                      <li>
                        <span>
                          Lähtöön 61–90 päivää
                        </span>
                        <span className="priority-info-points">
                          +25
                        </span>
                      </li>

                      <li>
                        <span>
                          Matkaa ei ole ollut uutiskirjeessä
                        </span>
                        <span className="priority-info-points">
                          +25
                        </span>
                      </li>

                      <li>
                        <span>
                          Matkaa ei ole ollut somessa
                        </span>
                        <span className="priority-info-points">
                          +20
                        </span>
                      </li>

                      <li>
                        <span>
                          Matkaa on markkinoitu viimeisen
                          7 päivän aikana
                        </span>
                        <span className="priority-info-points">
                          −50
                        </span>
                      </li>
                    </ul>

                    <p className="priority-info-note">
                      Jo alkanut matka saa −1000 pistettä ja
                      passiivinen matka −500 pistettä. Ne eivät
                      näy tässä listassa, koska lista sisältää
                      vain aktiiviset tulevat matkat.
                    </p>
                  </div>
                </details>
              </div>

              {priorityTrips.length === 0 ? (
                <p className="empty-message">
                  Aktiivisia tulevia matkoja
                  ei löytynyt.
                </p>
              ) : (
                <div className="compact-list">
                  {priorityTrips.map(
                    (trip, index) => (
                      <article
                        className="compact-card"
                        key={trip.id}
                      >
                        <span className="score">
                          #{index + 1} ·{' '}
                          {trip.priority_score}{' '}
                          pistettä
                        </span>

                        <h3>
                          {trip.name}
                        </h3>

                        <p className="meta">
                          {trip.country}
                        </p>

                        <p className="meta">
                          Lähtöön:{' '}
                          <strong>
                            {trip.days_to_start}{' '}
                            päivää
                          </strong>
                        </p>

                        <p className="meta">
                          Viimeksi markkinoitu:{' '}
                          <strong>
                            {trip.last_marketed_at ||
                              'ei koskaan'}
                          </strong>
                        </p>

                        <p className="priority-summary">
                          {compactPriorityReason(trip)}
                        </p>

                        <div className="actions">
                          <Link
                            className="button"
                            href={`/trips/${trip.id}`}
                          >
                            Avaa
                          </Link>

                          <Link
                            className="button secondary"
                            href={`/plan/new?trip=${trip.id}`}
                          >
                            Suunnittele
                          </Link>

                          <Link
                            className="button secondary"
                            href={`/actions/new?trip=${trip.id}`}
                          >
                            Merkitse tehdyksi
                          </Link>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}

              <div className="panel-footer">
                <Link
                  className="button secondary"
                  href="/trips"
                >
                  Kaikki matkat
                </Link>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-inner">
              <div className="panel-heading">
                <div>
                  <span className="panel-overline">
                    Kollegojen pyynnöt
                  </span>

                  <h2>
                    Markkinointitoiveet
                  </h2>

                  <p>
                    Avoimet toiveet ja keskustelut.
                  </p>
                </div>

                <Link
                  className="button"
                  href="/requests/new"
                >
                  Lisää
                </Link>
              </div>

              {marketingRequests.length === 0 ? (
                <p className="empty-message">
                  Avoimia markkinointitoiveita
                  ei ole.
                </p>
              ) : (
                <div className="compact-list">
                  {marketingRequests.map((request) => (
                    <article
                      className="compact-card request-card"
                      key={request.id}
                    >
                      <span className="score">
                        {priorityLabel[request.priority]}
                      </span>

                      <h3>
                        {request.trips?.name ||
                          'Yleinen markkinointitoive'}
                      </h3>

                      {request.trips?.country && (
                        <p className="meta">
                          {request.trips.country}
                        </p>
                      )}

                      <p className="request-text">
                        {request.request_text}
                      </p>

                      <p className="meta">
                        Toivoja:{' '}
                        <strong>
                          {request.requester_name}
                        </strong>
                      </p>

                      {request.desired_date && (
                        <p className="meta">
                          Toivottu:{' '}
                          <strong>
                            {request.desired_date}
                          </strong>
                        </p>
                      )}

                      <div className="actions">
                        <Link
                          className="button"
                          href={`/requests/${request.id}`}
                        >
                          Keskustelu
                        </Link>

                        {request.trip_id && (
                          <Link
                            className="button secondary"
                            href={`/trips/${request.trip_id}`}
                          >
                            Avaa matka
                          </Link>
                        )}

                        <form action={markRequestDone}>
                          <input
                            type="hidden"
                            name="request_id"
                            value={request.id}
                          />

                          <button
                            className="button secondary"
                            type="submit"
                          >
                            Tehty
                          </button>
                        </form>

                        <DeleteItemButton
                          action={deleteMarketingRequest}
                          itemId={request.id}
                          fieldName="request_id"
                          label="Poista toive"
                          confirmMessage="Poistetaanko tämä markkinointitoive ja siihen liittyvät kommentit?"
                          buttonClassName="button danger"
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
