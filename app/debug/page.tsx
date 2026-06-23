import { supabase } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const env = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
  }

  const { data, error } = await supabase.from('trips').select('*')

  return (
    <main style={{ padding: 40 }}>
      <h1>Debug</h1>
      <pre>{JSON.stringify({ env, count: data?.length ?? 0, error }, null, 2)}</pre>
    </main>
  )
}
