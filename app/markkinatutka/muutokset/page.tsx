'use client'
import {useState} from 'react'
import Link from 'next/link'
import {moveChange,type ProposedChange} from '../../../lib/marketing-change-approval'

const sample:ProposedChange[]=[
 {id:'sample-web',channel:'website',target:'https://golfpassi.fi/',field:'Google-otsikko',before:'Esimerkki: vanha sivun otsikko',after:'Golfmatkat – tutustu kohteisiin ja matkoihin | Golfpassi',reason:'Esimerkkitilanteessa hakutulos ei kuvaa matkavalikoimaa tarpeeksi hyvin. Oikea otsikko on luettava ennen muutosta.',source:'Kuvitteellinen sivuhavainto',capturedAt:null,state:'draft',reviewedBy:null,approvedBy:null},
 {id:'sample-ads',channel:'google_ads',target:'Esimerkki: Google Ads -mainos',field:'Mainoksen otsikko',before:'Esimerkki: Golfmatkat',after:'Tutustu Golfpassin golfmatkoihin',reason:'Otsikkoa voidaan kokeilla selkeämmällä matkailijan tarpeisiin vastaavalla viestillä. Mainosten tulos on mitattava ennen päätelmiä.',source:'Kuvitteellinen kampanja',capturedAt:null,state:'draft',reviewedBy:null,approvedBy:null}
]
const colors={navy:'#003c70',line:'#d7e4ec'}
export default function ChangesPreview(){
 const [rows,setRows]=useState(sample)
 const [message,setMessage]=useState('')
 function apply(id:string,action:'review'|'approve'|'cancel') {
   try {setRows(old=>old.map(row=>row.id===id?moveChange(row,action,'Esikatselun käyttäjä'):row));setMessage('Vain esikatselun tila muuttui. Mitään ei tallennettu tai julkaistu.')}
   catch(e){setMessage(e instanceof Error?e.message:'Toiminto epäonnistui')}
 }
 return <main style={{maxWidth:1000,margin:'auto',padding:'32px 20px 80px',fontFamily:'Arial,system-ui,sans-serif',color:'#19374e'}}>
  <Link href="/markkinatutka">← Markkinatutka</Link>
  <p style={{letterSpacing:2,fontSize:12,marginTop:28}}>MUUTOSTEN HALLINTA / ESIMERKKI</p>
  <h1 style={{fontSize:'clamp(29px,5vw,43px)',color:colors.navy,margin:'10px 0'}}>Tarkista muutos ennen hyväksyntää</h1>
  <p>Verkkosivun tai mainoksen muutoksessa nykyinen ja ehdotettu teksti erotetaan selvästi. Perustelut ja lähde näytetään aina.</p>
  <div role="status" style={{background:'#fff4df',border:'1px solid #ecc380',padding:17,borderRadius:12,margin:'20px 0'}}>
    <strong>Vain toimintamallin esikatselu.</strong> Alla ei ole oikeita Golfpassin sivu- tai mainostekstejä. Painikkeet eivät tallenna tietoja palvelimelle, muuta Google Adsia tai julkaise verkkosivulle.
  </div>
  {message&&<p role="status" style={{background:'#eaf5fa',padding:12}}>{message}</p>}
  <div style={{display:'grid',gap:19}}>
   {rows.map(row=><article key={row.id} style={{border:'1px solid '+colors.line,borderRadius:17,padding:'clamp(17px,3vw,26px)'}}>
     <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
       <strong style={{color:colors.navy}}>{row.channel==='website'?'Verkkosivun sisältö':'Google Ads -mainos'}</strong>
       <small style={{background:'#f1f5f8',padding:'7px 11px',borderRadius:99}}>Tila: {row.state==='draft'?'Ehdotus':row.state==='reviewed'?'Arvioitu':row.state==='approved'?'Hyväksytty, ei julkaistu':'Hylätty'}</small>
     </div>
     <p style={{fontSize:13,color:'#5b7688'}}>{row.target} · {row.field}</p>
     <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,margin:'18px 0'}}>
       <section style={{background:'#f0f4f7',padding:18,borderRadius:12}}>
         <strong style={{fontSize:13}}>NYKYINEN TEKSTI (ESIMERKKI)</strong><p style={{lineHeight:1.6}}>{row.before}</p>
       </section>
       <section style={{background:'#fff7ee',borderLeft:'4px solid #ff8200',padding:18,borderRadius:12}}>
         <strong style={{fontSize:13}}>EHDOTETTU TEKSTI</strong><p style={{lineHeight:1.6}}>{row.after}</p>
       </section>
     </div>
     <p><strong>Miksi muutos?</strong> {row.reason}</p>
     <details style={{padding:'10px 0'}}><summary style={{cursor:'pointer',color:colors.navy,fontWeight:700}}>Näytä lähdetiedot ja turvallisuusrajaukset</summary><p>Lähde: {row.source}. Nykyistä sisältöä ei ole haettu oikeasta kohteesta. Oikeassa käytössä ennen hyväksyntää tarkistetaan nykyisen version tunniste, muutoshistoria, käyttöoikeudet ja palautusmahdollisuus.</p></details>
     <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
      <button disabled={row.state!=='draft'} onClick={()=>apply(row.id,'review')} style={{padding:'10px 14px'}}>Merkitse tarkistetuksi</button>
      <button disabled={row.state!=='reviewed'} onClick={()=>apply(row.id,'approve')} style={{padding:'10px 14px'}}>Hyväksy suunnitelma</button>
      <button disabled={row.state==='approved'||row.state==='cancelled'} onClick={()=>apply(row.id,'cancel')} style={{padding:'10px 14px'}}>Hylkää</button>
     </div>
   </article>)}
  </div>
  <p style={{fontSize:13,color:'#5b7688',marginTop:22}}>Hyväksytty ei tarkoita julkaistua. Julkaisuyhteydet toteutetaan erikseen palvelukohtaisella vahvistuksella ja palautusmahdollisuudella.</p>
 </main>
}
