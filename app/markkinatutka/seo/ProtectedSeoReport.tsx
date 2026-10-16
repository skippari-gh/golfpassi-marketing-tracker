'use client'

import { useEffect, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Opportunity = { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number; reason: string }
type Report = { property: string; startDate: string; endDate: string; fetchedRows: number; opportunities: Opportunity[]; retrievedAt: string }

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
}
const client: SupabaseClient | null = browserClient()
const nf = new Intl.NumberFormat('fi-FI')

export default function ProtectedSeoReport() {
  const [email, setEmail] = useState('')
  const [isSignedIn, setSignedIn] = useState(false)
  const [message, setMessage] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!client) return
    void client.auth.getSession().then(({ data }) => setSignedIn(!!data.session))
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session)
      if (!session) setReport(null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function sendSignInLink() {
    if (!client) return
    setMessage('')
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + '/markkinatutka/seo' },
    })
    setMessage(error ? 'Kirjautumislinkkiä ei voitu lähettää. Varmista, että tilisi on luotu ja kirjautuminen on sallittu.' : 'Tarkista sähköpostisi ja avaa kirjautumislinkki.')
  }

  async function loadReport() {
    if (!client) return
    setLoading(true)
    setMessage('')
    setReport(null)
    try {
      const { data: { session } } = await client.auth.getSession()
      if (!session) throw new Error('Kirjaudu ensin sisään.')
      const response = await fetch('/api/markkinatutka/seo', {
        headers: { Authorization: 'Bearer ' + session.access_token },
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(String(data.error || 'Haku epäonnistui'))
      setReport(data as Report)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tietojen haku epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return <section style={{ marginTop: 26, border: '1px solid #cbdde7', padding: 22, borderRadius: 14 }}>
    <h2>Oikea Search Console -data</h2>
    <p>Vain valtuutetuille käyttäjille. Google-data haetaan palvelimelta vasta tunnistautumisen jälkeen.</p>
    {!client && <p>Kirjautuminen ei ole määritelty.</p>}
    {client && !isSignedIn && <form onSubmit={event => { event.preventDefault(); void sendSignInLink() }}>
      <label htmlFor="mt-email">Työsähköposti</label>
      <input id="mt-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required style={{ display: 'block', padding: 10, margin: '8px 0', width: 'min(100%,360px)' }} />
      <button type="submit" style={{ padding: '10px 16px' }}>Lähetä kirjautumislinkki</button>
    </form>}
    {client && isSignedIn && <div>
      <button type="button" disabled={loading} onClick={() => void loadReport()} style={{ padding: '10px 16px', marginRight: 12 }}>{loading ? 'Haetaan…' : 'Hae viimeiset 28 päivää'}</button>
      <button type="button" onClick={() => void client.auth.signOut()}>Kirjaudu ulos</button>
    </div>}
    {message && <p role="status">{message}</p>}
    {report && <div>
      <p><strong>Lähde:</strong> {report.property} · {report.startDate}–{report.endDate} · {nf.format(report.fetchedRows)} kysely-sivuriviä</p>
      {report.opportunities.length === 0 && <p>Tarkistettavia mahdollisuuksia ei löytynyt valitulla sääntöjoukolla.</p>}
      {report.opportunities.map(item => <article key={item.query + item.page} style={{ borderTop: '1px solid #d8e6ed', paddingTop: 14, marginTop: 14 }}>
        <h3>{item.query}</h3>
        <p style={{ overflowWrap: 'anywhere' }}>{item.page}</p>
        <p>Kl.: {nf.format(item.clicks)} · Näytöt: {nf.format(item.impressions)} · CTR: {(item.ctr * 100).toFixed(1)} % · Sijoitus: {item.position.toFixed(1)}</p>
        <p>{item.reason}</p>
      </article>)}
    </div>}
  </section>
}
