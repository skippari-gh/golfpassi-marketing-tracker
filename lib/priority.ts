export function priorityReason(trip: any): string {
  const reasons: string[] = []
  if (!trip.last_marketed_at) reasons.push('matkaa ei ole markkinoitu vielä kertaakaan')
  else if (trip.days_since_marketed >= 30) reasons.push(`viimeisestä nostosta on ${trip.days_since_marketed} päivää`)
  else if (trip.days_since_marketed >= 14) reasons.push(`nostosta on kulunut ${trip.days_since_marketed} päivää`)

  const daysToStart = Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000)
  if (daysToStart <= 30) reasons.push('lähtöön on alle 30 päivää')
  else if (daysToStart <= 90) reasons.push('lähtöön on alle 90 päivää')

  if (!trip.has_newsletter) reasons.push('ei vielä uutiskirjeessä')
  if (!trip.has_social) reasons.push('ei vielä somessa')
  return reasons.join(', ') || 'tasainen ylläpitonosto'
}
