import type { SearchConsoleRow } from './search-console'

// Deterministic, review-only copy suggestions. Never claims to have read a page,
// and never invents package inclusions, prices, or availability.
const destinations: Record<string,{name:string;theme:string;areas:string}> = {
  madeira:{name:'Madeira',theme:'Madeiran golfmatkat',areas:'Madeiran hotellit, golfkentät ja lähtöpäivät'},
  portugali:{name:'Portugali',theme:'Portugalin golfmatkat',areas:'Algarven, Madeiran ja Lissabonin alueen vaihtoehdot'},
  espanja:{name:'Espanja',theme:'Espanjan golfmatkat',areas:'Espanjan kohteet, hotellit ja lähtöpäivät'},
  algarve:{name:'Algarve',theme:'Algarven golfmatkat',areas:'Algarven hotellit, kentät ja lähtöpäivät'},
  lissabon:{name:'Lissabon',theme:'Lissabonin alueen golfmatkat',areas:'alueen golfkentät, hotellit ja lähdöt'},
}
export type SeoCopySuggestion = {
  focusQuery:string
  relatedQueries:string[]
  title:string
  description:string
  heading:string
  intro:string
  explanation:string
  verification:string[]
  status:'draft_unverified'
}
export function suggestSeoCopy(row: Pick<SearchConsoleRow,'query'|'page'|'ctr'|'position'>): SeoCopySuggestion {
  const query=row.query.trim().replace(/\s+/g,' ')
  const key=Object.keys(destinations).find(k=>new RegExp('(^|\\s)'+k+'(\\s|$)','i').test(query.toLowerCase()))
  const destination=key?destinations[key]:null
  const generic=!destination
  const title=destination ? destination.theme+' – hotellit ja golfpaketit | Golfpassi'
    : 'Golfmatkat – kohteet ja matkapaketit | Golfpassi'
  const description=destination
    ? 'Tutustu '+destination.theme.toLowerCase()+' -tarjontaan. Vertaile hotelleja, lähtöpäiviä ja matkojen sisältöjä sekä löydä sopiva golfmatka Golfpassilta.'
    : 'Tutustu Golfpassin golfmatkoihin. Vertaile kohteita, hotelleja, lähtöpäiviä ja matkojen sisältöjä.'
  const heading=destination?destination.theme+' – tutustu matkoihin':'Golfmatkat – tutustu kohteisiin'
  const intro=destination
    ? 'Suunnitteletko golfmatkaa kohteeseen '+destination.name+'? Tutustu ajankohtaisiin matkavaihtoehtoihin ja vertaile hotelleja, golfkenttiä, lähtöpäiviä sekä matkojen sisältöjä. Tarkista kunkin matkan tarkat palvelut sen omalta sivulta.'
    : 'Tutustu Golfpassin golfmatkoihin ja vertaile kohteita, lähtöpäiviä, hotelleja ja matkapakettien sisältöjä. Valitse sopiva vaihtoehto ajantasaisen matkatarjonnan perusteella.'
  const relatedQueries=destination?[destination.theme.toLowerCase(), 'golfmatkat '+destination.name.toLowerCase(),destination.name.toLowerCase()+' golfmatka']
    : [query,'golfmatkat','golfmatkapaketit']
  return {
    focusQuery:query,relatedQueries:[...new Set(relatedQueries)],
    title,description,heading,intro,
    explanation:row.position<=10 && row.ctr<.03
      ? 'Hakutulos näkyy suhteellisen hyvillä sijoilla, mutta klikkausosuus on pieni. Otsikon ja kuvauksen osuvuutta kannattaa kokeilla vasta hakutarkoituksen tarkistamisen jälkeen.'
      : 'Sijoitus tai hakutarkoitus voi rajoittaa näkyvyyttä. Sivun sisältöä kannattaa verrata hakulausekkeeseen ennen muutoksia.',
    verification:[
      'Tarkista, että sivu on olemassa ja että sen nykyinen otsikko, kuvaus ja pääotsikko on luettu.',
      'Varmista, että sivu todella tarjoaa kyseisen kohteen matkoja; älä julkaise automaattisesti.',
      'Vertaile ennen–jälkeen-jaksojen hakukyselyitä ja huomioi sesonki.',
      ...(generic?['Hakutermille ei löytynyt luotettavaa kohdetunnistusta: vaatii käsin arvioinnin.']:[]),
    ],
    status:'draft_unverified',
  }
}
