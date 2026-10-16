'use client'
import {useState,type ReactNode} from 'react'
import Link from 'next/link'

const summaries=[
 {topic:'Hakunäkyvyys',title:'Portugalin golfmatkojen hakutuloksen kiinnostavuus kannattaa selvittää',finding:'Esimerkissä sivu näkyy hakutuloksissa, mutta saa vähän kävijöitä.',action:'Tarkista sivun hakutulosotsikko ja kuvaus ennen muutoksia.',why:'Nykyistä hakunäkyvyyttä voisi olla mahdollista hyödyntää paremmin. Pelkkä klikkausosuus ei kuitenkaan kerro syytä.',href:'/markkinatutka/seo'},
 {topic:'Kilpailutilanne',title:'Kevätmatkojen erot kilpailijoihin kannattaa selvittää',finding:'Esimerkkitilanteessa samalle ajanjaksolle voisi tulla kilpailevia matkoja.',action:'Vertaa lähtöajat, hinnat ja paketteihin kuuluvat palvelut.',why:'Pelkkä hintavertailu voi johtaa harhaan, jos paketit ovat erilaisia.',href:'/markkinatutka/kilpailijat'},
 {topic:'Tulosten mittaus',title:'Uutiskirjeiden tuloksia kannattaa tarkastella myös matkakyselyinä',finding:'Esimerkkitilanteessa kiinnostus ei välttämättä kerro toteutuneista kyselyistä.',action:'Selvitä uutiskirjeiden tuottamat matkakyselyt, jos seuranta on riittävä.',why:'Klikkauksia enemmän liiketoiminnallista hyötyä kuvaavat laadukkaat matkakyselyt.',href:'/markkinatutka/tehtavat'},
]
export default function MarkkinatutkaViewSwitch({professional}:{professional:ReactNode}){
 const [view,setView]=useState<'overview'|'workbench'>('overview')
 return <div>
  <nav aria-label="Näkymän valinta" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',margin:'24px 0'}}>
   <button type="button" aria-pressed={view==='overview'} onClick={()=>setView('overview')} style={{padding:'12px 20px',background:view==='overview'?'#003c70':'white',color:view==='overview'?'white':'#003c70',border:'1px solid #c7d9e6',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Yhteenveto</button>
   <button type="button" aria-pressed={view==='workbench'} onClick={()=>setView('workbench')} style={{padding:'12px 20px',background:view==='workbench'?'#003c70':'white',color:view==='workbench'?'white':'#003c70',border:'1px solid #c7d9e6',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Työpöytä</button>
   <span style={{fontSize:13,color:'#5f778a'}}>Sama tieto, eri tarkkuudella</span>
  </nav>
  {view==='workbench'? professional :
   <section aria-label="Johdon yhteenveto">
    <h2 style={{color:'#003c70',fontSize:25,margin:'10px 0'}}>Tärkeimmät huomiot päätöksenteon tueksi</h2>
    <p style={{color:'#637b8f',lineHeight:1.6}}>Kolme esimerkkiä siitä, miten Markkinatutka kertoo mitä tapahtui, mitä kannattaa tehdä ja miksi. Oikeaa mittausdataa ei vielä käytetä.</p>
    <div style={{display:'grid',gap:14}}>
     {summaries.map((s,i)=><article key={s.topic} style={{border:'1px solid #dbe7ef',background:'white',borderRadius:16,padding:'clamp(17px,3vw,25px)'}}>
      <small style={{fontWeight:700,color:'#547388'}}>{i+1}. {s.topic.toUpperCase()} · MALLIESIMERKKI</small>
      <h3 style={{fontSize:20,color:'#003c70',margin:'12px 0'}}>{s.title}</h3>
      <p style={{lineHeight:1.6}}><strong>Mitä havaittiin?</strong> {s.finding}</p>
      <div style={{background:'#fff7ef',borderLeft:'4px solid #ff8200',borderRadius:8,padding:'13px 15px'}}>
       <strong>Mitä kannattaa tehdä?</strong><p style={{margin:'5px 0 0',lineHeight:1.6}}>{s.action}</p>
      </div>
      <p style={{lineHeight:1.6}}><strong>Miksi?</strong> {s.why}</p>
      <Link href={s.href} style={{color:'#003c70',fontWeight:700}}>Tutustu analyysiin ja lähteisiin →</Link>
     </article>)}
    </div>
    <p style={{fontSize:13,color:'#637b8f',marginTop:20}}>Vaihtamalla Työpöytä-näkymään näet myös yksityiskohtaiset tarkistukset, tehtäväpolut ja mittaussuunnitelmat.</p>
   </section>}
 </div>
}
