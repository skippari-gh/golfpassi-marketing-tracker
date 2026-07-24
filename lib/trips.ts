import { supabase } from './supabase'

export type TripWithPriority = {
  id: string
  name: string
  country: string
  trip_type: string
  start_date: string
  end_date: string
  status: string
  url?: string | null
  last_marketed_at?: string | null
  channels_used: string[]
  days_since_marketed: number
  days_to_start: number
  priority_score: number
  has_newsletter: boolean
  has_social: boolean
}

export type MarketingRequest = {
  id: string
  trip_id: string | null
  requester_name: string
  request_text: string
  priority: 'low' | 'normal' | 'high'
  desired_date: string | null
  status: 'open' | 'in_progress' | 'done'
  created_at: string
  trips?: {
    id: string
    name: string
    country: string
  } | null
}

export type MarketingCalendarItem = {
  id: string
  kind: 'planned' | 'done'
  date: string
  trip_id: string | null
  trip_name: string
  country: string
  channel: string
  title: string
  notes: string | null
}

function daysBetween(
  date: string | null | undefined,
  from = new Date()
) {
  if (!date) {
    return 9999
  }

  const target = new Date(`${date}T00:00:00`)

  const start = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate()
  )

  return Math.ceil(
    (target.getTime() - start.getTime()) /
      86400000
  )
}

function getChannelName(
  channelRelation: unknown
) {
  if (
    Array.isArray(channelRelation) &&
    channelRelation.length > 0
  ) {
    const firstChannel =
      channelRelation[0] as {
        name?: unknown
      }

    return typeof firstChannel?.name ===
      'string'
      ? firstChannel.name
      : ''
  }

  if (
    channelRelation &&
    typeof channelRelation === 'object' &&
    'name' in channelRelation
  ) {
    const name = (
      channelRelation as {
        name?: unknown
      }
    ).name

    return typeof name === 'string'
      ? name
      : ''
  }

  return ''
}

function scoreTrip(
  trip: any,
  actions: any[]
): TripWithPriority {
  const tripActions = actions.filter(
    (action) =>
      action.trip_id === trip.id
  )

  const dates = tripActions
    .map((action) => action.action_date)
    .filter(
      (date): date is string =>
        typeof date === 'string' &&
        Boolean(date)
    )
    .sort()

  const lastMarketedAt =
    dates.length > 0
      ? dates[dates.length - 1]
      : null

  const channelsUsed = Array.from(
    new Set(
      tripActions
        .map((action) =>
          getChannelName(
            action.channels
          )
        )
        .filter(
          (channel): channel is string =>
            Boolean(channel)
        )
    )
  )

  const daysSince = lastMarketedAt
    ? Math.max(
        0,
        -daysBetween(lastMarketedAt)
      )
    : 9999

  const daysToStart = daysBetween(
    trip.start_date
  )

  const hasNewsletter =
    channelsUsed.includes(
      'Newsletter'
    ) ||
    channelsUsed.includes(
      'Uutiskirje'
    )

  const hasSocial =
    channelsUsed.some((channel) =>
      [
        'Facebook',
        'Instagram',
        'LinkedIn',
        'TikTok',
      ].includes(channel)
    )

  let score = 0

  if (!lastMarketedAt) {
    score += 60
  } else if (daysSince >= 30) {
    score += 50
  } else if (daysSince >= 21) {
    score += 35
  } else if (daysSince >= 14) {
    score += 20
  }

  if (
    daysToStart >= 0 &&
    daysToStart <= 30
  ) {
    score += 50
  } else if (
    daysToStart >= 0 &&
    daysToStart <= 60
  ) {
    score += 35
  } else if (
    daysToStart >= 0 &&
    daysToStart <= 90
  ) {
    score += 25
  }

  if (!hasNewsletter) {
    score += 25
  }

  if (!hasSocial) {
    score += 20
  }

  if (
    lastMarketedAt &&
    daysSince <= 7
  ) {
    score -= 50
  }

  /*
   * Vanhat ja passiiviset matkat säilyvät
   * trackerissa, mutta eivät nouse
   * prioriteettilistan kärkeen.
   */
  if (daysToStart < 0) {
    score -= 1000
  }

  if (trip.status !== 'active') {
    score -= 500
  }

  return {
    ...trip,
    last_marketed_at:
      lastMarketedAt,
    channels_used: channelsUsed,
    days_since_marketed: daysSince,
    days_to_start: daysToStart,
    priority_score: score,
    has_newsletter:
      hasNewsletter,
    has_social: hasSocial,
  }
}

export async function getTripsWithPriority() {
  const {
    data: trips,
    error: tripsError,
  } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', {
      ascending: true,
    })

  if (tripsError) {
    throw new Error(
      tripsError.message
    )
  }

  const {
    data: actions,
    error: actionsError,
  } = await supabase
    .from('marketing_actions')
    .select('*, channels(name)')

  if (actionsError) {
    throw new Error(
      actionsError.message
    )
  }

  /*
   * Mitään matkoja ei suodateta pois.
   * Kaikki trips-taulun matkat palautetaan.
   */
  return (trips || []).map((trip) =>
    scoreTrip(
      trip,
      actions || []
    )
  )
}

export async function getTripWithPriority(
  id: string
) {
  const trips =
    await getTripsWithPriority()

  return (
    trips.find(
      (trip) => trip.id === id
    ) || null
  )
}

export async function getChannels() {
  const { data, error } =
    await supabase
      .from('channels')
      .select('*')
      .order('name', {
        ascending: true,
      })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getMarketingActionsForTrip(
  tripId: string
) {
  const { data, error } =
    await supabase
      .from('marketing_actions')
      .select(
        '*, channels(name)'
      )
      .eq('trip_id', tripId)
      .order('action_date', {
        ascending: false,
      })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getMarketingRequests() {
  const { data, error } =
    await supabase
      .from('marketing_requests')
      .select(`
        *,
        trips (
          id,
          name,
          country
        )
      `)
      .neq('status', 'done')
      .order('created_at', {
        ascending: false,
      })

  if (error) {
    throw new Error(error.message)
  }

  return (
    (data || []) as MarketingRequest[]
  )
}

export async function getMarketingPlan(
  tripId: string
) {
  const { data, error } =
    await supabase
      .from('marketing_plan')
      .select('*')
      .eq('trip_id', tripId)
      .order('planned_date', {
        ascending: true,
      })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

function firstRelation<T>(
  value:
    | T
    | T[]
    | null
    | undefined
) {
  if (Array.isArray(value)) {
    return value[0] || null
  }

  return value || null
}

function firstText(
  ...values: unknown[]
) {
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

export async function getMarketingCalendar() {
  const [
    {
      data: trips,
      error: tripsError,
    },
    {
      data: plans,
      error: plansError,
    },
    {
      data: actions,
      error: actionsError,
    },
  ] = await Promise.all([
    supabase
      .from('trips')
      .select(
        'id, name, country'
      ),

    supabase
      .from('marketing_plan')
      .select('*')
      .order('planned_date', {
        ascending: true,
      }),

    supabase
      .from('marketing_actions')
      .select(
        '*, channels(name)'
      )
      .order('action_date', {
        ascending: false,
      }),
  ])

  if (tripsError) {
    throw new Error(
      tripsError.message
    )
  }

  if (plansError) {
    throw new Error(
      plansError.message
    )
  }

  if (actionsError) {
    throw new Error(
      actionsError.message
    )
  }

  const tripById = new Map(
    (trips || []).map((trip) => [
      trip.id,
      trip,
    ])
  )

  const plannedItems:
    MarketingCalendarItem[] = (
    plans || []
  )
    .map((plan: any) => {
      const trip = plan.trip_id
        ? tripById.get(
            plan.trip_id
          )
        : null

      const status = String(
        plan.status || ''
      ).toLowerCase()

      const isDone = [
        'done',
        'completed',
        'complete',
        'valmis',
        'tehty',
      ].includes(status)

      return {
        id: `plan-${plan.id}`,
        kind: isDone
          ? 'done'
          : 'planned',
        date: firstText(
          isDone &&
            plan.completed_date,
          plan.planned_date
        ),
        trip_id:
          plan.trip_id || null,
        trip_name:
          trip?.name ||
          firstText(
            plan.trip_name
          ) ||
          'Yleinen markkinointi',
        country:
          trip?.country || '',
        channel:
          firstText(
            plan.channel,
            plan.channel_name,
            plan.marketing_channel,
            plan.type
          ) || 'Suunniteltu',
        title:
          firstText(
            plan.title,
            plan.action,
            plan.action_type,
            plan.content_type,
            plan.task
          ) ||
          'Suunniteltu markkinointitoimi',
        notes:
          firstText(
            plan.notes,
            plan.description,
            plan.content
          ) || null,
      } satisfies MarketingCalendarItem
    })
    .filter(
      (item) => item.date
    )

  const completedItems:
    MarketingCalendarItem[] = (
    actions || []
  )
    .map((action: any) => {
      const trip = action.trip_id
        ? tripById.get(
            action.trip_id
          )
        : null

      const channelRelation =
        firstRelation<{
          name?: string
        }>(action.channels)

      const channel =
        firstText(
          channelRelation?.name,
          action.channel,
          action.channel_name
        ) || 'Markkinointi'

      return {
        id: `action-${action.id}`,
        kind: 'done',
        date: firstText(
          action.action_date
        ),
        trip_id:
          action.trip_id || null,
        trip_name:
          trip?.name ||
          firstText(
            action.trip_name
          ) ||
          'Yleinen markkinointi',
        country:
          trip?.country || '',
        channel,
        title:
          firstText(
            action.title,
            action.action_type,
            action.content_type
          ) || channel,
        notes:
          firstText(
            action.notes,
            action.description,
            action.content
          ) || null,
      } satisfies MarketingCalendarItem
    })
    .filter(
      (item) => item.date
    )

  return [
    ...plannedItems,
    ...completedItems,
  ]
}