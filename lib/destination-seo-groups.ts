import type { SearchOpportunity } from './search-console-analysis'

export type DestinationSeoGroup = {
  name:string
  impressions:number
  clicks:number
  queryCount:number
  pages:string[]
  examples:string[]
  recommendation:string
  caution:string
}

const destinations:{name:string;pattern:RegExp}[]=[
  {name:'Madeira',pattern:/madeira|palheiro|santo da serra/i},
  {name:'Algarve',pattern:/algarve|vilamoura|quinta do lago|vale do lobo/i},
  {name:'Lissabon',pattern:/lissabon|lisbon|cascais|estoril/i},
  {name:'Portugali',pattern:/portugali|portugal/i},
  {name:'Sisilia',pattern:/sisilia|sicily|sicilia|etna/i},
  {name:'Mauritius',pattern:/mauritius|mauriti/i},
  {name:'Marrakech',pattern:/marrakech|marokko|morocco/i},
  {name:'Espanja',pattern:/espanja|spain/i},
  {name:'Kypros',pattern:/kypros|cyprus|korineum/i},
  {name:'Turkki',pattern:/turkki|turkey|belek/i},
]
export function groupSeoOpportunitiesByDestination(rows:SearchOpportunity[],maxGroups=6):DestinationSeoGroup[]{
 const buckets = new Map<string,SearchOpportunity[]>()
 for(const row of rows){
  // Match the query first. URL-only matches may describe unrelated intent.
  const match=destinations.find(d=>d.pattern.test(row.query))
  if(!match)continue
  const prev=buckets.get(match.name)||[]
  prev.push(row);buckets.set(match.name,prev)
 }
 const result:DestinationSeoGroup[]=[]
 for(const [name,items] of buckets){
  // Query/page dimensions can overlap: sums are observation-row totals, not total site performance.
  const pages=[...new Set(items.map(x=>x.page))]
  const clicks=items.reduce((sum,x)=>sum+x.clicks,0)
  const impressions=items.reduce((sum,x)=>sum+x.impressions,0)
  result.push({
   name,clicks,impressions,queryCount:items.length,pages,
   examples:items.slice(0,3).map(x=>x.query),
   recommendation:items.some(x=>x.position<=10&&x.ctr<0.03)
    ? 'Tarkista näiden hakujen hakutulosotsikot ja kuvaukset sekä vastaavuus sivujen sisältöön.'
    : 'Tarkista vastaavatko kohdesivut hakijoiden tarpeisiin ja löytyykö sopivia sisäisiä linkkejä.',
   caution:'Havainnot on poimittu rajatusta Search Console -aineistosta. Luvut kuvaavat vain tähän koosteeseen päätyneitä hakukysely–sivu-rivejä, eivät kohteen kokonaisliikennettä.'
  })
 }
 return result.sort((a,b)=>b.impressions-a.impressions).slice(0,Math.max(1,maxGroups))
}
