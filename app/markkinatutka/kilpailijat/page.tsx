import InsightCard from '../InsightCard'
import Link from 'next/link'

export const dynamic = 'force-static'

type Signal = { source: string; category: string; title: string; why: string; action: string; strength: 'Tarkista' | 'Seuraa'; evidence: string }
const sources = [
  { name: 'Golf Plaisir', domain: 'golfplaisir.fi', focus: 'Tarjonta, kausikampanjat ja hinnoittelun muutokset' },
  { name: 'Golf Tailors', domain: 'golftailors.fi', focus: 'Räätälöidyt golfmatkat ja kohdeviestintä' },
  { name: 'OnGolf', domain: 'ongolf.fi', focus: 'Paketit, kohteet ja lähtöpäivien muutokset' },
  { name: 'EnjoyTravel & Tours', domain: 'enjoytravel.fi', focus: 'Golfmatkojen teemat ja sisällölliset nostot' },
]
const signals: Signal[] = [
  { source: 'Golf Plaisir', category: 'Tarjonta', title: 'Esimerkki: uusi kevätlähtö', why: 'Samankaltaisen ajankohdan uusi tuote voi vaikuttaa valintatilanteeseen.', action: 'Vertaa lähtöpäivät, sisällöt ja loppuhinta ennen johtopäätöksiä.', strength: 'Tarkista', evidence: 'Ei havaintoa – malliesimerkki' },
  { source: 'Golf Tailors', category: 'Viestintä', title: 'Esimerkki: kohde-esittelyn uusi painotus', why: 'Kilpailijoiden viestit auttavat tunnistamaan erottautumismahdollisuuksia.', action: 'Arvioi erottavatko Golfpassin sisältö ja palvelu aidosti.', strength: 'Seuraa', evidence: 'Ei havaintoa – malliesimerkki' },
  { source: 'OnGolf', category: 'Hinta', title: 'Esimerkki: hintatason muutos', why: 'Lähtöhinta ei yksin kerro vertailukelpoista kokonaishintaa.', action: 'Tarkista yömäärä, lennot, green feet, kuljetukset ja lisämaksut.', strength: 'Tarkista', evidence: 'Ei havaintoa – malliesimerkki' },
]

export default function CompetitorPreview() {
  return <main style={{ maxWidth: 1040, margin: 'auto', padding: '32px 20px', fontFamily: 'system-ui,sans-serif', color: '#12324b' }}>
    <Link href="/markkinatutka">← Markkinatutka</Link>
    <p style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, marginTop: 28 }}>MARKKINATUTKA / KILPAILIJAT</p>
    <h1 style={{ fontSize: 'clamp(30px,4vw,44px)', margin: '12px 0' }}>Kilpailijaseuranta</h1>
    <p>Seuraa markkinassa tapahtuvia muutoksia ja muuta havainnot perustelluiksi tarkistustehtäviksi.</p>
    <div role="status" style={{ background: '#fff3dc', border: '1px solid #e0b76d', borderRadius: 12, padding: 16, margin: '22px 0' }}>
      <strong>ESIKATSELU — ei oikeita kilpailijahavaintoja.</strong>
      <p style={{ marginBottom: 0 }}>Kilpailijoita ei ole vielä haettu tai seurattu automaattisesti. Kortit ovat malliesimerkkejä.</p>
    </div>
    <h2>Seurannan kohteet</h2>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
      {sources.map(item => <article key={item.name} style={{ padding: 20, border: '1px solid #d7e4ec', borderRadius: 14 }}>
        <h3 style={{ margin: '0 0 5px' }}>{item.name}</h3>
        <small>{item.domain} · suunniteltu seuranta</small>
        <p>{item.focus}</p>
      </article>)}
    </section>
    <h2 style={{ marginTop: 32 }}>Mallihavainnot ja ehdotetut toimet</h2>
    <section style={{ display: 'grid', gap: 12 }}>
      {signals.map(item => <InsightCard key={item.title} insight={{
        title: item.title,
        analysis: item.why,
        action: item.action,
        rationale: 'Kilpailijan ' + item.category.toLowerCase() + ' voi vaikuttaa siihen, miten Golfpassin tarjonta erottuu. Tarkistus tarvitaan ennen johtopäätöksiä.',
        caveat: 'Tämä on havainnollistava tilanne, ei automaattisesti havaittu kilpailijan muutos.',
        source: item.source + ' – ei tarkistettua yksittäistä lähdeosoitetta',
        confidence: 'Ei vahvistettu (esimerkki)',
        details: <p>Havainnon tila: {item.evidence}. Ennen oikean havainnon julkaisemista tallennetaan alkuperäinen URL, muutoksen ajankohta sekä ennen–jälkeen-vertailu.</p>,
      }} />)}
    </section>
    <h2>Automaattiseurannan hyväksymiskriteerit</h2>
    <p>Jokainen todellinen havainto edellyttää lähde-URL:n, havaitsemisajan, muutoksen vanhan ja uuden tilan sekä lähteeseen sidotun luotettavuusarvion. Hintavertailu edellyttää samanpituisia matkoja ja sisällön erittelyä. Mitään mainosta, julkaisua tai sähköpostia ei tehdä automaattisesti.</p>
  </main>
}
