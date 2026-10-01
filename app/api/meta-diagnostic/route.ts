import { NextResponse } from 'next/server'

async function meta(path: string, params: Record<string,string> = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN missing')
  const url = new URL('https://graph.facebook.com/v24.0/' + path)
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v))
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' })
  const j = await r.json()
  if (!r.ok) throw new Error(j?.error?.message || 'Meta API error')
  return j
}

export async function GET() {
  try {
    const accountId = process.env.META_AD_ACCOUNT_ID || 'act_96351542'
    const [account, campaigns, insights, last30] = await Promise.all([
      meta(accountId, { fields: 'id,name,account_id,account_status,currency,timezone_name' }),
      meta(`${accountId}/campaigns`, { fields: 'id,name,status,effective_status', limit: '10' }),
      meta(`${accountId}/insights`, { fields: 'spend,impressions,reach,clicks', date_preset: 'maximum', level: 'account', limit: '1' }),
      meta(`${accountId}/insights`, { fields: 'spend,impressions,reach,clicks', date_preset: 'last_30d', level: 'account', limit: '1' }),
    ])
    return NextResponse.json({ account, campaigns: campaigns.data || [], maximumInsights: insights.data || [], last30Insights: last30.data || [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
