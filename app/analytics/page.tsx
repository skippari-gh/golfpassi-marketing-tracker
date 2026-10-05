// GA4 production credentials refreshed
import Link from 'next/link'
import { getGa4Dashboard } from '../../lib/ga4'
import { getMetaDashboard, getMetaOrganicDashboard } from '../../lib/meta'
export const dynamic = 'force-dynamic'

const nf = new Intl.NumberFormat('fi-FI')
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const p = await searchParams
  const days = [7,30,90,365].includes(Number(p.days)) ? Number(p.days) : 30
  let data: Awaited<ReturnType<typeof getGa4Dashboard>> | null = null
  let error = ''
  let meta: Awaited<ReturnType<typeof getMetaDashboard>> | null = null
  let metaError = ''
  let organic: Awaited<ReturnType<typeof getMetaOrganicDashboard>> | null = null
  let organicError = ''
  try { data = await getGa4Dashboard(days) } catch (e) { error = e instanceof Error ? e.message : 'GA4-yhteys ei ole vielä valmis' }
  try { meta = await getMetaDashboard(days) } catch (e) { metaError = e instanceof Error ? e.message : 'Meta-yhteys ei ole vielä valmis' }
  try { organic = await getMetaOrganicDashboard(days) } catch (e) { organicError = e instanceof Error ? e.message : 'Metan orgaaninen data ei ole vielä saatavilla' }
  const metaAuthExpired = (message: string) => message.startsWith('META_AUTH_EXPIRED:')
  const pct = (a:number,b:number) => b ? ((a-b)/b)*100 : 0
  const tone = (v:number) => v > 5 ? 'nousussa' : v < -5 ? 'laskussa' : 'vakaalla tasolla'
  const gaAnalysis = data ? `Sivustolla oli ${nf.format(data.summary[0]||0)} käyttäjää ja ${nf.format(data.summary[2]||0)} istuntoa. Sitoutumisaste oli ${((data.summary[4]||0)*100).toFixed(1)} %. ${data.channels?.[0] ? `Suurin liikenteen lähde oli ${data.channels[0].dimensions[0]} (${nf.format(data.channels[0].metrics[0])} istuntoa).` : ''} ${successView('ga',(data.summary[4]||0)*100)}` : ''
  const successView = (kind:'ga'|'organic'|'ads', a:number, b=0) => { if(kind==='ga') return a>=55 ? 'Näkemys: kokonaisuus näyttää hyvältä – liikenne myös sitoutuu sisältöön.' : a>=40 ? 'Näkemys: kokonaisuus on kohtuullinen, mutta sitoutumisessa on parannettavaa.' : 'Näkemys: tulos jää heikoksi – erityisesti sitoutumista kannattaa parantaa.'; if(kind==='organic') return a>=5 ? 'Näkemys: sisältö onnistuu sitouttamaan yleisöä erittäin hyvin.' : a>=2 ? 'Näkemys: sisältö toimii kohtuullisen hyvin, mutta parhaiden julkaisujen oppeja kannattaa monistaa.' : 'Näkemys: sitoutuminen jää melko matalaksi suhteessa tavoittavuuteen.'; return a>=2 && b<=1 ? 'Näkemys: mainonta näyttää tehokkaalta sekä kiinnostuksen että klikkauskustannuksen perusteella.' : a>=1 ? 'Näkemys: mainonta toimii kohtuullisesti, mutta tehokkuudessa on optimointivaraa.' : 'Näkemys: mainonnan tehoa kannattaa parantaa – kiinnostus jää tällä jaksolla matalaksi.' }
  const organicAnalysis = (name:string, total:any, posts:any[]) => { const e=Number(total.engagements||0), r=Number(total.reach||0), rate=r?e/r*100:0; const best=posts?.[0]; return `${name}: ${nf.format(r)} yhteenlaskettua julkaisujen tavoittavuutta ja ${nf.format(e)} sitoutumista${r?`, sitoutumisia suhteessa tavoittavuuteen ${rate.toFixed(1)} %`:''}. ${best ? `Eniten sitoutumista keräsi “${String(best.text||'').slice(0,70)}${String(best.text||'').length>70?'…':''}” (${nf.format(best.engagements)}).` : 'Jaksolta ei ole julkaisuja.'} ${successView('organic',rate)}` }
  const metaAnalysis = meta ? (()=>{ const t=meta.total; const ctr=Number(t?.ctr||0), cpc=Number(t?.cpc||0); const best=[...meta.campaigns].sort((a,b)=>Number(b.clicks||0)-Number(a.clicks||0))[0]; return `Mainonta toi ${nf.format(Number(t?.clicks||0))} klikkausta ja tavoitti ${nf.format(Number(t?.reach||0))} käyttäjää. CTR oli ${ctr.toFixed(2)} % ja klikkauksen keskihinta ${cpc.toLocaleString('fi-FI',{style:'currency',currency:'EUR'})}. ${best?`Eniten klikkauksia toi “${best.campaign_name||'kampanja'}” (${nf.format(Number(best.clicks||0))}).`:''} ${successView('ads',ctr,cpc)}` })() : ''
  const labels = ['Käyttäjät','Uudet käyttäjät','Istunnot','Sivunäytöt','Sitoutumisaste','Key events']
  return <main className="ga">
    <header><Link href="/">← Etusivu</Link><div><b>Golfpassi</b> Marketing Tracker</div></header>
    <section className="title"><div><span>ANALYTIIKKA</span><h1>GA4</h1><p>Golfpassi.fi:n tärkeimmät luvut yhdessä näkymässä.</p></div>
      <nav>{[7,30,90,365].map(d=><Link className={days===d?'on':''} href={'/analytics?days='+d} key={d}>{d===365?'12 kk':d+' pv'}</Link>)}</nav>
    </section>
    {error ? <section className="notice"><h2>GA4-yhteys odottaa tunnuksia</h2><p>Käyttöliittymä on valmis. Lisää Verceliin GA4_PROPERTY_ID, GA4_CLIENT_EMAIL ja GA4_PRIVATE_KEY ja anna palvelutilille lukuoikeus GA4-propertyyn.</p><small>{error}</small></section> :
    <>
      <section className="cards">{labels.map((label,i)=><article key={label}><span>{label}</span><strong>{i===4?((data!.summary[i]||0)*100).toFixed(1)+' %':nf.format(data!.summary[i]||0)}</strong></article>)}</section>
      <section className="analysis"><b>Tiivis analyysi</b><p>{gaAnalysis}</p></section><section className="grid"><article><h2>Liikenteen lähteet</h2><table><tbody>{data!.channels.map((r,i)=><tr key={i}><td>{r.dimensions[0]}</td><td>{nf.format(r.metrics[0])} istuntoa</td><td>{nf.format(r.metrics[1])} käyttäjää</td></tr>)}</tbody></table></article>
      <article><h2>Suosituimmat sivut</h2><table><tbody>{data!.pages.map((r,i)=><tr key={i}><td>{r.dimensions[0]}</td><td>{nf.format(r.metrics[0])} näyttöä</td><td>{nf.format(r.metrics[1])} käyttäjää</td></tr>)}</tbody></table></article></section>
    </>}
    <section className="organic">
      <div className="metaHead"><div><span>META · ORGAANINEN</span><h2>Facebook & Instagram</h2><p>Golfpassin omien somekanavien orgaaninen näkyvyys ja sitoutuminen samalta ajanjaksolta.</p></div></div>
      {organicError ? <section className="notice organicNotice"><h2>{metaAuthExpired(organicError)?'Meta-yhteys on uusittava':'Orgaanisen Metan yhteys'}</h2><p>{metaAuthExpired(organicError)?'Tallennettu Meta-tunniste on vanhentunut. Dataa ei näytetä vanhentuneena tai nollina.':'Orgaanista Meta-dataa ei juuri nyt saada.'}</p>{!metaAuthExpired(organicError)&&<small>{organicError}</small>}</section> : organic && <>
        <div className="organicGrid">
          <article className="channel">
            <div className="channelTitle"><div><span>FACEBOOK</span><h3>{organic.facebook.name}</h3></div><strong>{nf.format(organic.facebook.followers)} <small>seuraajaa</small></strong></div>
            <div className="miniCards">{[
              ['Näyttökerrat',organic.facebook.total.impressions],['Julkaisujen tavoittavuus yht.',organic.facebook.total.reach],
              ['Sitoutumiset',organic.facebook.total.engagements],['Linkki-/julkaisuklikit',organic.facebook.total.clicks]
            ].map(([l,v])=><div key={l}><span>{l}</span><b>{nf.format(Number(v))}</b></div>)}</div>
            <div className="channelAnalysis"><b>Tiivis analyysi</b><p>{organicAnalysis('Facebook', organic.facebook.total, organic.facebook.posts)}</p></div><h4>Parhaiten sitouttaneet julkaisut</h4>
            <table><tbody>{organic.facebook.posts.slice(0,5).map(r=><tr key={r.id}><td>{r.permalink?<a href={r.permalink} target="_blank">{r.text.slice(0,75)}{r.text.length>75?'…':''}</a>:r.text.slice(0,75)}</td><td>{nf.format(r.engagements)} sit.</td><td>{nf.format(r.reach)} tavoitettu</td></tr>)}</tbody></table>
          </article>
          <article className="channel">
            <div className="channelTitle"><div><span>INSTAGRAM</span><h3>@{organic.instagram?.username || '—'}</h3></div><strong>{nf.format(organic.instagram?.followers||0)} <small>seuraajaa</small></strong></div>
            <div className="miniCards">{[
              ['Näyttökerrat',organic.instagram?.total.impressions||0],['Julkaisujen tavoittavuus yht.',organic.instagram?.total.reach||0],
              ['Sitoutumiset',organic.instagram?.total.engagements||0],['Tallennukset',organic.instagram?.total.saved||0]
            ].map(([l,v])=><div key={l}><span>{l}</span><b>{nf.format(Number(v))}</b></div>)}</div>
            <div className="channelAnalysis"><b>Tiivis analyysi</b><p>{organicAnalysis('Instagram', organic.instagram?.total||{}, organic.instagram?.media||[])}</p></div><h4>Parhaiten sitouttaneet julkaisut</h4>
            <table><tbody>{(organic.instagram?.media||[]).slice(0,5).map(r=><tr key={r.id}><td>{r.permalink?<a href={r.permalink} target="_blank">{r.text.slice(0,75)}{r.text.length>75?'…':''}</a>:r.text.slice(0,75)}</td><td>{nf.format(r.engagements)} sit.</td><td>{nf.format(r.reach)} tavoitettu</td></tr>)}</tbody></table>
          </article>
        </div>
      </>}
    </section>
    <section className="meta">
      <div className="metaHead"><div><span>META ADS</span><h2>Golfpassi Oy</h2><p>Maksetun somemainonnan tulokset samalta ajanjaksolta.</p></div></div>
      {metaError ? <section className="notice"><h2>{metaAuthExpired(metaError)?'Meta Ads -yhteys on uusittava':'Meta-yhteys'}</h2><p>{metaAuthExpired(metaError)?'Tallennettu Meta-tunniste on vanhentunut. Raportti säilyttää muun analytiikan toiminnassa eikä esitä virheellisiä nollalukuja.':'Meta Ads -dataa ei juuri nyt saada.'}</p>{!metaAuthExpired(metaError)&&<small>{metaError}</small>}</section> : meta && <>
        <section className="cards metaCards">{[
          ['Kulut', Number(meta.total?.spend||0).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})],
          ['Näyttökerrat', nf.format(Number(meta.total?.impressions||0))],
          ['Tavoittavuus', nf.format(Number(meta.total?.reach||0))],
          ['Klikkaukset', nf.format(Number(meta.total?.clicks||0))],
          ['CTR', Number(meta.total?.ctr||0).toLocaleString('fi-FI',{maximumFractionDigits:2})+' %'],
          ['CPC', Number(meta.total?.cpc||0).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})],
          ['CPM', Number(meta.total?.cpm||0).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})],
        ].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
        <section className="analysis metaAnalysis"><b>Tiivis analyysi</b><p>{metaAnalysis}</p></section><section className="metaTable"><h2>Kampanjat</h2><table><thead><tr><th>Kampanja</th><th>Kulut</th><th>Näytöt</th><th>Tavoittavuus</th><th>Klikit</th><th>CTR</th><th>CPC</th></tr></thead><tbody>{meta.campaigns.map((r,i)=><tr key={i}><td>{r.campaign_name||'—'}</td><td>{Number(r.spend||0).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})}</td><td>{nf.format(Number(r.impressions||0))}</td><td>{nf.format(Number(r.reach||0))}</td><td>{nf.format(Number(r.clicks||0))}</td><td>{Number(r.ctr||0).toFixed(2)} %</td><td>{Number(r.cpc||0).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})}</td></tr>)}</tbody></table></section>
      </>}
    </section>
    <style>{`
      :global(body){margin:0;background:#f5f8fa;color:#263b4b;font-family:Inter,system-ui,sans-serif}.ga{min-height:100vh}.ga header{height:72px;background:#fff;border-bottom:1px solid #dce5eb;display:flex;align-items:center;justify-content:space-between;padding:0 max(24px,calc((100% - 1400px)/2));color:#003c70}.ga header a{color:#003c70;text-decoration:none;font-weight:750}.title{max-width:1400px;margin:42px auto 22px;padding:0 24px;display:flex;justify-content:space-between;align-items:end;gap:20px}.title span{color:#00aaff;font-size:12px;font-weight:900;letter-spacing:.12em}.title h1{font:700 54px/1 Georgia,serif;color:#003c70;margin:6px 0}.title p{margin:0;color:#6d7e8b}.title nav{display:flex;gap:6px}.title nav a{padding:9px 12px;border:1px solid #dce5eb;border-radius:8px;background:#fff;color:#003c70;text-decoration:none;font-weight:800}.title nav a.on{background:#003c70;color:#fff}.cards{max-width:1400px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.cards article,.grid article,.notice{background:#fff;border:1px solid #dce5eb;border-radius:14px;box-shadow:0 8px 25px rgba(0,60,112,.055)}.cards article{padding:18px}.cards span{display:block;color:#6d7e8b;font-size:12px;font-weight:800}.cards strong{display:block;margin-top:8px;color:#003c70;font-size:27px}.analysis{max-width:1352px;margin:14px auto 18px;padding:16px 18px;background:#eef7fc;border-left:4px solid #00aaff;border-radius:10px}.analysis b,.channelAnalysis b{color:#003c70;font-size:12px;text-transform:uppercase;letter-spacing:.06em}.analysis p,.channelAnalysis p{margin:6px 0 0;line-height:1.5;font-size:14px}.channelAnalysis{background:#f5f8fa;border-radius:10px;padding:12px 14px;margin:0 0 18px}.metaAnalysis{max-width:none;margin:14px 0 18px}.grid{max-width:1400px;margin:18px auto 60px;padding:0 24px;display:grid;grid-template-columns:1fr 1.3fr;gap:18px}.grid article{padding:20px;overflow:hidden}.grid h2,.notice h2{margin:0 0 14px;color:#003c70}table{width:100%;border-collapse:collapse;font-size:13px}td{padding:11px 6px;border-top:1px solid #e7edf1}td:nth-child(n+2){text-align:right;color:#6d7e8b}.organic{max-width:1400px;margin:0 auto 60px;padding:0 24px}.organicGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.channel{background:#fff;border:1px solid #dce5eb;border-radius:14px;padding:20px;overflow:hidden}.channelTitle{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.channelTitle span{color:#00aaff;font-size:11px;font-weight:900;letter-spacing:.12em}.channelTitle h3{margin:4px 0 16px;color:#003c70;font-size:22px}.channelTitle>strong{color:#003c70;font-size:22px;white-space:nowrap}.channelTitle small{font-size:11px;color:#6d7e8b}.miniCards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}.miniCards div{background:#f5f8fa;border-radius:10px;padding:12px}.miniCards span{display:block;color:#6d7e8b;font-size:10px;font-weight:800;min-height:25px}.miniCards b{display:block;color:#003c70;font-size:20px;margin-top:4px}.channel h4{color:#003c70;margin:4px 0 8px}.channel a{color:#263b4b;text-decoration:none}.channel a:hover{text-decoration:underline}.organicNotice{margin:0;max-width:none}.meta{max-width:1400px;margin:0 auto 60px;padding:0 24px}.metaHead{margin:10px 0 18px}.metaHead span{color:#00aaff;font-size:12px;font-weight:900;letter-spacing:.12em}.metaHead h2{font:700 38px/1 Georgia,serif;color:#003c70;margin:6px 0}.metaHead p{color:#6d7e8b}.metaCards{padding:0;grid-template-columns:repeat(7,1fr)}.metaTable{margin-top:18px;background:#fff;border:1px solid #dce5eb;border-radius:14px;padding:20px;overflow:auto}.metaTable h2{color:#003c70}.metaTable th{text-align:left;padding:10px 6px;color:#6d7e8b;font-size:12px}.metaTable th:nth-child(n+2){text-align:right}.notice{max-width:1352px;margin:0 auto 60px;padding:28px}.notice p{max-width:800px;line-height:1.6}.notice small{color:#6d7e8b}@media(max-width:900px){.organicGrid{grid-template-columns:1fr}.miniCards{grid-template-columns:repeat(2,1fr)}.metaCards{grid-template-columns:repeat(2,1fr)}.cards{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.title{align-items:flex-start;flex-direction:column}.title nav{flex-wrap:wrap}}`}</style>
  </main>
}
