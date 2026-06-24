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

function daysBetween(date: string | null | undefined, from = new Date()) {
  if (!date) return 9999
  const target = new Date(date + 'T00:00:00')
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.ceil((target.getTime() - start.getTime()) / 86400000)
}

function scoreTrip(trip: any, actions: any[]): TripWithPriority {
  const tripActions = actions.filter((a) => a.trip_id === trip.id)
  const dates = tripActions.map((a) => a.action_date).filter(Boolean).sort()
  const lastMarketedAt = dates.length ? dates[dates.length - 1] : null
  const channelsUsed = Array.from(new Set(tripActions.map((a) => a.channels?.name).filter(Boolean)))

  const daysSince = lastMarketedAt ? Math.max(0, -daysBetween(lastMarketedAt)) : 9999
  const daysToStart = daysBetween(trip.start_date)
  const hasNewsletter = channelsUsed.includes('Newsletter') || channelsUsed.includes('Uutiskirje')
  const hasSocial = channelsUsed.some((c) => ['Facebook', 'Instagram', 'LinkedIn'].includes(c))

  let score = 0
  if (!lastMarketedAt) score += 60
  else if (daysSince >= 30) score += 50
  else if (daysSince >= 21) score += 35
  else if (daysSince >= 14) score += 20
  if (daysToStart <= 30) score += 50
  else if (daysToStart <= 60) score += 35
  else if (daysToStart <= 90) score += 25
  if (!hasNewsletter) score += 25
  if (!hasSocial) score += 20
  if (lastMarketedAt && daysSince <= 7) score -= 50
  if (trip.status !== 'active') score = -999

  return {
    ...trip,
    last_marketed_at: lastMarketedAt,
    channels_used: channelsUsed,
    days_since_marketed: daysSince,
    days_to_start: daysToStart,
    priority_score: score,
    has_newsletter: hasNewsletter,
    has_social: hasSocial,
  }
}

export async function getTripsWithPriority() {
  const { data: trips, error: tripsError } = await supabase.from('trips').select('*').order('start_date')
  if (tripsError) throw new Error(tripsError.message)

  const { data: actions, error: actionsError } = await supabase
    .from('marketing_actions')
    .select('*, channels(name)')
  if (actionsError) throw new Error(actionsError.message)

  return (trips || [])
    .map((trip) => scoreTrip(trip, actions || []))
    .filter((trip) => trip.priority_score > -999)
}

export async function getTripWithPriority(id: string) {
  const trips = await getTripsWithPriority()
  return trips.find((trip) => trip.id === id) || null
}

export async function getChannels() {
  const { data, error } = await supabase.from('channels').select('*').order('name')
  if (error) throw new Error(error.message)
  return data || []
}
export async function getMarketingActionsForTrip(tripId: string) {
  const { data, error } = await supabase
    .from('marketing_actions')
    .select('*, channels(name)')
    .eq('trip_id', tripId)
    .order('action_date', { ascending: false })

  if (error) throw new Error(error.message)

  return data || []
}
