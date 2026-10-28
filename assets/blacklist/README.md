# Blacklist-autot v0.14.0

| Sijoitus | Bossi | Pink slip -auto |
|---|---|---|
| 15 | Sonny | Volkswagen Golf GTI |
| 14 | Taz | Lexus IS 300 |
| 13 | Vic | Toyota Supra |
| 12 | Izzy | Mazda RX-8 |
| 11 | Big Lou | Mitsubishi Eclipse GT |
| 10 | Baron | Porsche Cayman S |
| 9 | Earl | Mitsubishi Lancer Evolution VIII |
| 8 | Jewels | Ford Mustang GT |
| 7 | Kaze | Mercedes-Benz CLK 500 |
| 6 | Ming | Lamborghini Gallardo |
| 5 | Webster | Chevrolet Corvette C6 |
| 4 | JV | Dodge Viper SRT-10 |
| 1 | Razor | BMW M3 GTR + prologin Mustang-bonus |

Ronnie ja Bull puuttuvat käyttäjän päätöksellä. Autojen lähteet ovat käyttäjän toimittamat ZIPit; niiden omat teippaukset säilyvät. Mallien mukana tulleita ohjelmia tai ohjeita ei suoriteta.

## Muunnos

`tools/blacklist-imports.json` luettelee alkuperäiset arkistot, puretut mallipolut ja tavoitepituudet. Työlähteet ovat `assets/blacklist-source/`-hakemistossa. Tazin COLLADA-malli on purettu myös sen sisemmästä `source/model.zip`-paketista. Muut lähteet ovat FBX-malleja.

Geometria rakennetaan `node tools/build-blacklist-cars.mjs` ja tekstuurit `python tools/pack-blacklist-textures.py`. Muunnos tarvitsee paikallisen Three.js:n, `xml-js`-kirjaston XML-lukemiseen sekä Pythonin, NumPyn ja Pillow'n. `blacklist-loaders.mjs` käyttää tämän koneen Codex-ajoympäristön xml-js-asennusta. Pelin suorittaminen ei tarvitse näitä muunnostyökaluja.

Geometriaa kevennetään tilaruudukkoon perustuvalla kärkipisteiden yhdistämisellä UV-saumat säilyttäen. Jokaisessa autossa on neljä erillistä pyöräryhmää. Koordinaatit ja UV:t tallennetaan 16-bittisinä, normaalit 8-bittisinä ja kolmioindeksit 16-bittisinä. `cars.js` purkaa koordinaatit piirtoa varten. Diffuusitekstuurit ovat enintään 256 px:n ja 96 värin PNG-kuvia. Peli käyttää lähimmän pikselin suodatusta.

- `cars.js`: 14 auton valmis pelipaketti, korvaa samannimiset vanhat bossimallit.
- `textures/`: 65 tekstuuria, yhteensä 523 781 tavua.
- `import-audit.json`: mallikohtaiset lähteet, kolmiomäärät, mittakaavat ja pyörien sijainnit.
- `texture-jobs.json`: lähdekuvien ja lopullisten tekstuurien vastaavuudet.
- `race-audit.json`: 120 sekunnin AI-koeajot kaikille 13 bossille; ei kokonaisen kilpailun läpäisytodistus.
- `/tools/blacklist-preview.html`: kaikkien toimitettujen autojen esikatselu ilman tallennuksen muutoksia.

Autopaketti tekstuureineen: 5 742 369 tavua. Kolmioita yhteensä 178 232 (lähteissä 780 683). Lähde-ZIPit yhteensä 155 096 101 tavua; tämä vertailu sisältää myös lähteiden materiaaleja ja työversioita, joita peli ei lataa.

`src/career.js` määrittelee bossit, etenemisen ja palkinnot. `tests/blacklist.test.cjs` tarkistaa järjestyksen, tallennussiirron, kaikki pink slip -voitot, uusintojen palkinnot, varsinaisen tuloskäsittelijän, reittien jatkuvuuden sekä mallien geometrian ja tekstuurit.
