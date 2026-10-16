// Transparent prioritization, with no inferred sales, margin, capacity or conversion data.
// Scores are not comparable to financial forecasts.
export type PriorityEvidence={
  opportunity:number|null
  commercial:number|null
  feasibility:number|null
  confidence:number|null
}
export type PriorityAssessment={
  status:'provisional'|'ready-for-review'
  score:number|null
  maximumAvailable:number
  coverage:number
  reasons:string[]
  missing:string[]
}
const weights={commercial:40,opportunity:30,feasibility:20,confidence:10} as const
const descriptions={
 commercial:'Kaupallinen merkitys (matkojen kysyntä, saatavuus ja kate)',
 opportunity:'Mitattu kehitysmahdollisuus',
 feasibility:'Toteutettavuus (työmäärä ja kustannus)',
 confidence:'Näytön luotettavuus',
}
export function assessPriority(e:PriorityEvidence):PriorityAssessment {
 const reasons:string[]=[]
 const missing:string[]=[]
 let weighted=0,available=0
 for(const name of Object.keys(weights) as Array<keyof typeof weights>){
  const value=e[name]
  if(value===null || !Number.isFinite(value) || value<0 || value>100){
   missing.push(descriptions[name])
  }else{
   available+=weights[name]
   weighted+=value*weights[name]/100
   reasons.push(descriptions[name]+': '+Math.round(value)+'/100')
  }
 }
 // No overall score unless all four dimensions are verified.
 return {status:available===100?'ready-for-review':'provisional',
   score:available===100?Math.round(weighted):null,
   maximumAvailable:available,
   coverage:available,
   reasons,missing}
}
export function evidenceScore(impressions:number,clicks:number,queryCount:number):number|null{
 if(![impressions,clicks,queryCount].every(Number.isFinite)||impressions<0||clicks<0||queryCount<1)return null
 // Bounded opportunity proxy, not projected incremental visitors or revenue.
 return Math.min(100,Math.round(100*Math.log1p(impressions)/Math.log1p(10000)))
}
