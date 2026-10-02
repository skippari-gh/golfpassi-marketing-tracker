type MetaAccount = { id: string; name: string; account_id?: string; account_status?: number; currency?: string }
export type MetaInsight = {
  campaign_name?: string; spend?: string; impressions?: string; reach?: string; clicks?: string;
  ctr?: string; cpc?: string; cpm?: string; actions?: { action_type: string; value: string }[]
}

async function graph(path: string, params: Record<string,string> = {}, tokenOverride?: string) {
  const token = tokenOverride || process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN missing')
  const url = new URL('https://graph.facebook.com/v26.0/' + path.replace(/^\//,''))
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
  reactions?: { summary?: { total_count?: number } }
  comments?: { summary?: { total_count?: number } }
  shares?: { count?: number }
}

type OrganicRow = {
  id: string; text: string; createdTime?: string; permalink?: string; impressions: number; reach: number;
  engagements: number; clicks: number; likes: number; comments: number; shares: number; saved: number
}

function insightValue(json: any, name: string) {
  const row = json?.data?.find((x: any) => x.name === name)
  const value = row?.values?.[0]?.value ?? row?.values?.at?.(-1)?.value ?? row?.total_value?.value ?? 0
  return Number(value || 0)
}

async function safeGraph(path: string, params: Record<string,string> = {}, tokenOverride?: string) {
  try { return await graph(path, params, tokenOverride) } catch { return null }
}

export async function getMetaOrganicDashboard(days = 30) {
  const pageId = process.env.META_PAGE_ID || '134638476565968'
  const sinceUnix = Math.floor((Date.now() - (days - 1) * 86400000) / 1000).toString()
  // Organic Page/Instagram endpoints are most reliable with the Page access token.
  // Resolve it from the valid user token instead of using the user token directly.
  const accounts = await graph('me/accounts', { fields: 'id,name,access_token', limit: '100' })
  const account = (accounts.data || []).find((x: any) => String(x.id) === String(pageId))
  if (!account?.access_token) throw new Error(`Golfpassi Page access token missing for page ${pageId}`)
  const pageToken = String(account.access_token)
  const page = await graph(pageId, { fields: 'id,name,fan_count,followers_count,instagram_business_account{id,username,followers_count,media_count}' }, pageToken)
  const posts = await graph(`${pageId}/feed`, {
    fields: 'id,message,created_time,permalink_url,reactions.limit(0).summary(true),comments.limit(0).summary(true),shares',
    since: sinceUnix, limit: '50'
  }, pageToken)
  const fbPosts = (posts.data || []) as MetaOrganicPost[]
  const fbRows: OrganicRow[] = await Promise.all(fbPosts.map(async post => {
    // Meta retired post_impressions_unique in 2026. Request current metrics
    // individually so one unavailable metric cannot zero the whole post.
    const metricNames = ['post_media_view','post_total_media_view_unique','post_engaged_users','post_clicks']
    const vals: Record<string,number> = {}
    await Promise.all(metricNames.map(async name => {
      const j = await safeGraph(`${post.id}/insights`, { metric: name }, pageToken)
      vals[name] = insightValue(j, name)
    }))
    const likes = Number(post.reactions?.summary?.total_count || 0)
    const comments = Number(post.comments?.summary?.total_count || 0)
    const shares = Number(post.shares?.count || 0)
    return {
      id: post.id, text: post.message || '(julkaisu ilman tekstiä)', createdTime: post.created_time, permalink: post.permalink_url,
      impressions: vals.post_media_view || 0, reach: vals.post_total_media_view_unique || 0,
      engagements: vals.post_engaged_users || likes + comments + shares, clicks: vals.post_clicks || 0,
      likes, comments, shares, saved: 0
    }
  }))

  let igRows: OrganicRow[] = []
  const instagramId = page?.instagram_business_account?.id
  if (instagramId) {
    const ig = await graph(`${instagramId}/media`, {
      fields: 'id,caption,media_type,timestamp,permalink,like_count,comments_count',
      since: sinceUnix, limit: '50'
    }, pageToken)
    igRows = await Promise.all((ig.data || []).map(async (m: any) => {
      // Meta has changed IG metric names over time. Request individually so one retired metric
      // cannot make the whole organic dashboard fail.
      const names = ['views','reach','total_interactions','shares','saved']
      const vals: Record<string,number> = {}
      await Promise.all(names.map(async name => {
        const j = await safeGraph(`${m.id}/insights`, { metric: name }, pageToken)
        vals[name] = insightValue(j, name)
      }))
      const likes = Number(m.like_count || 0), comments = Number(m.comments_count || 0)
      return {
        id: m.id, text: m.caption || '(julkaisu ilman tekstiä)', createdTime: m.timestamp, permalink: m.permalink,
        impressions: vals.views || 0, reach: vals.reach || 0,
        engagements: vals.total_interactions || likes + comments + (vals.shares || 0) + (vals.saved || 0),
        clicks: 0, likes, comments, shares: vals.shares || 0, saved: vals.saved || 0
      }
    }))
  }

  const totals = (rows: OrganicRow[]) => rows.reduce((a,r) => ({
    impressions:a.impressions+r.impressions, reach:a.reach+r.reach, engagements:a.engagements+r.engagements,
    clicks:a.clicks+r.clicks, likes:a.likes+r.likes, comments:a.comments+r.comments, shares:a.shares+r.shares, saved:a.saved+r.saved
  }), {impressions:0,reach:0,engagements:0,clicks:0,likes:0,comments:0,shares:0,saved:0})

  return {
    facebook: { id: page.id, name: page.name, fans: Number(page.fan_count||0), followers: Number(page.followers_count||0), total: totals(fbRows), posts: fbRows.sort((a,b)=>b.engagements-a.engagements) },
    instagram: instagramId ? { id: instagramId, username: page.instagram_business_account.username, followers: Number(page.instagram_business_account.followers_count||0), mediaCount: Number(page.instagram_business_account.media_count||0), total: totals(igRows), media: igRows.sort((a,b)=>b.engagements-a.engagements) } : null
  }
}
