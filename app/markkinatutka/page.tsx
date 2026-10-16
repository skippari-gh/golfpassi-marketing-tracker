import Link from 'next/link'

export const dynamic = 'force-static'

const observations = [
  { category: 'Kilpailijat', title: 'Uusi kevätmatkan mainos', explanation: 'Esimerkki: kilpailijan uusi Espanjan kevätlähtö', action: 'Vertaa sisältöä ja hintaa Golfpassin tarjontaan.' },
  { category: 'SEO', title: 'Portugalin hakunäkyvyys', explanation: 'Esimerkki: hakukyselyillä voi olla kasvavaa kysyntää', action: 'Tarkista Search Consolen klikkaukset, näyttökerrat ja CTR.' },
  { category: 'GEO', title: 'Näkyvyys tekoälyvastauksissa', explanation: 'Esimerkki: seuraa mainitaanko Golfpassi kysymyskohtaisissa testeissä', action: 'Kirjaa kysymys, vastaus, lähde, ajankohta ja toistettavuus.' },
]

export default function MarketIntelligencePreview() {
  return (
    <main style={{ maxWidth: 1050, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif', color: '#12324b' }}>
      <Link href="/" style={{ color: '#003c70' }}>← Marketing Tracker</Link>
      <p style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, marginTop: 32 }}>Golfpassi / Marketing Intelligence</p>
      <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', marginBottom: 8 }}>Markkinatutka</h1>
      <p>Mitkä asiat muuttuivat, miksi niillä on väliä ja mitä kannattaa tehdä seuraavaksi?</p>
      <div role="status" style={{ background: '#fff3dc', border: '1px solid #e0b76d', borderRadius: 12, padding: 16, margin: '22px 0' }}>
        <strong>ESIKATSELU — vain esimerkkidataa.</strong> Tämä sivu ei hae eikä näytä Golfpassin todellisia analytiikka- tai kilpailijatietoja.
      </div>
      <section aria-label="Aamun yhteenveto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
        {[[ '4', 'Seurattavaa kilpailijaa' ], [ '20', 'Suunniteltua hakuteemaa' ], [ '3', 'Esimerkkisuositusta' ]].map(([value, label]) => (
          <div key={label} style={{ background: '#eef6fa', padding: 22, borderRadius: 14 }}>
            <strong style={{ display: 'block', fontSize: 35 }}>{value}</strong><span>{label}</span>
          </div>
        ))}
      </section>
      <p><Link href="/markkinatutka/seo" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 9, background: '#003c70', color: 'white', textDecoration: 'none' }}>Tutustu SEO-mahdollisuuksiin (esikatselu) →</Link></p>
      <h2 style={{ marginTop: 36 }}>Kolme esimerkkihavaintoa</h2>
      <section style={{ display: 'grid', gap: 12 }}>
        {observations.map((item, index) => (
          <article key={item.title} style={{ border: '1px solid #d7e4ec', borderRadius: 14, padding: 22 }}>
            <small style={{ color: '#356480' }}>{index + 1}. {item.category}</small>
            <h3 style={{ margin: '8px 0' }}>{item.title}</h3>
            <p>{item.explanation}</p>
            <p><strong>Seuraava toimenpide:</strong> {item.action}</p>
          </article>
        ))}
      </section>
      <h2 style={{ marginTop: 36 }}>Toteutuksen periaatteet</h2>
      <p>Yhteydet lisätään vain lukuoikeuksin. Suositukset perustellaan lähteillä ja havaintojen luotettavuus näytetään. Julkaisut, mainosmuutokset ja sähköpostit edellyttävät erillistä hyväksyntää.</p>
      <p>Ennen oikean datan kytkemistä näkymä suojataan kirjautumisella ja palvelinpuolen käyttöoikeustarkistuksilla.</p>
    </main>
  )
}
