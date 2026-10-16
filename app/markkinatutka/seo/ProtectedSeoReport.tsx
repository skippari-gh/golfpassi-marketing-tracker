'use client'

import InsightCard from '../InsightCard'
import { suggestSeoCopy } from '../../../lib/seo-copy-suggestions'

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
  const [comparisons,setComparisons]=useState<Record<string, { snapshot?:{title:string|null;description:string|null;h1:string[];h2:string[];excerpts:string[];fetchedAt:string};analysis?:{title:string;description:string;heading:string;note:string};error?:string;loading?:boolean}>>({})
  async function inspectPage(item:Opportunity) {
    const id=item.query+'|'+item.page
    setComparisons(old=>({...old,[id]:{loading:true}}))
    try {
      if(!client)throw new Error('Kirjautuminen puuttuu')
      const {data:{session}}=await client.auth.getSession()
      if(!session)throw new Error('Kirjaudu ensin sisään')
      const response=await fetch('/api/markkinatutka/page-analysis',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({url:item.page,query:item.query,ctr:item.ctr,position:item.position})})
      const data=await response.json()
      if(!response.ok)throw new Error(data.error||'Analyysi epäonnistui')
      setComparisons(old=>({...old,[id]:{snapshot:data.snapshot,analysis:data.analysis}}))
    }catch(e){setComparisons(old=>({...old,[id]:{error:e instanceof Error?e.message:'Analyysi epäonnistui'}}))}
  }

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
      <div style={{display:'grid',gap:14}}>
        {report.opportunities.map(item => <InsightCard key={item.query + item.page} insight={{
          title: 'Hakusana ”' + item.query + '” tarjoaa tarkistettavaa',
          analysis: item.position <= 10
            ? 'Sivu saa hakunäyttöjä hyviltä sijoilta, mutta suhteellisen vähän klikkauksia. Hakutuloksen kiinnostavuutta kannattaa selvittää.'
            : 'Sivu löytyy hakutuloksista, mutta keskimääräinen sijoitus voi rajoittaa kävijämääriä.',
          action: item.position <= 10
            ? 'Vertaa sivun otsikkoa ja hakutulostekstiä siihen, mitä hakija todennäköisesti etsii. Tarkista tulos eri kyselyillä ennen muutoksia.'
            : 'Tarkista sivun sisältö ja hakijan tavoite. Selvitä, voisiko tärkeimpiin kysymyksiin vastata nykyistä paremmin.',
          rationale: item.reason + ' Tiedot osoittavat mahdollisen parannuskohteen, eivät muutoksen varmaa vaikutusta.',
          caveat: 'Search Console näyttää hakutulosten havaintoja, ei suoraan matkavarausten tai sisältömuutosten vaikutusta.',
          source: 'Google Search Console: ' + report.property + ' · ' + report.startDate + '–' + report.endDate,
          confidence: 'Sääntöpohjainen tarkistusehdotus, ei vahvistettu syy-yhteys',
          details: <><button type="button" disabled={!!comparisons[item.query+'|'+item.page]?.loading} onClick={()=>void inspectPage(item)} style={{padding:'10px 14px',background:'#003c70',color:'white',border:0,borderRadius:8,cursor:'pointer'}}>{comparisons[item.query+'|'+item.page]?.loading?'Luetaan sivua…':'Lue nykyinen sivu ja vertaa ehdotukseen'}</button>
          {comparisons[item.query+'|'+item.page]?.error&&<p role="alert">{comparisons[item.query+'|'+item.page]?.error}</p>}
          {comparisons[item.query+'|'+item.page]?.snapshot&&<section style={{background:'#f3f8fb',borderRadius:12,padding:16,marginTop:14}}>
            <strong>Nykyinen julkinen sivu – {comparisons[item.query+'|'+item.page].snapshot?.fetchedAt}</strong>
            <p><strong>Nykyinen Google-otsikko:</strong> {comparisons[item.query+'|'+item.page].snapshot?.title||'Puuttuu'}</p>
            <p><strong>Nykyinen metakuvaus:</strong> {comparisons[item.query+'|'+item.page].snapshot?.description||'Puuttuu'}</p>
            <p><strong>Nykyinen pääotsikko:</strong> {comparisons[item.query+'|'+item.page].snapshot?.h1.join(' / ')||'Puuttuu'}</p>
            <p><strong>Väliotsikot:</strong> {comparisons[item.query+'|'+item.page].snapshot?.h2.join(' / ')||'Ei löydetty'}</p>
            <p><strong>Tekstinäyte:</strong> {comparisons[item.query+'|'+item.page].snapshot?.excerpts.slice(0,3).join(' ')||'Ei löydetty'}</p>
            <p><strong>Vertailun johtopäätös:</strong> {comparisons[item.query+'|'+item.page].analysis?.title}. {comparisons[item.query+'|'+item.page].analysis?.description}. {comparisons[item.query+'|'+item.page].analysis?.heading}.</p>
            <p>{comparisons[item.query+'|'+item.page].analysis?.note}</p>
          </section>}
          <SeoCopyDraft item={item} /><p>Sivu: {item.page}</p><p>Klikkaukset: {nf.format(item.clicks)} · Näyttökerrat: {nf.format(item.impressions)} · Klikkausosuus (CTR): {(item.ctr*100).toFixed(1)} % · Keskimääräinen sijoitus: {item.position.toFixed(1)}</p><p>CTR tarkoittaa, kuinka moni näyttökerta johti klikkaukseen.</p></>,
        }} />)}
      </div>
    </div>}
  </section>
}

function SeoCopyDraft({item}:{item:Opportunity}) {
  const draft=suggestSeoCopy(item)
  return <section style={{background:'#f0f7fb',padding:16,borderRadius:12,margin:'12px 0'}}>
    <h4>Automaattinen tekstiehdotus – vaatii sivun tarkistamisen</h4>
    <p><strong>Hakujen kohdennus:</strong> {draft.relatedQueries.join(', ')}</p>
    <p><strong>Google-otsikko:</strong> {draft.title}</p>
    <p><strong>Metakuvaus:</strong> {draft.description}</p>
    <p><strong>Sivun pääotsikko:</strong> {draft.heading}</p>
    <p><strong>Ingressi:</strong> {draft.intro}</p>
    <p><strong>Perustelu:</strong> {draft.explanation}</p>
    <strong>Ennen hyväksyntää:</strong>
    <ul>{draft.verification.map(v=><li key={v}>{v}</li>)}</ul>
  </section>
}
