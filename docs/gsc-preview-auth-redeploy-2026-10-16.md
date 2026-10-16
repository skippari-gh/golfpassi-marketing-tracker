# Markkinatutkan käyttäjärajaus: esikatselun uudelleenrakennus

16.10.2026: `MARKKINATUTKA_ALLOWED_EMAILS` päivitettiin haarakohtaisessa Vercel-preview-ympäristössä hyväksytylle testitilille vasta edellisen esikatselujulkaisun rakentamisen jälkeen. Tämä commit käynnistää uuden kehityshaaran rakentamisen päivitetyillä asetuksilla.

Testijärjestys: 1) kirjautuminen esikatselusivulla, 2) palvelimen oikeustarkistus `GET /api/markkinatutka/seo` (ilman tokenia 401), 3) valtuutetun käyttäjän hakupyyntö, jonka odotettu vaste ilman Google-tunnuksia on 503, 4) vasta erillisen testitunnistuksen jälkeen oikean datan nouto. Salaisuuksia ei tallenneta GitHubiin. Tuotannon koodia tai muuttujia ei muuteta.
