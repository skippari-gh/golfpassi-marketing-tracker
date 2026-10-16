import { identifySearchOpportunities } from '../lib/search-console-analysis'
import type { SearchConsoleRow } from '../lib/search-console'

const sample: SearchConsoleRow[] = [
  { query: 'golfmatkat portugali', page: 'https://golfpassi.fi/portugali/', clicks: 12, impressions: 1200, ctr: 0.01, position: 7 },
  { query: 'golfmatkat espanja', page: 'https://golfpassi.fi/espanja/', clicks: 20, impressions: 400, ctr: 0.05, position: 14 },
  { query: 'golfpassi', page: 'https://golfpassi.fi/', clicks: 700, impressions: 950, ctr: 0.73, position: 1 },
  { query: 'too small', page: 'https://golfpassi.fi/test/', clicks: 0, impressions: 2, ctr: 0, position: 6 },
]

export function runSeoAnalysisAssertions() {
  const actual = identifySearchOpportunities(sample)
  if (actual.length !== 2) throw new Error('Expected exactly two SEO opportunities')
  if (!actual.some(row => row.query === 'golfmatkat portugali')) throw new Error('Missing low-CTR opportunity')
  if (!actual.some(row => row.query === 'golfmatkat espanja')) throw new Error('Missing near-first-page opportunity')
  if (actual.some(row => row.query === 'golfpassi')) throw new Error('High-CTR branded query was incorrectly flagged')
  if (actual.some(row => row.query === 'too small')) throw new Error('Low-impression query was incorrectly flagged')
  if (identifySearchOpportunities(sample, 1).length !== 1) throw new Error('Limit was not respected')
  return true
}
