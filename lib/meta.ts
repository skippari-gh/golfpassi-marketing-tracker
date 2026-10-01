type MetaAccount = { id: string; name: string; account_id?: string; account_status?: number; currency?: string }
export type MetaInsight = {
  campaign_name?: string; spend?: string; impressions?: string; reach?: string; clicks?: string;
  ctr?: string; cpc?: string; cpm?: string; actions?: { action_type: string; value: string }[]
}

async function graph(path: string, params: Record<string,string> = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN missing')
  const url = new URL('https://graph.facebook.com/v24.0/' + path.replace(/^\//,''))
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value)
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' })
  const body = await response.json()
  if (!response.ok) throw new Error(`Meta API failed (${response.status}): ${body?.error?.message || 'Unknown error'}`)
  return body
}

export async function getMetaAdAccounts(): Promise<MetaAccount[]> {
  const json = await graph('me/adaccounts', { fields: 'id,name,account_id,account_status,currency', limit: '100' })
  return json.data || []
}

const GOLFPASSI_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || 'act_96351542'

export async function getMetaDashboard(days = 30) {
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0,10)
  const until = new Date().toISOString().slice(0,10)
  const fields = 'campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions'
  const accountFields = 'spend,impressions,reach,clicks,ctr,cpc,cpm,actions'
  const [total, campaigns] = await Promise.all([
    graph(`${GOLFPASSI_AD_ACCOUNT}/insights`, { fields: accountFields, time_range: JSON.stringify({since,until}), level: 'account', limit: '1' }),
    graph(`${GOLFPASSI_AD_ACCOUNT}/insights`, { fields, time_range: JSON.stringify({since,until}), level: 'campaign', limit: '100' }),
  ])
  return { total: (total.data?.[0] || null) as MetaInsight | null, campaigns: (campaigns.data || []) as MetaInsight[], since, until }
}
