import type { ReactNode } from 'react'

export type InsightDisplay = {
  title: string
  analysis: string
  action: string
  rationale: string
  source?: string
  confidence?: string
  caveat?: string
  details?: ReactNode
}

export default function InsightCard({ insight }: { insight: InsightDisplay }) {
  return <article style={{border:'1px solid #d7e4ec',borderRadius:16,padding:'clamp(16px,3vw,24px)',background:'#fff',boxShadow:'0 4px 15px rgba(0,60,112,.04)'}}>
    <h3 style={{color:'#003c70',fontSize:21,lineHeight:1.3,margin:'0 0 17px'}}>{insight.title}</h3>
    <section style={{padding:'14px 16px',background:'#eff7fc',borderRadius:12,marginBottom:12}}>
      <strong style={{color:'#003c70'}}>Mitä tämä tarkoittaa?</strong>
      <p style={{lineHeight:1.6,margin:'7px 0 0'}}>{insight.analysis}</p>
    </section>
    <section style={{padding:'14px 16px',borderLeft:'4px solid #ff8200',background:'#fff9f0',borderRadius:10,marginBottom:12}}>
      <strong style={{color:'#003c70'}}>Mitä kannattaa tehdä?</strong>
      <p style={{lineHeight:1.6,margin:'7px 0 0'}}>{insight.action}</p>
    </section>
    <section style={{padding:'12px 16px'}}>
      <strong style={{color:'#003c70'}}>Miksi suosittelemme tätä?</strong>
      <p style={{lineHeight:1.6,margin:'7px 0 0'}}>{insight.rationale}</p>
      {insight.caveat && <p style={{fontSize:13,color:'#596f81',marginBottom:0}}>{insight.caveat}</p>}
    </section>
    <details style={{marginTop:12,borderTop:'1px solid #d7e4ec',paddingTop:14}}>
      <summary style={{cursor:'pointer',fontSize:14,fontWeight:700,color:'#003c70'}}>Näytä lähteet ja tarkemmat tiedot</summary>
      <div style={{paddingTop:12,fontSize:14,lineHeight:1.6,overflowWrap:'anywhere'}}>
        <p><strong>Lähde:</strong> {insight.source || 'Ei todennettua lähdettä'}</p>
        <p><strong>Luotettavuus:</strong> {insight.confidence || 'Ei arvioitu'}</p>
        {insight.details}
      </div>
    </details>
  </article>
}
