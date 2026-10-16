import type { PublicPageSnapshot } from './golfpassi-page-reader'
import type { SeoCopySuggestion } from './seo-copy-suggestions'

export type QualityCheck = {label:string;ok:boolean;explanation:string}
export type SeoQualityReview = {status:'requires_review'|'insufficient_evidence';checks:QualityCheck[];summary:string}

// Presence of a keyword is not proof of search intent or commercial relevance.
// This assessment can only identify obvious evidence gaps, not approve publishing.
export function reviewSeoEvidence(snapshot:PublicPageSnapshot,copy:SeoCopySuggestion):SeoQualityReview {
 const text=[snapshot.title,snapshot.description,...snapshot.h1,...snapshot.h2,...snapshot.excerpts].filter(Boolean).join(' ').toLocaleLowerCase('fi-FI')
 const queryTokens=copy.focusQuery.toLocaleLowerCase('fi-FI').split(/\s+/).filter(t=>t.length>=5&&!['golfmatkat','golfmatka','golfpaketit'].includes(t))
 const relevant=queryTokens.length>0 && queryTokens.some(token=>text.includes(token))
 const checks:QualityCheck[]=[
  {label:'Sivun nykyinen teksti luettu',ok:!!snapshot.title&&!!snapshot.description&&snapshot.h1.length>0,explanation:'Vertailu tarvitsee nykyisen Google-otsikon, metakuvauksen ja pääotsikon.'},
  {label:'Sivun ja hakulausekkeen yhteys',ok:relevant,explanation:relevant?'Hakulausekkeen kohdetermi esiintyy sivun tekstissä. Tämä ei vielä vahvista hakutarkoitusta.':'Hakulausekkeen kohdetermiä ei löytynyt luetusta tekstinäytteestä tai haku on liian yleinen. Varmista sivun tarkoitus käsin.'},
  {label:'Matkatarjonta vahvistettu',ok:false,explanation:'Pelkkä sivun HTML ei vahvista lähtöpäivien, hintojen tai matkapakettien ajantasaisuutta.'},
  {label:'Hakukysynnän vaikutus vahvistettu',ok:false,explanation:'Muutosvaikutusta ei ole mitattu. Search Console -havainnot eivät osoita tulevaa tulosta.'},
 ]
 return {status:checks[0].ok&&checks[1].ok?'requires_review':'insufficient_evidence',checks,summary:checks[1].ok?'Hakukysely liittyy luettuun sivusisältöön, mutta ehdotus vaatii edelleen toimituksellisen tarkistuksen.':'Hakukyselyä ja sivua ei voitu yhdistää riittävän luotettavasti. Tekstiä ei tule hyväksyä julkaisuun ilman lisäselvitystä.'}
}
