import { suggestSeoCopy } from '../../../lib/seo-copy-suggestions'
import InsightCard from '../InsightCard'
import ProtectedSeoReport from './ProtectedSeoReport'
import Link from 'next/link'
import { identifySearchOpportunities } from '../../../lib/search-console-analysis'
import type { SearchConsoleRow } from '../../../lib/search-console'

export const dynamic = 'force-static'

// Fictional demonstration data. Real Search Console values must NEVER
// be passed to this page before server-side authorization is implemented.
const demoRows: SearchConsoleRow[] = [
  { query: 'golfmatkat portugali', page: 'https://golfpassi.fi/portugali/', clicks: 12, impressions: 1200, ctr: 0.01, position: 7 },
  { query: 'golfmatkat espanja', page: 'https://golfpassi.fi/espanja/', clicks: 20, impressions: 400, ctr: 0.05, position: 14 },
  { query: 'golfmatkat madeira', page: 'https://golfpassi.fi/madeira/', clicks: 9, impressions: 520, ctr: 0.0173, position: 9 },
  { query: 'golfpassi', page: 'https://golfpassi.fi/', clicks: 700, impressions: 950, ctr: 0.73, position: 1 },
]

const formatNumber = (value: number) => new Intl.NumberFormat('fi-FI').format(value)

export default function SeoPreview() {
  const opportunities = identifySearchOpportunities(demoRows)
  return <main style={{ maxWidth: 1040, margin: 'auto', padding: '36px 20px', color: '#003c70', fontFamily: 'system-ui,sans-serif' }}>
    <Link href="/markkinatutka">← Takaisin Markkinatutkaan</Link>
    <p style={{ marginTop: 32, fontSize: 13, letterSpacing: 2 }}>MARKKINATUTKA / HAKUNÄKYVYYS</p>
    <h1 style={{ fontSize: 42, margin: '8px 0' }}>SEO-mahdollisuudet</h1>
    <p>Hakukyselyiden mitatut klikkaukset, näyttökerrat, CTR ja keskimääräinen sijoitus tuottavat tarkistettavia toimenpide-ehdotuksia.</p>
    <div role="status" style={{ border: '1px solid #d79b35', padding: 16, borderRadius: 12, background: '#fff4df', margin: '22px 0' }}>
      <strong>ESIMERKKIDATA – EI OIKEITA GOLFPASSIN HAKUTULOKSIA.</strong>
      <p style={{ marginBottom: 0 }}>Kirjautuminen toimii testiympäristössä, mutta Search Console -palvelutilin tunnukset puuttuvat vielä tästä ympäristöstä. Alla oleva Oikea Search Console -data -osio hakee tietoja vain kirjautuneelle käyttäjälle, kun yhteys on määritelty.</p>
    </div>
    <div id="oikea-data"><ProtectedSeoReport /></div>
    <p style={{fontSize:13,color:"#637b8f"}}>Alla olevat sisältöehdotukset ja hakusana-analyysit ovat malliesimerkkejä, eivät oikeaa Search Console -dataa.</p>
    <section aria-label="Konkreettinen SEO-tekstiehdotus" style={{border:'1px solid #bfd9e8',background:'#f5faff',padding:'clamp(18px,3vw,26px)',borderRadius:16,margin:'20px 0 28px',color:'#153d5a'}}>
      <small style={{letterSpacing:1.2,fontWeight:700,color:'#527a93'}}>SISÄLTÖEHDOTUS · EI JULKAISTU</small>
      <h2 style={{color:'#003c70',fontSize:25,margin:'10px 0'}}>Näin Portugalin golfmatkojen hakutulosta ja sivua voisi parantaa</h2>
      <p style={{lineHeight:1.65}}>Ehdotukset perustuvat Golfpassin julkisesti näkyvään Portugali-tarjontaan. Hakumääriä tai nykyisen sivun metatietoja ei ole vahvistettu, joten ehdotuksia ei pidä esittää mitattuina tuloksina.</p>
      <h3 style={{color:'#003c70'}}>Tavoiteltavat hakulausekkeet</h3>
      <p style={{lineHeight:1.7}}><strong>Pääaihe:</strong> golfmatkat Portugali. <strong>Luontevat rinnakkaiset haut:</strong> Portugalin golfmatkat, golfmatkat Algarve, golfmatkat Madeira, golfmatkat Lissabon, golfmatkat Portugali 2027, golfmatkat Portugali lennot ja golf.</p>
      <div style={{background:'white',border:'1px solid #d9e6ee',borderRadius:12,padding:'16px 18px'}}>
        <strong>Google-otsikko (ehdotus)</strong>
        <p style={{fontSize:18,color:'#003c70',fontWeight:700}}>Golfmatkat Portugali – Algarve, Madeira ja Lissabon | Golfpassi</p>
        <strong>Metakuvaus (ehdotus)</strong>
        <p style={{lineHeight:1.6}}>Löydä Portugalin golfmatkat Algarveen, Madeiralle ja Lissabonin alueelle. Tutustu golfpaketteihin, hotelleihin, lähtöpäiviin ja matkojen sisältöön.</p>
      </div>
      <h3 style={{color:'#003c70'}}>Sivun pääotsikko (H1)</h3>
      <p style={{fontSize:18,fontWeight:700}}>Golfmatkat Portugaliin – Algarve, Madeira ja Lissabon</p>
      <h3 style={{color:'#003c70'}}>Suositeltu ingressi</h3>
      <p style={{lineHeight:1.7}}>Portugali tarjoaa golfmatkoille monipuolisia vaihtoehtoja Algarven tunnetuista golfkohteista Madeiran maisemiin ja Lissabonin alueen kentille. Tutustu Golfpassin matkoihin, vertaile hotelleja, lähtöpäiviä ja golfpakettien sisältöjä sekä löydä itsellesi sopiva golfmatka Portugaliin.</p>
      <details style={{padding:'12px 0',borderTop:'1px solid #d2e2ec'}}>
        <summary style={{cursor:'pointer',fontWeight:700}}>Näytä toteutusohje ja perustelut</summary>
        <p style={{lineHeight:1.65}}>Jaa sisältö kolmeen osaan: Algarven golfmatkat, Madeiran golfmatkat ja Lissabonin alueen golfmatkat. Linkitä kunkin alueen todellisiin matkoihin. Kerro matkakohtaisesti lähtöajat, sisältö ja hinta vain ajantasaisesta matkadatasta. Älä toista hakusanoja väkinäisesti.</p>
        <p style={{lineHeight:1.65}}>Ennen toteutusta: selvitä sivuston todellinen Portugali-koontisivu ja sen nykyiset H1-, title- ja meta description -tekstit. Tässä esimerkissä käytettyä osoitetta /portugali/ ei ole varmistettu toimivaksi. Varmista Search Consolesta oikeat hakulausekkeet, kyselyjen sijainti ja klikkausosuus ennen muutoksen priorisointia.</p>
        <p style={{lineHeight:1.65}}>Mittaa muutoksen jälkeen samoilla hakukyselyillä näyttökerrat, klikkaukset, klikkausosuus ja mahdollisuuksien mukaan matkakyselyt. Vertaa vastaaviin ajanjaksoihin ja huomioi kausivaihtelu. Parannusta ei voi luvata etukäteen.</p>
      </details>
    </section>
    <section aria-label="Hakutermien analyysi" style={{ display: 'grid', gap: 15 }}>
      {opportunities.map(row => <InsightCard key={row.query + row.page} insight={{
        title: 'Hakusana ”' + row.query + '” kannattaa tarkistaa',
        analysis: row.position <= 10
          ? 'Sivu näkyy näillä esimerkkiluvuilla hakutuloksissa melko hyvin, mutta hakija siirtyy sivulle harvoin.'
          : 'Sivu ei vielä näy näillä esimerkkiluvuilla hakutulosten kärkipäässä, mikä voi rajoittaa käyntejä.',
        action: row.position <= 10
          ? 'Vertaa hakulauseketta sivun otsikkoon, hakutulostekstiin ja sisältöön. Tarkista ensin hakutuloksen sijoitus.'
          : 'Selvitä, vastaako sivu hakijan kysymykseen ja voiko sisältöä täydentää hyödyllisesti.',
        rationale: 'Havainto perustuu näyttökertojen, klikkausten ja sijoituksen yhdistelmään. ' + row.reason,
        caveat: 'Malliluvut eivät ole ennuste. Johtopäätös pitää varmistaa oikeasta aineistosta.',
        source: 'Kuvitteellinen Google Search Console -esimerkkiaineisto',
        confidence: 'Malliesimerkki – ei todettua näyttöä',
        details: <><SeoCopyDraft row={row} /><p>Sivu: {row.page}</p><p>Klikkaukset: {formatNumber(row.clicks)} · Näyttökerrat: {formatNumber(row.impressions)} · Klikkausosuus (CTR): {(row.ctr * 100).toFixed(1)} % · Keskimääräinen sijoitus: {row.position.toFixed(1)}</p><p>CTR tarkoittaa osuutta hakutuloksen näyttökerroista, jotka johtivat klikkaukseen.</p></>,
      }} />)}
    </section>
  </main>
}

function SeoCopyDraft({row}:{row:SearchConsoleRow}) {
  const draft=suggestSeoCopy(row)
  return <section style={{border:'1px solid #c5dcea',background:'#f3f9fc',padding:16,borderRadius:12,margin:'12px 0',color:'#143b59'}}>
    <h4 style={{fontSize:17,margin:'0 0 8px'}}>Automaattinen tekstiehdotus – tarkistettava luonnos</h4>
    <p><strong>Ensisijainen haku:</strong> {draft.focusQuery}</p>
    <p><strong>Rinnakkaiset hakulausekkeet:</strong> {draft.relatedQueries.join(', ')}</p>
    <p><strong>Google-otsikko:</strong> {draft.title}</p>
    <p><strong>Metakuvaus:</strong> {draft.description}</p>
    <p><strong>Sivun pääotsikko:</strong> {draft.heading}</p>
    <p><strong>Ingressiehdotus:</strong> {draft.intro}</p>
    <p><strong>Perustelu:</strong> {draft.explanation}</p>
    <strong>Ennen julkaisua varmista:</strong>
    <ul>{draft.verification.map(item=><li key={item}>{item}</li>)}</ul>
  </section>
}
