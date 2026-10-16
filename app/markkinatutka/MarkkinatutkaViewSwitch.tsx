'use client'
import { demoInsights } from './demo-insights'
import {useState,type ReactNode} from 'react'
import { createClient } from '@supabase/supabase-js'
import { seoOpportunityToInsight, type MarketingInsight, type MeasuredSeoOpportunity } from '../../lib/marketing-insight-model'
import Link from 'next/link'
import type { DestinationSeoGroup } from '../../lib/destination-seo-groups'


type SearchDay={date:string;clicks:number;impressions:number;ctr:number;position:number}
type Ga4Report={status:string;daily?:Array<{date:string;sessions:number;activeUsers:number;keyEvents:number}>;previousDaily?:Array<{date:string;sessions:number;activeUsers:number;keyEvents:number}>;keyEvents?:Array<{name:string;keyEvents:number}>}
export default function MarkkinatutkaViewSwitch({professional}:{professional:ReactNode}){
 const [view,setView]=useState<'overview'|'workbench'>('overview')
 const [measured,setMeasured]=useState<MarketingInsight[]|null>(null)
 const [destinations,setDestinations]=useState<DestinationSeoGroup[]>([])
 const [daily,setDaily]=useState<SearchDay[]>([])
 const [previousDaily,setPreviousDaily]=useState<SearchDay[]>([])
 const [ga4,setGa4]=useState<Ga4Report|null>(null)
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
   setDaily(Array.isArray(report.daily)?report.daily:[])
   setPreviousDaily(Array.isArray(report.previousDaily)?report.previousDaily:[])
   setGa4(report.ga4||{status:'not-configured'})
   setDestinations(Array.isArray(report.destinationGroups)?report.destinationGroups:[])
   setMeasured((report.opportunities as MeasuredSeoOpportunity[]).map(x=>seoOpportunityToInsight(x,dateRange,String(report.property))))
  }catch(e){setMeasured(null);setDestinations([]);setDaily([]);setPreviousDaily([]);setGa4(null);setError(e instanceof Error?e.message:'Tietojen haku epäonnistui.')}
  finally{setFetching(false)}
 }
 return <div>
  <nav aria-label="Näkymän valinta" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',margin:'24px 0'}}>
   <button type="button" aria-pressed={view==='overview'} onClick={()=>setView('overview')} style={{padding:'12px 20px',background:view==='overview'?'#003c70':'white',color:view==='overview'?'white':'#003c70',border:'1px solid #c7d9e6',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Yhteenveto</button>
   <button type="button" aria-pressed={view==='workbench'} onClick={()=>setView('workbench')} style={{padding:'12px 20px',background:view==='workbench'?'#003c70':'white',color:view==='workbench'?'white':'#003c70',border:'1px solid #c7d9e6',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Työpöytä</button>
   <span style={{fontSize:13,color:'#5f778a'}}>Sama tieto, eri tarkkuudella</span>
  </nav>
  <section style={{background:'#fff',border:'2px solid #b8d8ec',padding:'clamp(18px,3vw,28px)',borderRadius:16,marginBottom:20}}>
   <h2 style={{color:'#003c70',fontSize:24,margin:'0 0 7px'}}>Hakutiedot ja suositukset</h2>
   <p style={{margin:'9px 0',lineHeight:1.55}}>Hae Golfpassin mitatut hakutiedot. Suositukset ilmestyvät heti tähän alle, samaan näkymään.</p>
   <button type="button" onClick={()=>void refreshMeasured()} disabled={fetching} style={{padding:'10px 15px',background:'#003c70',border:0,color:'white',borderRadius:9}}>{fetching?'Haetaan hakutietoja…':measured===null?'Hae ajantasaiset havainnot ↓':'Päivitä hakutiedot ↻'}</button>
   {error&&<p role="alert">{error.includes('Search Console -yhteys')?'Google-hakutietojen yhteys odottaa määritystä testiympäristöön.':error.includes('Kirjautuminen tai käyttöoikeus')?'Kirjautuminen ei ole voimassa tai käyttöoikeus puuttuu.':error} <Link href="/markkinatutka/seo">Avaa kirjautuminen / SEO-työkalu →</Link></p>}
   {measured&&<p role="status" style={{fontSize:14,color:'#355d74'}}>✓ Tiedot haettu · Google Search Console · {period} · {measured.length} tarkistettavaa havaintoa. Tämä ei mittaa suoraan myyntivaikutusta.</p>}
   <div id="markkinatutka-tulokset" style={{borderTop:'1px solid #d5e6ef',marginTop:22,paddingTop:18}}>
     <strong style={{color:'#003c70',fontSize:17}}>{measured===null?'Tulokset näkyvät tässä haun jälkeen':'Haun tulokset ja suositukset'}</strong>
     {measured!==null&&<SearchTrends daily={daily} previousDaily={previousDaily}/>}
     {measured!==null&&<Ga4OrganicSummary ga4={ga4}/>}
     {measured===null&&<p style={{color:'#637b8f',margin:'8px 0 0',fontSize:14}}>Hakua ei ole vielä tehty. Alla on erikseen merkittyjä malliesimerkkejä, jotta näet millaisia suosituksia palvelu tarjoaa.</p>}

  {view==='workbench'? <>{measured!==null&&<DestinationInsights destinations={destinations} detailed/>}{measured!==null&&<MeasuredInsights insights={measured} detailed/>}<details open={measured===null} style={{marginTop:20}}><summary style={{color:'#003c70',fontWeight:700,cursor:'pointer'}}>Työpöydän malliesimerkit ja työkalut</summary><p style={{fontSize:13}}>Seuraavat esimerkit eivät perustu mittauksiin.</p>{professional}</details></> :
   <section aria-label="Johdon yhteenveto">
    <h2 style={{color:'#003c70',fontSize:25,margin:'10px 0'}}>Tärkeimmät huomiot päätöksenteon tueksi</h2>
    <p style={{color:'#637b8f',lineHeight:1.6}}>{measured===null?'Alla on malliesimerkkejä. Hae mitatut SEO-havainnot yllä olevalla painikkeella.':'Alla näkyvät mitatut SEO-havainnot. Muut esimerkit löytyvät erikseen avattavasta osiosta.'}</p>
    <div style={{display:'grid',gap:14}}>
     {measured!==null&&<DestinationInsights destinations={destinations}/>}{measured!==null&&<details><summary style={{cursor:'pointer',fontWeight:700,color:'#003c70'}}>Näytä yksittäiset SEO-hakuhavainnot</summary><MeasuredInsights insights={measured}/></details>}
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
  </section>
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

function DestinationInsights({destinations,detailed=false}:{destinations:DestinationSeoGroup[];detailed?:boolean}){
 return <section aria-label="Matkakohteiden SEO-suositukset" style={{display:'grid',gap:12,margin:'18px 0'}}>
  <h3 style={{color:'#003c70',margin:0}}>Matkakohteiden tärkeimmät mahdollisuudet</h3>
  {destinations.length===0&&<p>Hakuaineistosta ei tunnistettu vielä kohdekohtaisia kokonaisuuksia. Tarkastele yksittäisiä hakuhavaintoja.</p>}
  {destinations.map(group=><article key={group.name} style={{padding:20,background:'white',border:'1px solid #cbdde7',borderRadius:15}}>
   <small style={{fontWeight:700,color:'#537188'}}>MITATTU SEO-AINEISTO · TARKISTETTAVA SUOSITUS</small>
   <h4 style={{fontSize:21,color:'#003c70',margin:'10px 0'}}>{group.name}</h4>
   <p><strong>Mitä havaittiin?</strong> {group.queryCount} hakukysely–sivu-havaintoa, esimerkiksi {group.examples.join(', ')}.</p>
   <p style={{background:'#fff7ef',borderLeft:'4px solid #ff8200',borderRadius:8,padding:12}}><strong>Mitä kannattaa tehdä?</strong> {group.recommendation}</p>
   <p><strong>Miksi?</strong> Havaituissa hakutuloksissa on mahdollisuuksia tarkistaa sisällön osuvuutta ja löydettävyyttä. Vaikutusta ei ole vielä vahvistettu.</p>
   <p><strong>Liiketoiminnallinen tärkeysjärjestys:</strong> Odottaa matkojen saatavuus-, kate- ja työmäärätietoja. Pelkkä hakunäkyvyys ei ratkaise kokonaisprioriteettia.</p>
   <details open={detailed}><summary style={{cursor:'pointer',fontWeight:700,color:'#003c70'}}>Tarkemmat luvut ja lähteet</summary>
    <p>Poimituissa riveissä {group.impressions.toLocaleString('fi-FI')} näyttökertaa ja {group.clicks.toLocaleString('fi-FI')} klikkausta.</p>
    <p>{group.caution}</p>
    <ul>{group.pages.map(page=><li key={page}>{page}</li>)}</ul>
   </details>
   <Link href="/markkinatutka/seo" style={{fontWeight:700,color:'#003c70'}}>Avaa SEO-työkalu →</Link>
  </article>)}
 </section>
}

function SearchTrends({daily,previousDaily}:{daily:SearchDay[];previousDaily:SearchDay[]}){
 if(!daily.length)return <p style={{fontSize:14,color:'#667e8d'}}>Päiväkohtaisia mittaustietoja ei löytynyt tältä jaksolta.</p>
 const fmt=(v:number)=>Math.round(v).toLocaleString('fi-FI')
 const totalClicks=daily.reduce((a,d)=>a+d.clicks,0)
 const totalImpressions=daily.reduce((a,d)=>a+d.impressions,0)
 const previousClicks=previousDaily.reduce((a,d)=>a+d.clicks,0)
 const previousImpressions=previousDaily.reduce((a,d)=>a+d.impressions,0)
 const complete=daily.length===28&&previousDaily.length===28
 const delta=(now:number,before:number)=>!complete?'Vertailu ei ole saatavilla':before===0?'Ei vertailupohjaa':(now>=before?'+':'')+((now-before)/before*100).toLocaleString('fi-FI',{maximumFractionDigits:1})+' % edelliseen 28 päivään'
 return <section aria-label="Hakuliikenteen kehitys" style={{margin:'18px 0'}}>
  <h3 style={{fontSize:21,color:'#003c70',margin:'0 0 12px'}}>Hakunäkyvyyden kehitys</h3>
  <p style={{fontSize:13,color:'#61798a',margin:'0 0 15px'}}>Google Search Console · koko sivuston päiväkohtaiset mittaukset · {daily[0].date}–{daily[daily.length-1].date}</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:16}}>
   <TrendPlot data={daily} field="clicks" label="Klikkaukset" total={fmt(totalClicks)} change={delta(totalClicks,previousClicks)} color="#003c70"/>
   <TrendPlot data={daily} field="impressions" label="Näyttökerrat" total={fmt(totalImpressions)} change={delta(totalImpressions,previousImpressions)} color="#ff8200"/>
  </div>
  <p style={{fontSize:12,color:'#61798a',marginTop:12}}>Vertailu näytetään vain, kun molemmilta 28 päivän jaksoilta on tiedot kaikilta päiviltä. Kuvaajat eivät kuvaa myyntiä tai ennustetta. Viimeisimmät keskeneräiset hakupäivät on rajattu pois.</p>
 </section>
}
function TrendPlot({data,field,label,total,change,color}:{data:SearchDay[];field:'clicks'|'impressions';label:string;total:string;change:string;color:string}){
 const width=360,height=132,pad=9
 const max=Math.max(1,...data.map(d=>d[field]))
 const points=data.map((d,i)=>`${(pad+i*(width-pad*2)/Math.max(1,data.length-1)).toFixed(1)},${(height-pad-d[field]/max*(height-pad*2)).toFixed(1)}`).join(' ')
 return <div style={{border:'1px solid #d9e6ef',borderRadius:12,padding:16,background:'#f9fcfe'}}>
  <span style={{fontSize:13,color:'#527089',fontWeight:700}}>{label}</span>
  <strong style={{display:'block',fontSize:27,color:'#003c70',margin:'3px 0 3px'}}>{total}</strong>
  <span style={{display:'block',fontSize:13,color:'#536f82',marginBottom:10}}>{change}</span>
  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label+' päivittäin, '+data.length+' mittauspäivää'} style={{display:'block',width:'100%',height:'auto'}}>
   <line x1={pad} x2={width-pad} y1={height-pad} y2={height-pad} stroke="#c7dce9"/>
   <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#60798a'}}><span>{data[0].date.slice(5)}</span><span>{data[data.length-1].date.slice(5)}</span></div>
 </div>
}

function Ga4OrganicSummary({ga4}:{ga4:Ga4Report|null}){
 if(!ga4||ga4.status!=='ready'||!ga4.daily)return <section aria-label="GA4 orgaaninen liikenne" style={{padding:'14px 0',borderTop:'1px solid #d9e6ef'}}>
  <h3 style={{fontSize:20,color:'#003c70'}}>Orgaaninen liikenne ja avaintapahtumat (GA4)</h3>
  <p style={{color:'#637b8f',fontSize:14}}>{ga4?.status==='not-configured'?'GA4:n lukuoikeutta ei ole vielä määritetty tähän esikatseluympäristöön. Search Console -tiedot ovat käytettävissä.':'GA4-tietoja ei saatu haettua. Search Console -tiedot näkyvät silti normaalisti.'}</p>
 </section>
 const sum=(rows:NonNullable<Ga4Report['daily']>,key:'sessions'|'activeUsers'|'keyEvents')=>rows.reduce((total,day)=>total+day[key],0)
 const total=(key:'sessions'|'activeUsers'|'keyEvents')=>sum(ga4.daily!,key).toLocaleString('fi-FI')
 const comparison=(key:'sessions'|'activeUsers'|'keyEvents')=>{
  if(ga4.daily!.length!==28||ga4.previousDaily?.length!==28)return 'Vertailu ei saatavilla'
  const previous=sum(ga4.previousDaily,key),current=sum(ga4.daily!,key)
  return previous===0?'Ei vertailupohjaa':(current>=previous?'+':'')+((current-previous)/previous*100).toLocaleString('fi-FI',{maximumFractionDigits:1})+' %'
 }
 return <section aria-label="GA4 orgaaninen liikenne" style={{borderTop:'1px solid #d9e6ef',paddingTop:18,marginTop:20}}>
  <h3 style={{fontSize:20,color:'#003c70'}}>Orgaaninen liikenne ja avaintapahtumat (GA4)</h3>
  <p style={{fontSize:13,color:'#61798a'}}>Lähde: Google Analytics 4 · kanava Organic Search. GA4:n istunnot ja Search Consolen klikkaukset mittaavat eri asioita.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
   {([['Istunnot',total('sessions'),comparison('sessions')],['Aktiiviset käyttäjät',total('activeUsers'),comparison('activeUsers')],['Avaintapahtumat',total('keyEvents'),comparison('keyEvents')]] as const).map(([label,value,change])=><div key={label} style={{padding:14,background:'#f4f8fc',borderRadius:10}}><small>{label}</small><strong style={{display:'block',fontSize:23,color:'#003c70'}}>{value}</strong><small>{change} edelliseen 28 päivään</small></div>)}
  </div>
  <details style={{marginTop:12}}><summary style={{cursor:'pointer',fontWeight:700}}>Näytä GA4:n avaintapahtumat</summary>
   <p style={{fontSize:13}}>Tapahtumien nimet tulevat GA4:stä. Niitä ei tulkita automaattisesti varatuiksi matkoiksi tai matkakyselyiksi.</p>
   {(ga4.keyEvents||[]).length===0?<p>Avaintapahtumia ei löytynyt tällä rajauksella.</p>:<ul>{ga4.keyEvents!.slice(0,10).map(event=><li key={event.name}>{event.name}: {event.keyEvents.toLocaleString('fi-FI')}</li>)}</ul>}
  </details>
 </section>
}
