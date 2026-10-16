import { requireMarketingIntelligenceUser } from '../../../../lib/marketing-intelligence-auth'
import { readGolfpassiPage } from '../../../../lib/golfpassi-page-reader'
import { suggestSeoCopy } from '../../../../lib/seo-copy-suggestions'
import { makeSeoChangePlan } from '../../../../lib/seo-change-plan'
import { reviewSeoEvidence } from '../../../../lib/seo-evidence-review'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request:Request) {
  const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
  if(!await requireMarketingIntelligenceUser(request.headers.get('authorization')))return Response.json({error:'Kirjautuminen tai käyttöoikeus puuttuu'},{status:401,headers})
  const origin=request.headers.get('origin')
  if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Virheellinen alkuperä'},{status:403,headers})
  try{
    const body=await request.json() as {url?:unknown;query?:unknown;ctr?:unknown;position?:unknown}
    if(typeof body.url!=='string'||typeof body.query!=='string'||body.query.length>160||body.url.length>2048||!body.query.trim())return Response.json({error:'Virheelliset lähtötiedot'},{status:400,headers})
    const snapshot=await readGolfpassiPage(body.url)
    const ctr=typeof body.ctr==='number'&&Number.isFinite(body.ctr)?body.ctr:0
    const position=typeof body.position==='number'&&Number.isFinite(body.position)?body.position:20
    const proposed=suggestSeoCopy({query:body.query,page:snapshot.url,ctr,position})
    const analysis={
      title: snapshot.title ? (snapshot.title===proposed.title?'Nykyinen otsikko vastaa ehdotusta':'Otsikko poikkeaa ehdotuksesta'):'Sivun nykyistä otsikkoa ei löytynyt',
      description: snapshot.description ? (snapshot.description===proposed.description?'Nykyinen metakuvaus vastaa ehdotusta':'Metakuvauksen sisältöä kannattaa verrata ehdotukseen'):'Metakuvausta ei löytynyt',
      heading: snapshot.h1.length ? (snapshot.h1.some(h=>h.toLowerCase()===proposed.heading.toLowerCase())?'Pääotsikko vastaa ehdotusta':'Pääotsikko eroaa ehdotuksesta'):'Pääotsikkoa ei löytynyt',
      note:'Sivun sisältö luettiin, mutta matkatuotteiden tietoja tai SEO-muutoksen vaikutusta ei ole automaattisesti vahvistettu.'
    }
    const quality=reviewSeoEvidence(snapshot,proposed)
    let changePlan: ReturnType<typeof makeSeoChangePlan> = []
    let planWarning: string | null = null
    try { if(quality.status==='insufficient_evidence')throw new Error('Hakulausekkeen sopivuutta tälle sivulle ei ole vahvistettu'); changePlan=makeSeoChangePlan(snapshot,proposed,body.query) }
    catch(error) { planWarning=error instanceof Error?error.message:'Muutossuunnitelmaa ei voitu laatia' }
    return Response.json({snapshot,proposed,analysis,quality,changePlan,planWarning},{headers})
  }catch(e){console.error('Public page analysis failed',e instanceof Error?e.name:'unknown')
    return Response.json({error:'Sivun lukeminen epäonnistui. Tarkista osoite ja sivun julkinen saatavuus.'},{status:422,headers})
  }
}
