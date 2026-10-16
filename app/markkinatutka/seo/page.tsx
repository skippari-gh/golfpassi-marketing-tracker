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
      <p style={{ marginBottom: 0 }}>Search Console -tietojen käyttö odottaa palvelinpuolen tunnistautumista ja yhteyden testausta. Sivulla ei tehdä Search Console -API-kutsuja.</p>
    </div>
    <ProtectedSeoReport />
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
        details: <><p>Sivu: {row.page}</p><p>Klikkaukset: {formatNumber(row.clicks)} · Näyttökerrat: {formatNumber(row.impressions)} · Klikkausosuus (CTR): {(row.ctr * 100).toFixed(1)} % · Keskimääräinen sijoitus: {row.position.toFixed(1)}</p><p>CTR tarkoittaa osuutta hakutuloksen näyttökerroista, jotka johtivat klikkaukseen.</p></>,
      }} />)}
    </section>
  </main>
}
