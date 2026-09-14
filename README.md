# Golfpassi Marketing Tracker — MVP

Kevyt web-app, jonka ydin on: **nosta esiin matkat, joita ei ole hetkeen markkinoitu**.

## Stack
- Next.js / React
- Supabase / PostgreSQL
- Vercel

## Ensimmäiset näkymät
- Nosta seuraavaksi
- Matkat
- Kalenteri
- Matkan oma sivu
- Lisää markkinointimerkintä

## Käynnistys
```bash
npm install
npm run dev
```

Luo Supabase-projekti ja aja `supabase/schema.sql`.
Lisää `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Markkinointipyyntöjen sähköposti-ilmoitukset

Kun uusi markkinointipyyntö tallennetaan, sovellus lähettää ilmoituksen osoitteeseen
`jani.kinnunen@golfpassi.fi`.

Sähköpostin lähetys käyttää Resend APIa. Lisää tuotantoympäristöön:

```env
RESEND_API_KEY=...
MARKETING_NOTIFICATION_FROM="Golfpassi Marketing Tracker <markkinointi@golfpassi.fi>"
```

`MARKETING_NOTIFICATION_FROM`-osoitteen domainin pitää olla vahvistettu Resendissä.
Jos sähköpostipalvelu ei ole konfiguroitu tai lähetys epäonnistuu, markkinointipyyntö
säilyy silti Supabasessa ja virhe kirjataan palvelinlokiin.

## Matkojen automaattinen synkronointi

Vercel ajaa `/api/cron/sync-trips`-reitin päivittäin klo 05.00 UTC
(Suomessa klo 07.00 talviaikaan ja klo 08.00 kesäaikaan). Ajo hakee
Golfpassin peli- ja kurssimatkat ja päivittää ne Supabaseen.

Tuotantoympäristössä tarvitaan lisäksi seuraavat salaisuudet:

```env
CRON_SECRET=...
SYNC_SECRET=...
SUPABASE_SECRET_KEY=...
```

Vercel lähettää cron-kutsussa `CRON_SECRET`-arvon Authorization-headerissa.
Cron-reitti käyttää `SYNC_SECRET`-arvoa varsinaisen tallennusreitin kutsumiseen.
