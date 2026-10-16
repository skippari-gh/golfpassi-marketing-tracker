# Markkinatutka: turvallinen GSC-käyttöönotto (kehityshaara)

Tila 2026-10-16. Tämä tiedosto ei sisällä tunnuksia eikä tee tuotantomuutoksia.

## Havaitut esteet

1. `jani.kinnunen@golfpassi.fi` ei ole nykyisen Supabase-projektin `auth.users`-taulussa (tarkistettu lukukyselyllä). MARKKINATUTKA_ALLOWED_EMAILS yksin ei perusta Auth-käyttäjää.
2. Supabase Authin sähköpostivahvistus ja hyväksytyt Redirect URLs pitää varmistaa Auth-hallinnasta; tieto ei selviä pelkästä projektin tietokannasta.
3. Esikatselulla on `GSC_SITE_URL=https://golfpassi.fi/` ja haarakohtainen allowlist. Palvelutilin GA4_* tunnukset on määritelty Vercelissä vain production-ympäristöön, joten oikea GSC-nouto esikatselussa palauttaa 503 kunnes erilliset testitunnukset on järjestetty.
4. Kehityksen esikatselu käyttää vielä tuotantoprojektin NEXT_PUBLIC_SUPABASE_URL- ja ANON_KEY-arvoja. Kirjautumisen luominen siihen vaikuttaa production Authiin. Luo ensisijaisesti erillinen Supabase Auth -testiprojekti tai pyydä omistajan hyväksyntä tuotantoprojektin Auth-käyttäjän lisäämiseen. Älä laajenna anonyymejä oikeuksia.

## Turvallinen toteutusjärjestys

1. Valitse erillinen testiautentikointi (suositeltu) tai hyväksy nimenomaisesti yksi uusi käyttäjä nykyiseen Supabase Authiin.
2. Lisää kutsuttu ja vahvistettu käyttäjä Supabase Authissa turvallisesti; älä avaa yleistä rekisteröitymistä. Nykyinen signInWithOtp({shouldCreateUser:false}) ei luo tiliä.
3. Aseta Supabase Auth > URL Configuration -sivulle pysyvä kehityshaaran HTTPS-paluuosoite (ei sattumanvaraista deploy-kohtaista URL-osoitetta) polulla /markkinatutka/seo.
4. Varmista Supabase Email OTP ja sähköpostipalvelun toimitus toiminnassa. Älä lähetä kertakirjautumislinkkiä keskusteluun.
5. Määritä Vercelin esikatseluun erillinen vain lukuoikeudellinen GSC-palvelutili (tai erikseen hyväksytty lyhytaikainen tunnistus), joka on Search Consolen rajoitettu käyttäjä. Älä kopioi tuotannon pitkän aikavälin avaimia esikatseluun automaattisesti.
6. Testaa: anonyymi GET /api/markkinatutka/seo -> 401; väärän Auth-käyttäjän token -> 401; sallittu vahvistettu käyttäjä -> 200; viallinen/puuttuva Google-tunnus -> 502/503 ilman salaisuuksien paljastumista; no-store; tietojen oikeellisuus verrattuna Search Consolen samaan 28 päivän ajanjaksoon.
7. Testaa ettei Supabase RLS/admin-tietoja vuoda muihin preview-reitteihin. Rajapinta ei saa julkaista raakadataa ilman todennusta.
8. Vasta tämän jälkeen pyydä erillinen hyväksyntä yhdistämiselle ja tuotantoon julkaisulle.

## Tämänhetkiset suojaukset
- `lib/marketing-intelligence-auth.ts` tekee palvelinpuolen Supabase getUser -tarkistuksen ja vertaa vahvistetun käyttäjän sähköpostia erikseen asetettuun sallittujen listaan.
- `app/api/markkinatutka/seo/route.ts` käyttää vain tätä suojausta ja palauttaa tulokset no-store-vastauksena. Muut olemassa olevat sovelluksen reitit eivät automaattisesti saa samaa suojausta.
- `app/markkinatutka/seo/page.tsx` näyttää edelleen erillistä selvästi merkittyä esimerkkidataa.

## Varmistamattomat asiat
Supabase-Authin URL-konfiguraatiota, OTP-toimitusta, todellista kirjautumista ja Googlen vastausta ei ole voitu vielä vahvistaa. Esikatselun ulkoisen URL:n HTTP-testi ei tässä ympäristössä onnistunut.
