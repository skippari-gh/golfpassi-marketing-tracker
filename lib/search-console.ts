/**
 * Server-only Search Console data client for Marketing Intelligence.
 * Requires an explicitly authorized Search Console property.
 * Never call this module from client-side code or a public API route.
 */
import 'server-only'
import { createSign } from 'node:crypto'

export type SearchConsoleRow = {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

function base64url(value: string) {
  return Buffer.from(value).toString('base64url')
}

async function getReadOnlyToken(): Promise<string> {
  const credentials = process.env.GSC_SERVICE_ACCOUNT_JSON || process.env.GA4_SERVICE_ACCOUNT_JSON
  let email = process.env.GSC_CLIENT_EMAIL || process.env.GA4_CLIENT_EMAIL
  let key = process.env.GSC_PRIVATE_KEY || process.env.GA4_PRIVATE_KEY
  if (credentials) {
    const data = JSON.parse(credentials)
    email = data.client_email || email
    key = data.private_key || key
  }
  if (!email || !key) throw new Error('Search Console service account is not configured')
  key = key.replace(/\\n/g, '\n').trim()
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const signer = createSign('RSA-SHA256')
  const unsigned = header + '.' + payload
  signer.update(unsigned)
  const jwt = unsigned + '.' + signer.sign(key, 'base64url')
  const result = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    cache: 'no-store',
  })
  if (!result.ok) throw new Error('Search Console authorization failed (' + result.status + ')')
  const body = await result.json()
  if (typeof body.access_token !== 'string') throw new Error('Search Console access token missing')
  return body.access_token
}

/** Returns measured data; no estimates or AI ranking claims. */
export async function getSearchConsoleQueries(startDate: string, endDate: string, limit = 250): Promise<SearchConsoleRow[]> {
  const property = process.env.GSC_SITE_URL
  if (!property) throw new Error('GSC_SITE_URL is not configured')
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(startDate) || !datePattern.test(endDate) || startDate > endDate) {
    throw new Error('Invalid Search Console date interval')
  }
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000))
  const token = await getReadOnlyToken()
  const response = await fetch(
    'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(property) + '/searchAnalytics/query',
    {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions: ['query', 'page'], rowLimit: safeLimit }),
      cache: 'no-store',
    },
  )
  if (!response.ok) throw new Error('Search Console data request failed (' + response.status + ')')
  const json = await response.json()
  return (Array.isArray(json.rows) ? json.rows : []).map((row: any) => ({
    query: String(row.keys?.[0] || ''),
    page: String(row.keys?.[1] || ''),
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0),
  }))
}
