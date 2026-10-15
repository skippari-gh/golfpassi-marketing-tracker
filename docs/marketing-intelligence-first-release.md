# Golfpassi Marketing Intelligence — ensimmäinen turvallinen toteutus

## Toteutettu tällä haaralla
- Itsenäinen /markkinatutka-esikatselu, joka sisältää vain selkeästi merkittyä esimerkkidataa.
- Ei uusia API-kutsuja, tietokantamuutoksia, ajastuksia tai salaisuuksia.
- Ei muutoksia etusivuun eikä automaattisia julkaisuja.

## Todettu nykyisestä koodista
- lib/ga4.ts hakee GA4 Data API -raportteja palvelutilin avulla.
- lib/meta.ts hakee Meta-mainostilin insight-tietoja ja orgaanista dataa.
- app/analytics/page.tsx käyttää näitä molempia ja näyttää virheet, jos kutsu epäonnistuu.
- Vercelissä on näihin liittyvien ympäristömuuttujien nimet; toimivia tuotantokutsuja ei ole tässä muutoksessa testattu.
- Google Ads - ja Search Console -integraatioita ei ole vielä varmennettu.

## Seuraava kehitys (ei toteutettu vielä)
1. Vahvista sisäisten sivujen, API-reittien, Supabase RLS:n ja liitetiedostojen pääsynvalvonta. Vasta sen jälkeen näytä oikeaa dataa.
2. Lue Search Console API:sta hakulause, laskeutumissivu, klikkaukset, näyttökerrat, CTR ja keskimääräinen sijoitus. Käytä vain vähimmäislukuoikeuksia; valtuuta nimenomainen Golfpassin Search Console -ominaisuus.
3. Testaa GA4- ja Meta-kutsut turvallisesti ja kirjaa viimeisin onnistunut päivitys. Älä paljasta tunnuksia tai virheilmoitusten sisältämiä salaisuuksia.
4. Vahvista Google Ads -tilin omistajuus ja pääsy, älä oleta integraatiota olemassa olevaksi.
5. Kilpailijoiden mainokset ja julkiset hintahavainnot vain sallituista lähteistä. Merkitse lähde, havaintoaika ja epävarmuus.
6. GEO: seuraa toistettavia kysymystestejä ja viitteitä; älä esitä niitä kattavana AI-hakusijoituksena.
7. Oppiminen: suosituksen tunniste, hyväksyntä, toteutusaika ja vertailujakson tulos. Vältä perusteettomia kausaliteettiväitteitä.
8. Testit, tietoturvakatselmointi ja erillinen hyväksyntä ennen tuotantojulkaisua.

## Vertailtavat toimijat — ehdotukset
Golf Plaisir, Golf Tailors, OnGolf ja EnjoyTravel & Tours. Golfpassi on oma vertailupiste. Käyttäjä vahvistaa lopullisen joukon ennen seurantaa.

## Suojausperiaate
Esikatselu sisältää vain yleisiä ja keksittyjä esimerkkejä. Todellisen yritysdatan näyttäminen edellyttää palvelinpuolen autentikointia ja valtuutusta. Älä luota pelkkään käyttöliittymärajaukseen.
