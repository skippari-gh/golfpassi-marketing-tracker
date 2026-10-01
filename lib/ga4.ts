import { createSign } from 'node:crypto'

type Row = { dimensions: string[]; metrics: number[] }

function base64url(value: string) {
  return Buffer.from(value).toString('base64url')
}

async function accessToken() {
  const credentialsJson = process.env.GA4_SERVICE_ACCOUNT_JSON
  let email = process.env.GA4_CLIENT_EMAIL
  let key = process.env.GA4_PRIVATE_KEY

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson)
      email = credentials.client_email || email
      key = credentials.private_key || key
    } catch {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON is not valid JSON')
    }
  }

  if (!email || !key) throw new Error('GA4 credentials missing')
  key = key.replace(/\\n/g, '\n').trim()

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  const jwt = `${unsigned}.${signer.sign(key, 'base64url')}`
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = await response.text()
    let detail = body
    try {
      const parsed = JSON.parse(body)
      detail = parsed?.error_description || parsed?.error || body
    } catch {}
    throw new Error(`Google authentication failed (${response.status}): ${String(detail).slice(0, 500)}`)
  }
  return (await response.json()).access_token as string
}

async function report(dimensions: string[], metrics: string[], days: number, limit = 20): Promise<Row[]> {
  const property = process.env.GA4_PROPERTY_ID
  if (!property) throw new Error('GA4 property missing')
  const token = await accessToken()
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
      dimensions: dimensions.map(name => ({ name })),
      metrics: metrics.map(name => ({ name })),
      limit,
      orderBys: metrics.length ? [{ metric: { metricName: metrics[0] }, desc: true }] : undefined,
    }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = await response.text()
    let detail = body
    try {
      const parsed = JSON.parse(body)
      detail = parsed?.error?.message || body
    } catch {}
    throw new Error(`GA4 report failed (${response.status}): ${String(detail).slice(0, 500)}`)
  }
  const json = await response.json()
  return (json.rows || []).map((row: any) => ({
    dimensions: (row.dimensionValues || []).map((v: any) => v.value),
    metrics: (row.metricValues || []).map((v: any) => Number(v.value)),
  }))
}

export async function getGa4Dashboard(days = 30) {
  const [summary, channels, pages] = await Promise.all([
    report([], ['activeUsers','newUsers','sessions','screenPageViews','engagementRate','keyEvents'], days, 1),
    report(['sessionDefaultChannelGroup'], ['sessions','activeUsers'], days, 10),
    report(['pagePath'], ['screenPageViews','activeUsers'], days, 15),
  ])
  return { summary: summary[0]?.metrics || [], channels, pages }
}
