export type CompetitorSnapshot = {
  competitorId: string
  sourceUrl: string
  capturedAt: string
  offers: CompetitorOffer[]
}
export type CompetitorOffer = {
  stableId: string
  destination: string
  departureDate: string | null
  durationNights: number | null
  priceEur: number | null
  included: string[]
}
export type CompetitorChange = {
  competitorId: string
  sourceUrl: string
  observedAt: string
  kind: 'new_offer' | 'removed_offer' | 'price_changed' | 'departure_changed' | 'inclusions_changed'
  offerId: string
  before: CompetitorOffer | null
  after: CompetitorOffer | null
  note: string
}

// Pure comparison only: no scraping, network calls, storage, or publishing.
// Input snapshots must come from an approved, provenance-aware collector.
export function compareCompetitorSnapshots(before: CompetitorSnapshot, after: CompetitorSnapshot): CompetitorChange[] {
  if (before.competitorId !== after.competitorId || before.sourceUrl !== after.sourceUrl) {
    throw new Error('Cannot compare unrelated sources')
  }
  if (Number.isNaN(Date.parse(before.capturedAt)) || Number.isNaN(Date.parse(after.capturedAt)) ||
      Date.parse(after.capturedAt) <= Date.parse(before.capturedAt)) {
    throw new Error('Snapshots must be valid and chronologically ordered')
  }
  const toMap = (snapshot: CompetitorSnapshot) => {
    const result = new Map<string, CompetitorOffer>()
    for (const offer of snapshot.offers) {
      if (!offer.stableId.trim() || result.has(offer.stableId)) throw new Error('Duplicate or missing stable offer ID')
      result.set(offer.stableId, offer)
    }
    return result
  }
  const oldOffers = toMap(before)
  const newOffers = toMap(after)
  const output: CompetitorChange[] = []
  const emit = (kind: CompetitorChange['kind'], id: string, a: CompetitorOffer | null, b: CompetitorOffer | null, note: string) =>
    output.push({ competitorId: after.competitorId, sourceUrl: after.sourceUrl, observedAt: after.capturedAt,
      kind, offerId: id, before: a, after: b, note })

  for (const [id, newer] of newOffers) {
    const older = oldOffers.get(id)
    if (!older) { emit('new_offer', id, null, newer, 'Uusi vertailtava tarjous'); continue }
    if (older.priceEur !== newer.priceEur && older.priceEur != null && newer.priceEur != null)
      emit('price_changed', id, older, newer, 'Hinta on muuttunut; varmista paketin vertailukelpoisuus')
    if (older.departureDate !== newer.departureDate && older.departureDate !== null && newer.departureDate !== null)
      emit('departure_changed', id, older, newer, 'Lähtöpäivä on muuttunut')
    if ([...older.included].sort().join('|') !== [...newer.included].sort().join('|'))
      emit('inclusions_changed', id, older, newer, 'Paketin ilmoitettu sisältö on muuttunut')
  }
  // Treat disappearance only as a candidate: page extraction or paging
  // changes must be ruled out before concluding an offer was removed.
  for (const [id, older] of oldOffers) {
    if (!newOffers.has(id)) emit('removed_offer', id, older, null, 'Tarjous ei näy uusimmassa aineistossa – tarkista käsin')
  }
  return output.sort((a, b) => a.offerId.localeCompare(b.offerId) || a.kind.localeCompare(b.kind))
}
