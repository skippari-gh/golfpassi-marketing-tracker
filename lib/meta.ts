type MetaAccount = { id: string; name: string; account_id?: string; account_status?: number; currency?: string }

async function graph(path: string, params: Record<string,string> = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN missing')
  const url = new URL('https://graph.facebook.com/v24.0/' + path.replace(/^\//,''))
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value)
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Meta API failed (${response.status}): ${body?.error?.message || 'Unknown error'}`)
  return body
}

export async function getMetaAdAccounts(): Promise<MetaAccount[]> {
  const json = await graph('me/adaccounts', { fields: 'id,name,account_id,account_status,currency', limit: '100' })
  return json.data || []
}
