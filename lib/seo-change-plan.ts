import type { PublicPageSnapshot } from './golfpassi-page-reader'
import type { SeoCopySuggestion } from './seo-copy-suggestions'
import { makeWebsiteChangeDraft, type ProposedChange } from './marketing-change-approval'

// Converts a verified page read and a generated suggestion into independent,
// human-reviewable draft changes. Never writes to a CMS or Google Ads.
export function makeSeoChangePlan(snapshot:PublicPageSnapshot,copy:SeoCopySuggestion,query:string):ProposedChange[] {
  if(snapshot.url!==snapshot.finalUrl)throw new Error('Sivun osoite muuttui – tarkista lähde')
  if(!snapshot.h1.length)throw new Error('Sivulta ei löytynyt pääotsikkoa. Tarkista sivu ennen luonnosta.')
  if(!snapshot.title || !snapshot.description)throw new Error('Nykyiset metatiedot puuttuvat – tarkista ennen muutosta')
  if(!Number.isFinite(Date.parse(snapshot.fetchedAt)))throw new Error('Sivun noutoaika puuttuu')
  if(copy.status!=='draft_unverified')throw new Error('Ehdotuksen tila ei kelpaa')
  const changes: Array<{field:string;before:string;after:string}> = [
    {field:'Google-otsikko',before:snapshot.title,after:copy.title},
    {field:'Metakuvaus',before:snapshot.description,after:copy.description},
    {field:'Pääotsikko (H1)',before:snapshot.h1[0],after:copy.heading},
  ]
  return changes.filter(c=>c.before.trim()!==c.after.trim()).map((c,i)=>
    makeWebsiteChangeDraft({
      id:'seo-'+i+'-'+snapshot.fetchedAt,
      url:snapshot.url,field:c.field,before:c.before,after:c.after,
      reason:'Hakukysely: '+query+'. '+copy.explanation+' Tarkista myös sivun muut kohteet ja matkatarjonta.',
      source:snapshot.url,capturedAt:snapshot.fetchedAt,
    })
  )
}
