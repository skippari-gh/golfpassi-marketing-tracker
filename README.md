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
