import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Create the privileged client only when it is actually used.
// In preview builds credentials are intentionally absent: never substitute
// public anon credentials for admin operations.
let client: SupabaseClient | null = null

function resolveAdmin(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) {
    throw new Error('Supabase admin credentials are not configured in this environment')
  }
  client = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  return client
}

// Existing code imports a SupabaseClient. The proxy preserves that API while
// deferring environment access until a database operation is attempted.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const real = resolveAdmin()
    const value = Reflect.get(real, property, real)
    return typeof value === 'function' ? value.bind(real) : value
  },
})
