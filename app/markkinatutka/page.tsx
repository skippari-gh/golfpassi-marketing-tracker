import MarkkinatutkaViewSwitch from './MarkkinatutkaViewSwitch'
import Link from 'next/link'
export const dynamic = 'force-static'

// Design-only preview: all figures and task examples are fictional.
// Nothing on this page writes to Marketing Tracker or accesses analytics.
const tasks = [
  { id:'01', channel:'SEO', priority:'Korkea', title:'Portugalin golfmatkojen hakutulosta kannattaa tarkistaa', analysis:'Esimerkkitilanteessa sivu näkyisi Google-haussa usein, mutta vain harva näkijä siirtyisi sivulle.', action:'Vertaa hakutuloksen otsikkoa ja tekstiä siihen, mitä Portugalin golfmatkoja etsivä haluaa tietää.', reason:'Jos sivu saa jo näkyvyyttä, hakutuloksen kiinnostavuuden parantaminen voi lisätä kävijöitä. Sijoitus ja hakukysely pitää silti tarkistaa ennen muutosta.', detail:'Tarvitaan Search Consolen hakukyselyt, näyttökerrat, klikkaukset, keskimääräinen sijoitus ja ajanjakson vertailu. Klikkausosuus (CTR) tarkoittaa näyttökertojen osuutta, joka johti klikkaukseen.', state:'Odottaa arviota', href:'/markkinatutka/seo' },
  { id:'02', channel:'Kilpailijat', priority:'Keskitaso', title:'Kevätlähtöjen kilpailutilanne kannattaa vertailla', analysis:'Esimerkkitilanteessa kilpailevien matkanjärjestäjien tarjoukset voisivat osua samoille lähtöviikoille.', action:'Tarkista lähtöpäivät, pakettien sisältö ja lopulliset hinnat sekä Golfpassin erottuvat vahvuudet.', reason:'Pelkkä alkaen-hinta ei kerro, ovatko matkat vertailukelpoisia. Esimerkiksi lennot, yöpymiset ja green feet voivat erota.', detail:'Oikea johtopäätös edellyttää kilpailijan alkuperäistä tarjousosoitetta, havaintopäivää sekä ennen–jälkeen-vertailua. Automaattinen kilpailijakeruu ei ole vielä käytössä.', state:'Tutkittava', href:'/markkinatutka/kilpailijat' },
  { id:'03', channel:'Vaikutus', priority:'Keskitaso', title:'Uutiskirjeen hyötyä kannattaa arvioida myös matkakyselyillä', analysis:'Esimerkkitilanteessa uutiskirje voisi tuoda paljon sivustokävijöitä, mutta niiden kaupallinen vaikutus jäisi epäselväksi.', action:'Vertaa uutiskirjeestä tulleita käyntejä ja niiden kautta syntyneitä matkakyselyitä, jos seuranta on käytettävissä.', reason:'Avaus- ja klikkausluvut kertovat kiinnostuksesta, mutta eivät yksin siitä, syntyykö matkakyselyitä.', detail:'Tarvitaan kampanjalinkkien tunnisteet, GA4:n käynnit ja luotettavasti määritellyt matkakyselytapahtumat. Esimerkistä ei ole oikeita mittauslukuja.', state:'Mittaus odottaa', href:'/markkinatutka/tehtavat' },
]
const metrics = [
  { value:'3', label:'Ehdotusta arvioitavaksi', detail:'Mallitehtäviä' },
  { value:'2', label:'Seurannan työaluetta', detail:'SEO ja kilpailijat' },
  { value:'0', label:'Vahvistettua vaikutusta', detail:'Oikeat mittaukset odottavat' },
]
const C = { navy:'#003c70', sky:'#00aaff', orange:'#ff8200', bg:'#f4f8fc', muted:'#637b8f', border:'#dbe7ef' }
export default function MarketIntelligencePreview() {
  return <main style={{ maxWidth:1180, margin:'0 auto', padding:'30px 22px 70px', fontFamily:'Arial,system-ui,sans-serif', color:'#15334b' }}>
    <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:34 }}>
      <Link href="/" style={{ fontSize:14, color:C.navy, textDecoration:'none', fontWeight:700 }}>← Marketing Tracker</Link>
      <span style={{ border:'1px solid '+C.border, padding:'8px 13px', borderRadius:99, fontSize:12, fontWeight:700, color:C.navy }}>GOLFPASSI / MARKKINOINTI</span>
    </header>
    <section style={{ background:'linear-gradient(115deg,#003c70,#08659b)', color:'white', borderRadius:22, padding:'clamp(24px,4vw,44px)', overflow:'hidden', position:'relative' }}>
      <div style={{ width:50, height:5, borderRadius:3, background:C.orange, marginBottom:18 }} />
      <p style={{ fontSize:12, letterSpacing:2, textTransform:'uppercase', opacity:.85, margin:'0 0 10px' }}>MARKKINATUTKA · TYÖPÖYTÄ</p>
      <h1 style={{ fontSize:'clamp(30px,4.5vw,49px)', letterSpacing:'-.035em', lineHeight:1.08, margin:'0 0 15px' }}>Mitä markkinoinnissa<br/>kannattaa tehdä seuraavaksi?</h1>
      <p style={{ fontSize:16, lineHeight:1.65, maxWidth:690, opacity:.9, margin:0 }}>Yksi näkymä, joka yhdistää havainnot, suositellut tehtävät ja niiden vaikutusten seurannan.</p>
    </section>
    <aside role="status" style={{ margin:'18px 0 26px', background:'#fff7e9', border:'1px solid #efc586', borderRadius:12, padding:'14px 18px', lineHeight:1.5, fontSize:14 }}>
      <strong>Esikatselu – esimerkkitietoja.</strong> Alla olevat tehtävät ja luvut eivät perustu Golfpassin todelliseen analytiikkaan. Automaattista tehtävien tallennusta, julkaisua tai kilpailijatietojen keruuta ei ole kytketty päälle.
    </aside>
    <MarkkinatutkaViewSwitch professional={<>
    <section aria-label="Tilannekuva" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
      {metrics.map(m=><article key={m.label} style={{ background:C.bg, border:'1px solid '+C.border, borderRadius:16, padding:22 }}>
        <strong style={{ display:'block', fontSize:38, lineHeight:1, color:C.navy, marginBottom:10 }}>{m.value}</strong>
        <strong style={{ display:'block', fontSize:14 }}>{m.label}</strong>
        <small style={{ display:'block', color:C.muted, marginTop:7 }}>{m.detail}</small>
      </article>)}
    </section>
    <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:24, marginTop:35, alignItems:'start' }}>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
          <h2 style={{ fontSize:24, color:C.navy, margin:'0 0 7px' }}>Tärkeimmät seuraavat toimet</h2><p><Link href="/markkinatutka/tehtavat" style={{fontSize:13,fontWeight:700,color:C.navy}}>Avaa hyväksyntätyönkulun esikatselu →</Link></p>
        </div>
        <p style={{ margin:'0 0 17px', color:C.muted, fontSize:14 }}>Suositus → arviointi → toteutus → mittaus</p>
        <div style={{ display:'grid', gap:12 }}>
          {tasks.map(t=><article key={t.id} style={{ border:'1px solid '+C.border, borderRadius:16, padding:20, background:'white', boxShadow:'0 3px 14px rgba(0,60,112,.045)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
              <small style={{ color:C.muted, fontWeight:700, letterSpacing:1 }}>{t.id} · {t.channel}</small>
              <small style={{ background:t.priority==='Korkea'?'#fff0df':'#eef4f8', color:C.navy, padding:'5px 9px', borderRadius:8 }}>{t.priority} prioriteetti</small>
            </div>
            <h3 style={{ fontSize:18, lineHeight:1.35, color:C.navy, margin:'13px 0 16px' }}>{t.title}</h3>
            <div style={{ display:'grid', gap:12 }}>
              <section style={{ background:'#eff7fc', borderRadius:11, padding:'13px 15px' }}>
                <strong style={{ display:'block', color:C.navy, fontSize:14 }}>Mitä tämä tarkoittaa?</strong>
                <p style={{ fontSize:14, lineHeight:1.6, margin:'6px 0 0' }}>{t.analysis}</p>
              </section>
              <section style={{ background:'#fff8ef', borderLeft:'4px solid '+C.orange, borderRadius:9, padding:'13px 15px' }}>
                <strong style={{ display:'block', color:C.navy, fontSize:14 }}>Mitä kannattaa tehdä?</strong>
                <p style={{ fontSize:14, lineHeight:1.6, margin:'6px 0 0' }}>{t.action}</p>
              </section>
              <section style={{ padding:'2px 3px 6px' }}>
                <strong style={{ display:'block', color:C.navy, fontSize:14 }}>Miksi suosittelemme tätä?</strong>
                <p style={{ fontSize:14, lineHeight:1.6, margin:'6px 0 0' }}>{t.reason}</p>
              </section>
              <details style={{ borderTop:'1px solid '+C.border, padding:'12px 3px' }}>
                <summary style={{ cursor:'pointer', color:C.navy, fontSize:14, fontWeight:700 }}>Näytä lähteet ja tarkemmat tiedot</summary>
                <p style={{ fontSize:13, lineHeight:1.65, color:C.muted }}>{t.detail}</p>
                <p style={{ fontSize:13, color:C.muted, marginBottom:0 }}>Esimerkki, ei vahvistettua havaintoa. Lähde ja mittauspäivä puuttuvat.</p>
              </details>
            </div>
            <div style={{ borderTop:'1px solid '+C.border, paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <small style={{ color:C.muted }}>{t.state}</small>
              <Link href={t.href} style={{ color:C.navy, fontSize:14, fontWeight:700 }}>Tutki havaintoa →</Link>
            </div>
          </article>)}
        </div>
      </div>
      <div style={{ display:'grid', gap:18 }}>
        <section style={{ background:C.bg, border:'1px solid '+C.border, borderRadius:18, padding:24 }}>
          <h2 style={{ color:C.navy, fontSize:21, margin:'0 0 10px' }}>Havainnot ja työkalut</h2>
          <p style={{ fontSize:14, lineHeight:1.55, color:C.muted }}>Kaksi ensimmäistä analyysialuetta ovat käytettävissä esikatseluna.</p>
          <Link href="/markkinatutka/seo" style={{ display:'block', color:C.navy, padding:'14px 0', borderBottom:'1px solid '+C.border, fontWeight:700 }}>↗ SEO-mahdollisuudet <span style={{ float:'right',fontSize:12,fontWeight:400 }}>Hakukyselyt</span></Link>
          <Link href="/markkinatutka/muutokset" style={{ display:'block', color:C.navy, padding:'14px 0', borderBottom:'1px solid '+C.border, fontWeight:700 }}>↗ Muutosten hyväksyntä <span style={{ float:'right',fontSize:12,fontWeight:400 }}>Esikatselu</span></Link>
          <Link href="/markkinatutka/kilpailijat" style={{ display:'block', color:C.navy, padding:'14px 0', fontWeight:700 }}>↗ Kilpailijaseuranta <span style={{ float:'right',fontSize:12,fontWeight:400 }}>Tarjonta</span></Link>
        </section>
        <section style={{ border:'1px solid '+C.border, borderRadius:18, padding:24 }}>
          <h2 style={{ color:C.navy, fontSize:21, margin:'0 0 14px' }}>Näin järjestelmä oppii</h2>
          {[
            ['01','Havaitsee muutoksen','Tunnistaa mittareihin tai lähteisiin perustuvan signaalin.'],
            ['02','Ehdottaa tehtävää','Kirjaa perustelun, prioriteetin ja seuraavan toimen.'],
            ['03','Ihminen hyväksyy','Markkinointitoimi ei käynnisty automaattisesti.'],
            ['04','Mittaa vaikutuksen','Vertaa tulosta lähtötasoon ja kirjaa opit.'],
          ].map(x=><div key={x[0]} style={{ display:'flex', gap:13, padding:'12px 0', borderBottom:'1px solid '+C.border }}>
            <strong style={{ color:C.sky }}>{x[0]}</strong><div><strong style={{ display:'block', fontSize:14 }}>{x[1]}</strong><span style={{ display:'block', color:C.muted, fontSize:13, lineHeight:1.5, marginTop:3 }}>{x[2]}</span></div>
          </div>)}
          <p style={{ color:C.muted, fontSize:12, lineHeight:1.5, margin:'13px 0 0' }}>Toimintamalli on suunnitelma. Vaikutusten mittaus ja oppiva palautesilmukka eivät ole vielä käytössä.</p>
        </section>
      </div>
    </section>
    </>} />
  </main>
}
