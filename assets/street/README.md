# Katuautopaketti v0.16.0

| Pelitunniste | Käyttäjän toimittama malli | Hinta / bossivoitot |
|---|---|---|
| rotary | 1999 Mazdaspeed RX-7 FD3S A-Spec / GT Concept | 72 000 € / 4, korvaa vanhan RX-7:n |
| datsun | Nissan Fairlady Z / Datsun 280Z | 20 000 € / 0 |
| tiburon | Hyundai Tiburon V6 Coupe 2003 | 22 000 € / 0 |
| road_runner | 1971 Plymouth Road Runner / Gran Turismo 2 | 32 000 € / 1 |
| supra | 1998 Toyota Supra | 68 000 € / 3 |
| m5_e39 | BMW M5 E39 / GT2 PSX | 82 000 € / 4 |
| resonanso | LB-WORKS Ferrari F40 (korvaa punaisen A40:n) | 145 000 € / 7 |
| carrera_gt | Porsche Carrera GT | 195 000 € / 9 |

`rotary` käyttää samaa tallennuspaikkaa kuin vanha RX-7. Omistus, moottoripaketit ja autokohtainen kustomointi eivät muutu; ajosuorituskyvyn vanha lähtötaso säilyy. Muut seitsemän tunnistetta ovat uusia kauppa-autoja. Niiden ajosuorituskyky on merkitty pelilliseksi arvioksi; fiktiiviselle Resonansolle ei oleteta todellisia tuotantoauton tietoja. Muunnos ei korvaa Vicin Supra- tai muiden Blacklist-autojen malleja.

## Lähteet ja muunnos

`tools/street-imports.json` luettelee alkuperäiset ZIP-polut, tiedostokoot, kohdepituudet ja purettujen mallien polut. Alkuperäisiä Downloads-kansion tiedostoja ei muuteta. Puretut työlähteet ovat `assets/street-source/`-hakemistossa. RX-7-arkiston päällekkäiset tekstuurinimet säilytetään erillisinä (`__2`…`__5`); ne ovat eri kuvia, eivät poistettavia kopioita.

```text
python tools/prepare-street-sources.py
node tools/build-street-cars.mjs
python tools/pack-street-textures.py
node tools/pack-psx.cjs
```

Tarvitaan Node ja projektin paikallinen Three.js sekä Python, NumPy ja Pillow. COLLADA-luku käyttää aiemman `blacklist-loaders.mjs`:n XML-sovitinta ja tämän koneen Codex-ajoympäristön xml-js-kirjastoa. `street-loaders.mjs` lukee staattisen GLB:n paikallisesti ja tallettaa upotetut kuvat paikallisiksi lähteiksi. Arkistoista puretaan vain tunnettuja malli- ja kuvamuotoja; niiden mukana tulleita ohjelmia tai skriptejä ei suoriteta. Peli ei tarvitse muunnostyökaluja käynnissä.

`street-model-rules.mjs` määrittelee materiaalien ja lähdetekstuurien vastaavuudet, pyöräobjektit ja keulan suunnan. Road Runnerin neljä rengasta erotellaan yhtenäisistä geometrisista osista sen aluskoriprimitiviin integroitujen renkaiden perusteella. M5:n etupyörät suoristetaan niiden kapean pääakselin avulla. Datsunin ja Carrera GT:n ylisuuret valokeila-apuverkot eivät vaikuta auton mittakaavaan eivätkä kuulu pelimalliin.

Geometria kevennetään paikkaruudukolla UV-saumat säilyttäen. Supran ja Tiburonin sisäosat kevennetään ulkokoria voimakkaammin, jotta korin muodot pysyvät siisteinä. Road Runnerin GT2-kärkipistevärit säilyvät erillisenä väriattribuuttina. Sijainnit ja UV:t pakataan 16-bittisinä, normaalit 8-bittisinä ja indeksointi 16-bittisenä. Värit ovat 8-bittisiä. Tekstuurit ovat enintään 256 px:n ja 96 värin PNG-kuvia; runtime käyttää lähimmän pikselin suodatusta.

## Valmiit tiedostot

- `cars.js`: kahdeksan mallia, ladataan perusautojen ja Blacklist-paketin jälkeen.
- `textures/`: 61 yksilöllistä diffuusitekstuuria, yhteensä 600 932 tavua.
- `import-audit.json`: mallikohtaiset kolmiot, pyörät, mittakaava ja lähdetiedot.
- `texture-jobs.json`: jokaisen pelitekstuurin lähdekuva.
- `/tools/street-preview.html`: visuaalinen tarkistus, ei kirjoita pelaajan tallennukseen.

Uuden paketin yhteiskoko on 2 572 979 tavua tekstuureineen. Kolmioita on 71 655; muunnokseen otetussa lähdegeometriassa 377 145. Alkuperäiset kahdeksan ZIPiä ovat yhteensä 39 429 436 tavua ja sisältävät myös sisäisiä pakkauksia ja materiaaleja, joita peli ei lataa. Erittäin kevyet GT2-mallit säilytetään lähes alkuperäisellä kolmiomäärällä.

`tests/street-cars.test.cjs` tarkistaa geometrian, pyörät, värit, tekstuurit, hintarajat ja vanhan RX-7-omistuksen säilymisen. Yleiset PSX-testit tarkistavat koko 38 mallin teknisen aineiston; viisi aiemmin poistettua autoa sekä piilotettu Redfire jäävät pois pelaajan valikoimasta. Kaikki kustomointiosat tarkistetaan myös uusilla autoilla.

## F40-vaihto v0.22.0

Punainen A40 on korvattu käyttäjän toimittamalla **LB-WORKS Ferrari F40 - FREE** -mallilla. Sama `resonanso`-tunniste, omistus, viritykset, 145 000 € hinta ja 7 bossin kauppavaatimus säilyvät. Aiempi pelillinen suorituskyky säilyy. Geometria keveni 704 497 kolmiosta 13 246 kolmioon (98,1 %), 13 diffuusitekstuuria enintään 256 px / 96 väriä. Keula on käännetty pelin +Z-suuntaan; neljän pyörän renkaat, jarrut ja vanteet erotellaan samoihin liikkuviin pyöräryhmiin.

Tekijä: **bohmerang** (https://sketchfab.com/bohmerang). Lähde: https://sketchfab.com/3d-models/lb-works-ferrari-f40-free-44e64fd0ed6d45188512e8ab08c89272 . Lisenssi: **CC BY-NC-SA 4.0**; alkuperäinen tekijä- ja lisenssiteksti on `lb-f40-LICENSE.txt` ja kuuluu offlinepakettiin. Muutokset: suunta, mittakaava, UV:t säilyttävä geometria- ja tekstuurikevennys sekä pelin pakattu esitysmuoto.

Yksittäisen mallin päivitys: `node tools/build-street-cars.mjs --catalog=tools/lb-f40-import.json --merge`. Muiden autojen pakattu data säilyy tällöin ennallaan.
