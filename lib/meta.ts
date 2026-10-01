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
  // Meta ad account uses Europe/Helsinki. Build the reporting dates in that timezone
  // instead of UTC so the requested range matches Ads Manager.
  const helsinkiDate = (offsetDays = 0) => {
    const d = new Date(Date.now() + offsetDays * 86400000)
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(d)
  }
  const since = helsinkiDate(-(days - 1))
  const until = helsinkiDate(0)
  const fields = 'campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions'
  const accountFields = 'spend,impressions,reach,clicks,ctr,cpc,cpm,actions'
  const timeRange = JSON.stringify({ since, until })
  const [total, campaigns] = await Promise.all([
    graph(`${GOLFPASSI_AD_ACCOUNT}/insights`, { fields: accountFields, time_range: timeRange, level: 'account', limit: '1' }),
    graph(`${GOLFPASSI_AD_ACCOUNT}/insights`, { fields, time_range: timeRange, level: 'campaign', limit: '100' }),
  ])
  return { total: (total.data?.[0] || null) as MetaInsight | null, campaigns: (campaigns.data || []) as MetaInsight[], since, until }
}
