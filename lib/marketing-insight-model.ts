// One presentation contract for leadership, professional and live SEO findings.
// Describes facts and cautious recommendations; does not infer bookings or revenue.
export type MarketingInsight = {
  id:string
  channel:'SEO'|'Kilpailijat'|'Kampanjat'|'Vaikutus'
  title:string
  analysis:string
  action:string
  reason:string
  detail:string
  href:string
  evidence:'demo'|'measured'
  source:string|null
  observedPeriod:string|null
  state:string
  priority:'Korkea'|'Keskitaso'|'Matala'
}
export type MeasuredSeoOpportunity={
 query:string;page:string;clicks:number;impressions:number;ctr:number;position:number;reason:string
}
export function seoOpportunityToInsight(row:MeasuredSeoOpportunity,period:string,source:string):MarketingInsight {
 const goodPosition=row.position<=10
 const lowCtr=row.ctr<.03
 return {
  id:'seo:'+row.query+':'+row.page,channel:'SEO',
  title:'Hakua ”'+row.query+'” kannattaa tarkastella',
  analysis:goodPosition&&lowCtr
   ? 'Sivu on näkynyt hakutuloksissa kohtalaisen hyvillä sijoilla, mutta vain harva näyttökerta on johtanut klikkaukseen.'
   : 'Sivun keskimääräinen hakusijoitus tai hakutuloksen osuvuus voi rajoittaa kävijöitä.',
  action:goodPosition&&lowCtr
   ? 'Vertaa nykyistä Google-otsikkoa ja kuvausta hakijan tarpeeseen. Varmista ensin sijoitus ja hakulausekkeet.'
   : 'Tarkista sivun sisältö ja vertaa sitä siihen, mitä hakija pyrkii löytämään.',
  reason:'Google Search Consolen mittaamat klikkaukset '+row.clicks+', näyttökerrat '+row.impressions+' ja keskimääräinen sijoitus '+row.position.toFixed(1)+'. '+row.reason,
  detail:'Klikkausosuus '+(row.ctr*100).toFixed(1)+' %. Hakusijoitus vaihtelee käyttäjän ja tilanteen mukaan. Tästä ei voi suoraan päätellä vaikutusta matkakyselyihin.',
  href:'/markkinatutka/seo',evidence:'measured',source,observedPeriod:period,state:'Tarkistettava',priority:goodPosition&&lowCtr?'Korkea':'Keskitaso'
 }
}
