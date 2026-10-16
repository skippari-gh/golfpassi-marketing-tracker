import 'server-only'
import { createClient } from '@supabase/supabase-js'

export async function requireMarketingIntelligenceUser(authorization: string | null): Promise<boolean> {
  const emailList = (process.env.MARKKINATUTKA_ALLOWED_EMAILS || '')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
  const token = authorization?.match(/^Bearer ([A-Za-z0-9._~-]+)$/)?.[1]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!emailList.length || !token || !url || !anonKey) return false
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    // Supabase verifies token against Auth server. Never rely on decoded claims alone.
    const { data, error } = await client.auth.getUser(token)
    const email = data.user?.email?.toLowerCase()
    return !error && !!email && !!data.user?.email_confirmed_at && emailList.includes(email)
  } catch {
    return false
  }
}
