'use client'
import { demoInsights } from './demo-insights'
import {useState,type ReactNode} from 'react'
import { createClient } from '@supabase/supabase-js'
import { seoOpportunityToInsight, type MarketingInsight, type MeasuredSeoOpportunity } from '../../lib/marketing-insight-model'
import Link from 'next/link'


export default function MarkkinatutkaViewSwitch({professional}:{professional:ReactNode}){
 const [view,setView]=useState<'overview'|'workbench'>('overview')
 const [measured,setMeasured]=useState<MarketingInsight[]|null>(null)
 const [fetching,setFetching]=useState(false)
 const [error,setError]=useState('')
 const [period,setPeriod]=useState('')
 async function refreshMeasured(){
  if(fetching)return
  setFetching(true);setError('')
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL
   const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   if(!url||!key)throw new Error('Kirjautumista ei ole määritelty tähän ympäristöön.')
   const auth=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
   const {data:{session}}=await auth.auth.getSession()
   if(!session)throw new Error('Kirjaudu ensin SEO-sivulla, jotta voit tarkastella oikeaa dataa.')
   const response=await fetch('/api/markkinatutka/seo',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'})
   const report=await response.json()
   if(!response.ok)throw new Error(String(report.error||'Tietojen hakeminen epäonnistui.'))
   const dateRange=String(report.startDate)+'–'+String(report.endDate)
   setPeriod(dateRange)
   setMeasured((report.opportunities as MeasuredSeoOpportunity[]).map(x=>seoOpportunityToInsight(x,dateRange,String(report.property))))
  }catch(e){setMeasured(null);setError(e instanceof Error?e.message:'Tietojen haku epäonnistui.')}
  finally{setFetching(false)}
 }
 return <div>
  <nav aria-label="Näkymän valinta" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',margin:'24px 0'}}>
   <button type="button" aria-pressed={view==='overview'} onClick={()=>setView('overview')} style={{padding:'12px 20px',background:view==='overview'?'#003c70':'white',color:view==='overview'?'white':'#003c70',border:'1px solid #c7d9e6',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Yhteenveto</button>
   <button type="button" aria-pressed={view==='workbench'} onClick={()=>setView('workbench')} style={{padding:'12px 20px',background:view==='workbench'?'#003c70':'white',color:view==='workbench'?'white':'#003c70',border:'1px solid #c7d9e6',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Työpöytä</button>
   <span style={{fontSize:13,color:'#5f778a'}}>Sama tieto, eri tarkkuudella</span>
  </nav>
  <section style={{background:'#eef7fd',border:'1px solid #c9e1ef',padding:18,borderRadius:14,marginBottom:20}}>
   <strong style={{color:'#003c70'}}>Ajantasaiset SEO-havainnot</strong>
   <p style={{margin:'9px 0',lineHeight:1.55}}>Hae Googlen mitatut hakutiedot. Haussa käytetään samaa suojattua rajapintaa kuin SEO-työkalussa. Muut markkinoinnin osa-alueet ovat vielä esimerkkisisältöä.</p>
   <button type="button" onClick={()=>void refreshMeasured()} disabled={fetching} style={{padding:'10px 15px',background:'#003c70',border:0,color:'white',borderRadius:9}}>{fetching?'Haetaan…':'Hae ajantasaiset havainnot'}</button>
   {error&&<p role="alert">{error.includes('Search Console -yhteys')?'Google-hakutietojen yhteys odottaa määritystä testiympäristöön.':error.includes('Kirjautuminen tai käyttöoikeus')?'Kirjautuminen ei ole voimassa tai käyttöoikeus puuttuu.':error} <Link href="/markkinatutka/seo">Avaa kirjautuminen / SEO-työkalu →</Link></p>}
   {measured&&<p role="status">Google Search Console · {period} · {measured.length} tarkistettavaa havaintoa. Tämä ei mittaa suoraan myyntivaikutusta.</p>}
  </section>
  {view==='workbench'? <>{measured!==null&&<MeasuredInsights insights={measured} detailed/>}<details open={measured===null} style={{marginTop:20}}><summary style={{color:'#003c70',fontWeight:700,cursor:'pointer'}}>Työpöydän malliesimerkit ja työkalut</summary><p style={{fontSize:13}}>Seuraavat esimerkit eivät perustu mittauksiin.</p>{professional}</details></> :
   <section aria-label="Johdon yhteenveto">
    <h2 style={{color:'#003c70',fontSize:25,margin:'10px 0'}}>Tärkeimmät huomiot päätöksenteon tueksi</h2>
    <p style={{color:'#637b8f',lineHeight:1.6}}>{measured===null?'Alla on malliesimerkkejä. Hae mitatut SEO-havainnot yllä olevalla painikkeella.':'Alla näkyvät mitatut SEO-havainnot. Muut esimerkit löytyvät erikseen avattavasta osiosta.'}</p>
    <div style={{display:'grid',gap:14}}>
     {measured!==null&&<MeasuredInsights insights={measured}/>}
     {(measured===null)&&demoInsights.map((s,i)=><article key={s.id} style={{border:'1px solid #dbe7ef',background:'white',borderRadius:16,padding:'clamp(17px,3vw,25px)'}}>
      <small style={{fontWeight:700,color:'#547388'}}>{i+1}. {s.channel.toUpperCase()} · MALLIESIMERKKI</small>
      <h3 style={{fontSize:20,color:'#003c70',margin:'12px 0'}}>{s.title}</h3>
      <p style={{lineHeight:1.6}}><strong>Mitä havaittiin?</strong> {s.analysis}</p>
      <div style={{background:'#fff7ef',borderLeft:'4px solid #ff8200',borderRadius:8,padding:'13px 15px'}}>
       <strong>Mitä kannattaa tehdä?</strong><p style={{margin:'5px 0 0',lineHeight:1.6}}>{s.action}</p>
      </div>
      <p style={{lineHeight:1.6}}><strong>Miksi?</strong> {s.reason}</p>
      <Link href={s.href} style={{color:'#003c70',fontWeight:700}}>Tutustu analyysiin ja lähteisiin →</Link>
     </article>)}
    </div>
    {measured!==null&&<details style={{border:'1px solid #dbe7ef',padding:18,borderRadius:12,marginTop:18}}>
     <summary style={{cursor:'pointer',fontWeight:700,color:'#003c70'}}>Näytä malliesimerkit muista markkinoinnin aiheista</summary>
     <p>Seuraavat havainnot ovat täysin kuvitteellisia, eivät Golfpassin tuloksia.</p>
     {demoInsights.filter(s=>s.channel!=='SEO').map(s=><article key={s.id} style={{padding:'10px 0',borderTop:'1px solid #dbe7ef'}}>
      <strong>{s.title}</strong><p>{s.action}</p><Link href={s.href}>Avaa esimerkin työalue →</Link>
     </article>)}
    </details>}
    <p style={{fontSize:13,color:'#637b8f',marginTop:20}}>Vaihtamalla Työpöytä-näkymään näet myös yksityiskohtaiset tarkistukset, tehtäväpolut ja mittaussuunnitelmat.</p>
   </section>}
 </div>
}

function MeasuredInsights({insights,detailed=false}:{insights:MarketingInsight[];detailed?:boolean}){
 return <section aria-label="Oikeat SEO-havainnot" style={{display:'grid',gap:12,margin:'18px 0'}}>
  <h3 style={{color:'#003c70',margin:0}}>Googlesta mitatut SEO-havainnot</h3>
  {insights.length===0&&<p>Valituilla säännöillä ei löytynyt tarkistettavia SEO-havaintoja.</p>}
  {insights.map(s=><article key={s.id} style={{background:'#fff',border:'1px solid #c8dce9',borderRadius:14,padding:20}}>
   <small style={{color:'#516c81',fontWeight:700}}>MITATTU · {s.channel} · {s.priority} prioriteetti</small>
   <h4 style={{margin:'10px 0',color:'#003c70',fontSize:18}}>{s.title}</h4>
   <p><strong>Havainto: </strong>{s.analysis}</p>
   <p><strong>Suositus: </strong>{s.action}</p>
   <p><strong>Perustelu: </strong>{s.reason}</p>
   {detailed&&<details><summary style={{cursor:'pointer',fontWeight:700}}>Näytä lähde ja tarkemmat mittarit</summary><p>{s.detail}</p><p>Lähde: {s.source} · Ajanjakso: {s.observedPeriod}</p></details>}
   <Link href={s.href} style={{color:'#003c70',fontWeight:700}}>Tarkista SEO-sivulla →</Link>
  </article>)}
 </section>
}
