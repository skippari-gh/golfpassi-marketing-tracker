import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export type PublicPageSnapshot = {
  url:string; finalUrl:string; fetchedAt:string; title:string|null; description:string|null;
  h1:string[]; h2:string[]; excerpts:string[];
}
function decode(s:string) {
  return s.replace(/&(?:amp|quot|lt|gt|nbsp|#39);/g,m=>({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&nbsp;':' ','&#39;':"'" }[m]||m)).replace(/\s+/g,' ').trim()
}
function visible(s:string) { return decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')) }
function matches(html:string,tag:string,max=12) {
  const re=new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'>','gi')
  return [...html.matchAll(re)].slice(0,max).map(m=>visible(m[1])).filter(Boolean)
}
function validateUrl(raw:string) {
  const url=new URL(raw)
  if(url.protocol!=='https:' || url.hostname!=='golfpassi.fi' || url.port || url.username || url.password || isIP(url.hostname) || url.href.length>2048) throw new Error('Vain golfpassi.fi-osoitteet sallitaan')
  return url
}
export async function readGolfpassiPage(raw:string):Promise<PublicPageSnapshot> {
  const url=validateUrl(raw)
  // Defense in depth: reject private/reserved DNS addresses to avoid SSRF if DNS changes.
  const addresses=await lookup(url.hostname,{all:true})
  if(!addresses.length || addresses.some(a=>a.address.startsWith('127.') || a.address.startsWith('10.') || a.address.startsWith('192.168.') || a.address.startsWith('169.254.') || a.address.startsWith('172.') && Number(a.address.split('.')[1])>=16 && Number(a.address.split('.')[1])<=31 || a.address==='::1' || a.address.startsWith('fc') || a.address.startsWith('fd') || a.address.startsWith('fe80'))) throw new Error('Osoite ei ole sallittu')
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'text/html'}})
  if(!response.ok) throw new Error('Sivua ei voitu lukea: '+response.status)
  if(!response.headers.get('content-type')?.toLowerCase().includes('text/html'))throw new Error('Kohde ei ole HTML-sivu')
  const max=550000; const body=await response.text()
  if(body.length>max)throw new Error('Sivu liian suuri analysoitavaksi')
  const title=matches(body,'title',1)[0]||null
  const meta=body.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)?.[0]||body.match(/<meta\s+[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i)?.[0]||''
  const description=decode(meta.match(/content=["']([^"']*)["']/i)?.[1]||'')||null
  const main=body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||body
  return {url:url.href,finalUrl:response.url,fetchedAt:new Date().toISOString(),title,description,h1:matches(main,'h1',5),h2:matches(main,'h2',20),excerpts:matches(main,'p',12).map(x=>x.slice(0,280))}
}
