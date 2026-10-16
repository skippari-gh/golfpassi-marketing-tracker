import type { SearchConsoleRow } from './search-console'

export type SearchOpportunity = {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  reason: string
  priority: number
}

/**
 * Pure, reproducible heuristic. These are candidate opportunities,
 * not claims that changing a page will necessarily improve ranking.
 */
export function identifySearchOpportunities(rows: SearchConsoleRow[], maxResults = 20): SearchOpportunity[] {
  // Brand navigational queries need their own analysis, not generic acquisition SEO advice.
  const brandQuery = /golf\s*passi/i
  const candidates = rows
    .filter(row =>
      Number.isFinite(row.impressions) && row.impressions >= 30 &&
      Number.isFinite(row.ctr) && row.ctr >= 0 && row.ctr <= 1 &&
      Number.isFinite(row.position) && row.position > 0 &&
      row.query.trim().length > 0 && !brandQuery.test(row.query) && row.page.startsWith('https://')
    )
    .map(row => {
      const lowCtr = row.ctr < 0.03 && row.position <= 10
      const nearFirstPage = row.position > 10 && row.position <= 20
      if (!lowCtr && !nearFirstPage) return null
      const priority = Math.round(Math.log1p(row.impressions) * (lowCtr ? 12 : 8))
      return {
        ...row,
        reason: lowCtr
          ? 'Näkyvyyttä hakutuloksissa, mutta klikkausosuus alle 3 %. Tarkista hakutarkoitus sekä sivun otsikko ja kuvaus.'
          : 'Keskimääräinen sijoitus 11–20. Tutki sisällön kattavuutta, sisäisiä linkkejä ja hakutarkoitusta.',
        priority,
      }
    })
    .filter((row): row is SearchOpportunity => row !== null)
  return candidates.sort((a, b) => b.priority - a.priority || b.impressions - a.impressions)
    .slice(0, Math.max(1, Math.min(100, Math.floor(maxResults))))
}
