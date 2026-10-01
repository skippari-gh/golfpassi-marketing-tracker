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


export type MetaOrganicPost = {
  id: string
  message?: string
  created_time?: string
  permalink_url?: string
}

export async function getMetaOrganicDashboard(days = 30) {
  const pageId = process.env.META_PAGE_ID || '134638476565968'
  const sinceUnix = Math.floor((Date.now() - (days - 1) * 86400000) / 1000).toString()
  const page = await graph(pageId, { fields: 'id,name,fan_count,followers_count,instagram_business_account{id,username,followers_count,media_count}' })
  const posts = await graph(`${pageId}/posts`, {
    fields: 'id,message,created_time,permalink_url',
    since: sinceUnix,
    limit: '50'
  })
  let instagramMedia: unknown[] = []
  const instagramId = page?.instagram_business_account?.id
  if (instagramId) {
    const ig = await graph(`${instagramId}/media`, {
      fields: 'id,caption,media_type,timestamp,permalink,like_count,comments_count',
      since: sinceUnix,
      limit: '50'
    })
    instagramMedia = ig.data || []
  }
  return {
    facebook: {
      id: page.id,
      name: page.name,
      fans: Number(page.fan_count || 0),
      followers: Number(page.followers_count || 0),
      posts: (posts.data || []) as MetaOrganicPost[],
    },
    instagram: page.instagram_business_account ? {
      id: page.instagram_business_account.id,
      username: page.instagram_business_account.username,
      followers: Number(page.instagram_business_account.followers_count || 0),
      mediaCount: Number(page.instagram_business_account.media_count || 0),
      media: instagramMedia,
    } : null,
  }
}
