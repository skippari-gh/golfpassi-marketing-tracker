import { requireMarketingIntelligenceUser } from '../../../../lib/marketing-intelligence-auth'
import { getSearchConsoleQueries } from '../../../../lib/search-console'
import { identifySearchOpportunities } from '../../../../lib/search-console-analysis'

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
  const iso = (date: Date) => date.toISOString().slice(0, 10)
  try {
    const rows = await getSearchConsoleQueries(iso(start), iso(end), 1000)
    const opportunities = identifySearchOpportunities(rows, 20)
    return Response.json({
      property: process.env.GSC_SITE_URL, startDate: iso(start), endDate: iso(end),
      fetchedRows: rows.length, opportunities,
      retrievedAt: new Date().toISOString(), source: 'google-search-console',
    }, { headers })
  } catch (error) {
    // Do not expose upstream response bodies, tokens or identities.
    console.error('Search Console query failed', error instanceof Error ? error.name : 'unknown')
    return Response.json({ error: 'Hakutietojen nouto epäonnistui. Tarkista palvelutilin oikeudet ja määritykset.' }, { status: 502, headers })
  }
}
