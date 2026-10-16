import { compareCompetitorSnapshots, type CompetitorSnapshot } from '../lib/competitor-snapshot-diff'

const before: CompetitorSnapshot = {
  competitorId: 'demo', sourceUrl: 'https://example.org/offers', capturedAt: '2026-10-15T08:00:00Z',
  offers: [
    { stableId: 'a', destination: 'Madeira', departureDate: '2027-03-01', durationNights: 7, priceEur: 1299, included: ['lennot'] },
    { stableId: 'b', destination: 'Málaga', departureDate: '2027-04-01', durationNights: 7, priceEur: 1399, included: ['lennot'] },
  ],
}
const after: CompetitorSnapshot = {
  ...before, capturedAt: '2026-10-16T08:00:00Z',
  offers: [
    { ...before.offers[0], priceEur: 1349, included: ['lennot', 'kuljetus'] },
    { stableId: 'c', destination: 'Algarve', departureDate: '2027-05-01', durationNights: 7, priceEur: 1499, included: [] },
  ],
}
export function testCompetitorSnapshotDiff() {
  const changes = compareCompetitorSnapshots(before, after)
  const kinds = changes.map(change => change.kind)
  for (const expected of ['price_changed', 'inclusions_changed', 'new_offer', 'removed_offer']) {
    if (!kinds.includes(expected as typeof kinds[number])) throw new Error('Missing change: ' + expected)
  }
  if (changes.length !== 4) throw new Error('Incorrect change count')
  let rejected = false
  try { compareCompetitorSnapshots(after, before) } catch { rejected = true }
  if (!rejected) throw new Error('Reverse chronological snapshots should be rejected')
  return true
}
