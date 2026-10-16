import { requireMarketingIntelligenceUser } from '../../../../lib/marketing-intelligence-auth'
import { getSearchConsoleQueries, getSearchConsoleDailyTotals } from '../../../../lib/search-console'
import { identifySearchOpportunities } from '../../../../lib/search-console-analysis'
import { groupSeoOpportunitiesByDestination } from '../../../../lib/destination-seo-groups'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' }
  if (!(await requireMarketingIntelligenceUser(request.headers.get('authorization')))) {
    return Response.json({ error: 'Kirjautuminen tai käyttöoikeus puuttuu' }, { status: 401, headers })
  }
  // Reject unknown host/origin contexts if request headers are provided.
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Virheellinen alkuperä' }, { status: 403, headers })
  }
  if (!process.env.GSC_SITE_URL || !(process.env.GSC_SERVICE_ACCOUNT_JSON || process.env.GA4_SERVICE_ACCOUNT_JSON || process.env.GSC_CLIENT_EMAIL || process.env.GA4_CLIENT_EMAIL)) {
    return Response.json({ error: 'Search Console -yhteys ei ole vielä määritelty tähän ympäristöön' }, { status: 503, headers })
  }
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 3)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 27)
  const previousEnd = new Date(start)
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1)
  const previousStart = new Date(previousEnd)
  previousStart.setUTCDate(previousStart.getUTCDate() - 27)
  const iso = (date: Date) => date.toISOString().slice(0, 10)
  try {
    const [rows, daily, previousDaily] = await Promise.all([getSearchConsoleQueries(iso(start), iso(end), 1000),getSearchConsoleDailyTotals(iso(start),iso(end)),getSearchConsoleDailyTotals(iso(previousStart),iso(previousEnd))])
    const opportunities = identifySearchOpportunities(rows, 20)
    return Response.json({
      property: process.env.GSC_SITE_URL, startDate: iso(start), endDate: iso(end),
      fetchedRows: rows.length, opportunities, daily,
      previousDaily, previousStartDate:iso(previousStart), previousEndDate:iso(previousEnd),
      destinationGroups: groupSeoOpportunitiesByDestination(opportunities),
      retrievedAt: new Date().toISOString(), source: 'google-search-console',
    }, { headers })
  } catch (error) {
    // Do not expose upstream response bodies, tokens or identities.
    const message = error instanceof Error ? error.message : ''
    const safeReason = /^Search Console (authorization failed|data request failed) \(\d{3}\)$/.test(message) ? message : /service account is not configured/.test(message) ? 'Service account is not configured' : /Invalid key|DECODER routines|bad decrypt|PEM routines/.test(message) ? 'Service account private key is invalid' : /JSON/.test(message) ? 'Service account JSON is invalid' : 'Unknown Search Console integration failure'
    console.error('Search Console query failed:', safeReason)
    return Response.json({ error: 'Hakutietojen nouto epäonnistui. Tarkista palvelutilin oikeudet ja määritykset.' }, { status: 502, headers })
  }
}
