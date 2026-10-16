'use client'
import { useState } from 'react'
import Link from 'next/link'
import { transitionProposal, toMarketingActionDraft, type MarketingProposal } from '../../../lib/marketing-proposal-workflow'

const examples: MarketingProposal[] = [
  { id:'demo-seo-1',source:'seo',title:'Tarkista Portugalin kohdesivun hakutarkoitus', reason:'Esimerkki: orgaanisen näkyvyyden ja klikkausten välillä voi olla parannettavaa.',proposedAction:'Vertaa hakukyselyitä otsikkoon, metakuvaukseen ja sivun sisältöön.',sourceUrl:null,observedAt:null,confidence:'low',priority:'high',status:'suggested',owner:null,dueDate:null,outcome:null },
  { id:'demo-competitive-1',source:'competitor',title:'Vertaa kevään golfmatkojen viestintää',reason:'Esimerkki: kilpailijoiden uudet tarjoukset voivat vaikuttaa kysyntään.',proposedAction:'Tarkista vertailukelpoiset hinnat, lähdöt ja paketin sisältö.',sourceUrl:null,observedAt:null,confidence:'low',priority:'medium',status:'suggested',owner:null,dueDate:null,outcome:null },
]

export default function ProposalsPreview() {
  const [items,setItems]=useState(examples)
  const [notice,setNotice]=useState('')
  const update=(id:string,patch:Partial<MarketingProposal>)=>setItems(old=>old.map(p=>p.id===id?{...p,...patch}:p))
  const act=(id:string,action:'review'|'approve'|'dismiss')=>{
    try {
      setItems(previous=>previous.map(p=>p.id===id?transitionProposal(p,{proposalId:id,action,actor:'esikatselun käyttäjä',timestamp:new Date().toISOString()}):p))
      setNotice('Esikatselun tila muuttui vain tässä selaimessa. Mitään ei tallennettu.')
    } catch(e) { setNotice(e instanceof Error?e.message:'Virhe') }
  }
  return <main style={{maxWidth:950,margin:'auto',padding:'35px 20px',fontFamily:'Arial,system-ui,sans-serif',color:'#143550'}}>
    <Link href="/markkinatutka">← Markkinatutka</Link>
    <p style={{letterSpacing:2,fontSize:12,marginTop:32}}>TYÖJONO / ESIMERKKITOTEUTUS</p>
    <h1 style={{fontSize:'clamp(28px,5vw,44px)',color:'#003c70',margin:'8px 0'}}>Ehdotuksesta toimenpiteeksi</h1>
    <p>Arvioi suositus ennen hyväksyntää. Näytä ehdotuksesta syntyvä luonnos ja suunnittele vaikutuksen mittaus.</p>
    <div role="status" style={{background:'#fff4df',border:'1px solid #e6b46d',borderRadius:12,padding:16,margin:'18px 0'}}>
      <strong>ESIKATSELU — kaikki havainnot ovat kuvitteellisia.</strong> Valinnat säilyvät vain tällä sivulla avoinna olevan käyttökerran ajan. Hyväksyntä ei luo oikeaa tehtävää, lähetä sähköpostia tai julkaise mitään.
    </div>
    {notice && <p role="status" style={{padding:12,background:'#edf6fa'}}>{notice}</p>}
    <section style={{display:'grid',gap:14}}>
      {items.map(p=><article key={p.id} style={{border:'1px solid #d7e4ec',borderRadius:16,padding:23}}>
        <small style={{color:'#567a91'}}> {p.source.toUpperCase()} · Prioriteetti {p.priority} · Tila {p.status}</small>
        <h2 style={{margin:'8px 0',color:'#003c70',fontSize:22}}>{p.title}</h2>
        <div style={{display:'grid',gap:12,margin:'18px 0'}}>
          <section style={{background:'#f0f7fc',borderRadius:12,padding:16}}>
            <strong style={{color:'#003c70'}}>1. Analyysi – mitä havainto tarkoittaa?</strong>
            <p style={{margin:'8px 0 0',lineHeight:1.6}}>{p.reason} Tämä on tarkistettava tulkinta, ei osoitettu tulos.</p>
          </section>
          <section style={{borderLeft:'4px solid #ff8200',background:'#fff8ef',borderRadius:10,padding:16}}>
            <strong style={{color:'#003c70'}}>2. Toimenpidesuositus – mitä tehdään?</strong>
            <p style={{margin:'8px 0 0',lineHeight:1.6}}>{p.proposedAction}</p>
          </section>
          <section style={{border:'1px solid #d7e4ec',borderRadius:12,padding:16}}>
            <strong style={{color:'#003c70'}}>3. Perustelut ja lähteet – miksi juuri tämä?</strong>
            <p style={{margin:'8px 0',lineHeight:1.6}}>Ehdotus perustuu yllä kuvattuun oletettuun tilanteeseen. Ennen toteutusta varmista alkuperäinen lähde, ajanjakso, vertailutaso ja vaikutus matkakyselyihin.</p>
            <p style={{margin:'0',fontSize:13,color:'#567a91'}}>Lähde: {p.sourceUrl??'Ei todennettua lähdettä (esimerkki)'} · Havaittu: {p.observedAt??'Ei mittauspäivää'} · Luotettavuus: {p.confidence}</p>
          </section>
        </div>
        <p style={{fontSize:13,color:'#668093'}}>Luotettavuus: matala · lähde ja oikea mittausdata puuttuvat (esimerkki)</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,margin:'18px 0'}}>
          <label style={{fontSize:13,fontWeight:700}}>Vastuuhenkilö
            <input value={p.owner??''} onChange={e=>update(p.id,{owner:e.target.value.slice(0,100)})} placeholder="Nimi tai tiimi" style={{display:'block',width:'100%',boxSizing:'border-box',padding:10,marginTop:5}}/>
          </label>
          <label style={{fontSize:13,fontWeight:700}}>Määräpäivä
            <input type="date" value={p.dueDate??''} onChange={e=>update(p.id,{dueDate:e.target.value||null})} style={{display:'block',width:'100%',boxSizing:'border-box',padding:10,marginTop:5}}/>
          </label>
          <label style={{fontSize:13,fontWeight:700}}>Onnistumisen mittari
            <select value={p.outcome?.metric??''} onChange={e=>update(p.id,{outcome:e.target.value?{metric:e.target.value,baseline:null,after:null,measuredAt:null}:null})} style={{display:'block',width:'100%',padding:10,marginTop:5}}>
              <option value="">Valitse mittari</option>
              <option value="Orgaaniset klikkaukset">Orgaaniset klikkaukset</option>
              <option value="CTR">CTR</option>
              <option value="Matkakyselyt">Matkakyselyt</option>
              <option value="Konversioaste">Konversioaste</option>
            </select>
          </label>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:9,marginTop:17}}>
          <button disabled={p.status!=='suggested'} onClick={()=>act(p.id,'review')} style={{padding:'10px 14px'}}>Merkitse arvioiduksi</button>
          <button disabled={p.status!=='reviewed'} onClick={()=>act(p.id,'approve')} style={{padding:'10px 14px'}}>Hyväksy luonnos</button>
          <button disabled={p.status==='approved'||p.status==='dismissed'} onClick={()=>act(p.id,'dismiss')} style={{padding:'10px 14px'}}>Hylkää</button>
        </div>
        {p.status==='approved' && <div style={{marginTop:18,padding:16,background:'#eef7fa',borderRadius:10}}>
          <strong>Marketing Tracker -luonnos, ei tallennettu</strong>
          <p style={{fontSize:13}}>Vastuuhenkilö: {p.owner?.trim()||'Ei määritetty'} · Määräpäivä: {p.dueDate||'Ei määritetty'} · Mittari: {p.outcome?.metric||'Ei määritetty'}</p>
          <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:13}}>{JSON.stringify(toMarketingActionDraft(p,p.dueDate||new Date().toISOString().slice(0,10)),null,2)}</pre>
        </div>}
      </article>)}
    </section>
  </main>
}
