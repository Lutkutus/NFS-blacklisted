# Rockport — korjattu PSX-karttapaketti

## Poliisit ja kilpa-AI v0.21.0

`src/pursuit-ai.js` käyttää samaa navigointiverkkoa ja tien törmäyspintoja kuin pelaaja. Poliisin reitin lyhentäminen edellyttää koko auton tukemista ja seinätöntä käytävää; se ei muuta karttaa tai tallenna uutta navigointiverkkoa. Näköyhteys tarkistetaan todellisista kolmioista. `node tools/audit-pursuit.cjs` tarkistaa kolmen tallialueen poliisilähdön ja kohteen saavuttamisen. `node tools/audit-ai-pace.cjs` vertaa suoran vauhtia aiempaan ohjaussääntöön. Mittausraportit ovat `pursuit-drive-audit.json` ja `ai-pace-audit.json`. AI-autot käyttävät yhteistä `vehicle-physics.js`-simulaatiota.

## Lisätapahtumat v0.20.0

`routes.json` ja `routes-grid.json` sisältävät 12 tapahtumaa. Ensimmäisten neljän tunnisteet, geometria, järjestys ja indeksit säilyvät, joten bossireitit ja vanhat ennätysavaimet eivät vaihdu. Neljä paluusuunnan reittiä ja neljä lyhyempää osuutta lisätään perään työkalulla `tools/expand-rockport-races.cjs`; se käyttää olemassa olevia tasoitettuja ajolinjoja ja tarkistaa lähtöruudukon kartan todellisista tienpinnoista. `smooth-rockport-routes.cjs` rakentaa ensin neljä perusreittiä ja sitten lisätapahtumat, joten uudelleenrakennus ei kasvata tapahtumamäärää toistuvasti. `additional-races-drive-audit.json` sisältää yhteisellä fysiikalla ajetut 150 m:n AI-aloitustestit. Alueiden geometria ei muutu.

## Kisaportit v0.19.0

`routes.json` säilyttää aiemmat pisteet ja tien mukaan validoidut reitit. Vain checkpoint-etäisyydet muutetaan: noin 700 m:n osuudet ja portit lähistön suorilla. `RockportNavigation.checkpoints` muodostaa saman säännön myös bossiosuuksille ja reittien uudelleenrakennukselle. `measureGate` mittaa tien leveyden ja kallistuksen; `advance` hyväksyy oikeansuuntaisen, ruutujen välin huomioivan portin ylityksen ilman reittikäytävän seuraamista. Pelaaja ja AI käyttävät samaa ylityssääntöä. AI:n ohjausta palveleva paikallinen `project` säilyy erillisenä. `race-gates-audit.json` sisältää kaikki 17 layoutia ja niiden leveydet. Kartan geometriaa tai törmäyksiä ei muuteta.

## Minikartta ja siirtymispaikat v0.18.1

Minikartan tiepinnat ja kaikki peittomerkit käyttävät samaa +Z-alas-projektiota kuin kaupunkikartta. Auton nuolen kierto on `-yaw`, ja sen kärki osoittaa nollakulmalla alas. Pikasiirtymisen kohteet ovat M-kartan olemassa olevat kohteet. `BlacklineWorldMap.travelPose` varmistaa kohteen oikean korkeustason, renkaiden tuen ja todellisen auton törmäyslaatikon ennen uuden maailman käyttöönottoa. Aluegeometriaa ei muuteta tässä päivityksessä.

## Camden-lisäys v0.18.0

`cells/world_camden_*.gltf`, vastaavat `.bin`- ja `.collision.bin`-tiedostot sekä `textures/world_*.png` täydentävät alkuperäistä karttaa. Alkuperäisiä `cell_*`-tiedostoja ei korvata. `manifest.json` viittaa molempiin; `rockport-psx.glb` pysyy alkuperäisen 13 osan yhdistelmänä eikä sisällä lisäystä. Pelin käyttämä versio on alueittain ladattava manifesti.

Lähde: käyttäjän toimittamat `put_me_together.zip.001` ja `.002`, Mauleous Gamingin [NFS World x Assetto Corsa](https://www.patreon.com/posts/nfs-world-x-is-140985234). Tuodaan Camdenin näkyvät Roads/Terrain/Buildings/Props/Trees-kerrokset. Palmont, panorama ja paketin asetusten piilottamat tiheät fysiikkakopiot jätetään pois. Puiden yli 45 m korkuiset ryhmät jätetään pois aiempien jättikasvillisuuskorjausten säilyttämiseksi.

KN5:n paikalliset muunnokset puretaan ennen yhteisten teiden kohdistusta. Siirto on `[-482.956787, 0.000183, -1504.380981]`; skaala ja kierto säilyvät. Olemassa olevien pintojen päällekkäisyydet poistetaan keskipistevertailulla ja geometrisilla pintatesteillä. Koristegeometria yksinkertaistetaan materiaaliryhmittäin ennen 256 m:n aluejakoa, jotta eri palojen rajat perustuvat samaan lopputulokseen. Koordinaatit ovat 16-bittisiä ja normaalit 8-bittisiä. Enimmäiskvantisointivirhe on noin 4,5 mm. Opaakin DDS:n alpha voi olla kiiltokanava: vain KN5:n materiaalin ilmoittama läpinäkyvyys siirretään PNG:hen, poikkeuksena tunnistetut puu- ja aitaleikkaukset.

`extension-report.json` mittaa lisäyksen lopulliset 68,1 Mt, 162 palaa ja 850 489 kolmiota. `extension-navigation-audit.json` tarkistaa uudet tieyhteydet nykyisillä törmäyksillä. Navigointi täydentää myös Camdenin aiemmista solmuista puuttuneet olemassa olevat ajopinnat; vanhoja solmuja ei numeroida uudelleen. `extension-race-audit.json` vertaa vanhojen sprinttien täyden auton tuettuja asentoja ennen ja jälkeen. Kallistettujen teiden rengasviitteet seuraavat tien paikallista kaltevuutta.

Lisäyksen uudelleenrakennus tarvitsee NumPyn/Pillow'n lisäksi scipy- ja fast-simplification-kirjastot. Ne voidaan asentaa vain työkalujen käyttöön komennolla `python -m pip install --target tmp/model-tools scipy fast-simplification`. Lähdepaketit säilyvät Downloads-kansiossa. Suorita alkuperäisen kartan jälkeen:

```text
python tools/inspect-nfs-world.py --extract
python tools/import-camden-extension.py
python tools/restore-camden-textures.py
python tools/finalize-camden-extension.py
python tools/extend-rockport-navigation.py
node tools/validate-extension-navigation.cjs
node tools/build-rockport-map.cjs
python tools/render-rockport-map.py
node tools/audit-extension-races.cjs
python tools/validate-rockport.py
```

Kohdistusmittaus on `assets/qa/nfs-world-registration.json`:ssä. `tmp/nfs-world/original-manifest.json` ja `original-navigation.json` ovat työkalujen alkuperäisen manifestin ja verkon palautettavat lähtötiedot; säilytä ne lisäyksen toistettavaa rakentamista varten. Suuri väliaikainen sisempi ZIP ja geometriavertailun välimuistit voidaan poistaa, koska ne muodostetaan uudelleen lähdepaketeista. `/tools/rockport-drive-check.html` käyttää nyt samaa ajofysiikkaa ja auton törmäyslaatikkoa kuin varsinainen peli.

## Kaupunkikartta ja tallit v0.17.0

`world-map.json` sisältää oikean tieverkon rajat, tallien sisäänkäynnit ja käyttäjän toimittaman viitekartan vihreiden talokuvakkeiden maamerkkisovituksen. `reference-map.png` on toimitettu kaaviokartta; `world-map-roads.png` on navigointiverkosta muodostettu kevyt karttakerros. Pelaajan paikka piirretään oikeaan tieverkkoon, sillä kaaviokartta ei ole tarkka maailmakoordinaatisto.

Rosewoodin ja Downtownin sisäänkäynnit tarkistetaan 2,2 × 5 m:n auton tienpinnan ja törmäyslaatikon sekä seitsemän metrin lähestymisalueen avulla. `node tools/build-rockport-map.cjs` toistaa sijaintien haun; `tools/render-rockport-map.py` tuottaa PNG:n (Pillow). Gray Pointin tallia ei aktivoida puuttuvaan tieverkkoon. Raakamanifestin historiallinen spawn pysyy työkalujen lähtötietona; peli käyttää vapaan ajon lähtönä käytettävissä olevaa viimeksi vierailtua tallia. Kilpailujen lähdöt säilyvät.

Isossa kartassa himmeät tiet ovat irrallisia karttaosia. Ajoreitit haetaan ainoastaan yhtenäisestä, sallittujen navigointiyhteyksien verkosta ja huomioivat teiden korkeustason. Kartan lisääminen ei korjaa itäisten alueiden puuttuvaa geometriaa tai yhteyksiä.

## Kisojen ajolinjat v0.14.1

`routes-grid.json` on alkuperäinen validoitujen hakuruudukon yhteyksien reitti. `routes.json` sisältää siitä tiepinnan ja rakenteiden rajaamana tasoitetut ajolinjat. `tools/build-rockport-routes.cjs` rakentaa molemmat; pelkän tasoituksen voi toistaa komennolla `node tools/smooth-rockport-routes.cjs`. Korkeus haetaan oikean tason tiepinnasta, joten sillat eivät tasoitu alapuoliselle kadulle. Karttageometriaa tai törmäystiedostoja ei muuteta.

`road-line-audit.json` vertaa mutkittelua ennen ja jälkeen. `unsupportedFootprints` laskee näytepisteet, joissa konservatiivinen 2,2 × 5 metrin kokoisen auton tarkistus ei täysin mahdu merkitylle tiepinnalle tai osuu rakenteeseen; arvo ei ole nolla kaikilla osuuksilla. Tällaiset lähdereitin ahtaat kohdat eivät oikeuta oikaisemaan rakenteiden läpi. AI:n varsinaiset koeajot ovat `assets/blacklist/race-audit.json`:ssä.

Minikartta näyttää täytetyn tiepinnan sekä kilpailun tasoitetun reitin. Harvennettuja kolmioääriviivoja ei enää esitetä kadun muotona. `/tools/race-lines-preview.html` näyttää ennen/jälkeen-vertailun.

Kaikki 13 käyttäjän toimittamaa osaa käyttävät yhteisiä alkuperäisiä maailmankoordinaatteja. Alkuperäiset ZIP-tiedostot Downloads/Rockport-kansiossa ovat koskemattomia.

## Maasto- ja ajopintakorjaus

Lähteissä on varsinaisen kaupungin lisäksi kaukomaiseman yksinkertaistettuja PAN/Panorama-malleja. Kaikkien näyttäminen yhtä aikaa peitti katuja jättimäisillä maastopinoilla. Lähdegeometrian vertailu 50 991 tieverkon pisteeseen löysi 28 päällekkäistä taustamallia: 1 779 pistettä oli kahden metrin sisällä taustapinnasta ja 8 597 sen alapuolella. Mittaus on ennen korjausta, ja pistejoukot voivat olla osittain samoja.

`scene-fixes.json` luettelee poistetut taustakopiot lähdeosan ja objektin nimen mukaan. Varsinaista tieverkkoa, yksityiskohtaista maastoa ja rakennuksia ei skaalattu tai tasoitettu. Muut kaukomaisemat säilyvät ulkoasussa, mutta niiden materiaaleissa on `extras.collision: false`: ne eivät ole ajopintoja tai törmäysseiniä. Vuoristoteiden aidot korkeuserot ja sillan eri tasot säilyvät.

Ajopintojen saumoissa sallitaan 3,5 cm:n koordinaattitoleranssi. Se kattaa aluekohtaisen pakkausvirheen ilman, että autot voisivat ylittää oikeita aukkoja. Alueita ladataan kahdella rinnakkaisella lataajalla ajosuunnan edeltä. Puuttuvan törmäysalueen kohdalla auto odottaa latausta. R-palautus tallentaa vain varsinaisen tien pisteitä.

## Tiedostot ja tarkistukset

- `rockport-psx.glb`: koko korjattu kartta tekstuureineen.
- `manifest.json`, `cells/*.gltf`, `cells/*.bin`: pelin alueittain ladattava versio. Ajantasaiset määrät ovat `report.json`-tiedostossa.
- `textures/*.png`: enintään 256 px, alkuperäiset UV:t ja lähimmän pikselin suodatus.
- `cells/*.collision.bin`: lopullisesta geometriasta muodostetut ajopinnat ja seinät.
- `navigation.json`, `routes.json`: tieverkko ja kisareitit.
- `panorama-audit.json`: päällekkäisten taustojen lähdevertailu ennen korjausta.
- `source-audit.json`: alkuperäisen ja lopullisen geometrian otosvertailu. Tarkoituksella poistetut taustat ja aiemmin poistetut kilpailunuoliseinät jätetään pois otoksesta.
- `driveability-audit.json`: tieverkon yhteyksien tarkistus pelaajan törmäyslaskennalla. Tämä tarkistaa diskreetin verkon; se ei ole lupaus jokaisen maastoneliön ajettavuudesta.

## Uudelleenrakennus

Tarvitaan Python, NumPy, Pillow ja Node. Suorita projektin juuressa järjestyksessä:

```text
python tools/optimize-rockport.py
python tools/remove-rockport-race-barriers.py
python tools/build-rockport-physics.py
node tools/check-rockport-spawn.cjs
python tools/build-rockport-navigation.py
node tools/audit-rockport-driving.cjs --apply
node tools/build-rockport-routes.cjs
python tools/validate-rockport.py
python tools/audit-rockport-source.py
```

`tools/audit-rockport-panorama.py` toistaa lähteiden PAN-pintojen päällekkäisyysmittauksen nykyisen tieverkon pisteillä. `scene-fixes.json` on tarkastettu korjauslista eikä muodostu uudelleen automaattisesti.

## Selaintarkistus

`/tools/rockport-drive-check.html` käyttää pelin varsinaista karttalataajaa, auton mittakaavaa ja törmäyslaskentaa. Valitse kaupunginosa ja aja WASD-näppäimillä. `/tools/rockport-preview.html` on vapaasti kierrettävä geometriaesikatselu. Varsinainen peli on `/`.


## v0.10

Alpha-cutout-muurit, aidat ja kaiteet otetaan mukaan törmäysgeometriaan. wall-collision-audit.json sisältää määrät materiaaleittain sekä kaksi oikeasta kartasta tarkistettua kivimuurikohtaa. tools/check-rockport-walls.py toistaa tarkistuksen.

Kisareitit ovat nyt neljä avointa sprinttiä (4,9–11,0 km), eivät vanhoja kierrosratoja. tools/build-rockport-routes.cjs rakentaa ne ja tarkistaa jokaisen kulkusuunnan uusilla törmäyksillä. sprint-audit.json on tämän version reittitarkistus. driveability-audit.json on v0.9.1:n koko graafin tarkistus ennen uusien aitapintojen palautusta; sitä ei pidä tulkita tämän version kaikkien graafiyhteyksien takuutestiksi. Poliisit tarkistavat törmäykset myös ajon aikana ja etsivät uuden reitin esteen kohdalla.

Valinnainen tools/build-rockport-navigation.py --race tuottaa tiheän suunnittelugraafin race-navigation.json; peli käyttää edelleen kevyempää navigation.json-tiedostoa. Suunnittelugraafi ei tee rikkonaisista itäosan teistä yhtenäistä ajoreittiä.


## v0.13 — aktiivisen pelin ajoneuvofysiikka

Aktiivinen peli käyttää nyt src/vehicle-physics.js-moduulia sekä RockportPhysics.sweepBox-/boxHit-tarkistusta. Korilaatikko seuraa auton suuntaa ja tien kaltevuutta. Pelaaja, kisavastustajat ja poliisit liikkuvat samalla fysiikalla; AI ohjaa syötteitä eikä siirrä autoa reittiviivalle.

Tien reuna tai aidosti puuttuva pinta sallii putoamisen, lataamaton alue pysäyttää. Rampit ja harjat voivat irrottaa auton maasta; alastulo testataan saavutettuun pintaan ilman siltojen tasolle teleporttaamista. Fyysinen alku- ja R-palautus korjaavat reittipisteiden interpoloidun korkeuden kerran varsinaiseen pintaan.

Vanha RockportPhysics.move/blocked säilyy rakennus- ja reittityökalujen yhteensopivuutta varten. Aiemmat sprint-audit.json ja driveability-audit.json eivät siis varmista uuden korilaatikon kaikkia ajolinjoja. Uusi vehicle-physics-audit.json on 120 sekunnin AI-koeajo kunkin sprintin alusta, ei koko kartan kattava takuu. Toisto: node tools/audit-vehicle-physics.cjs. Kartan geometriaa ja tietiedostoja ei muutettu tässä versiossa.


## v0.13.1 — liukuminen ja jalkakäytävät

Aktiivisen ajomallin korilaatikko liukuu seinän tangenttia pitkin osuman jälkeen. Matala, enintään 26 cm:n askel sallitaan ajettavalle yläpinnalle, jos korille jää tilaa. Korkeammat muurit sekä matalat seinät ilman yläpintaa pysyvät kiinteinä. Karttageometria ja vanhojen reittityökalujen move/blocked-funktiot säilyvät ennallaan.

vehicle-physics-audit.json käyttää nyt RX-7:n oikeita korimittoja yleisen oletuslaatikon sijaan; collider-kenttä tallentaa mitat. 120 sekunnin koe ei kata koko karttaa. Toisto: node tools/audit-vehicle-physics.cjs.

## v0.13.2 — pyörien tuki ja pintasaumat

Ajomalli tarkistaa neljä pyöräkontaktia sekä keskipisteen. Puuttuva keskipisteen kolmio ei yksin aiheuta putoamista; tukitaso voidaan laskea muista kontakteista. Kolmioiden kaltevuus palautetaan pintakyselyssä, ja 3,5 cm:n saumavara toimii hakuruudun rajan yli. Kartan kolmioita ei täytetä tai muuteta. Aito reuna voi edelleen irrottaa auton maasta.

wheel-support-audit.json on 39 810 staattisen näytteen tutkimus neljältä sprintiltä viidellä sivuttaislinjalla. 108 näytteessä keskipiste ei löytänyt pintaa mutta pyörät löysivät tuen. 532 näytteessä kumpikaan ei löytänyt pintaa; etenkin sivulinja voi olla oikeasti tien ulkopuolella. Tämä ei ole jokaisen pisteen ajettavuus- tai törmäystesti. Toisto: node tools/audit-wheel-support.cjs.

vehicle-physics-audit.json raportoi myös pisimmän lennon, pudotuksen, osittaisen pyörätuen ja palautuspyynnöt. Nykyiset 120 sekunnin otokset: ei putoamisia eikä palautuspyyntöjä, etenemä noin 1,45–1,99 km. Koko sprinttejä ja karttaa ei ole varmistettu. Hyppyavustuksen lähteet ja toteutuksen rajat: ../../docs/mw-handling-research.md.

## v0.13.4 — jättimäisten maisemakopioiden poisto

scene-fixes.json sisältää nyt myös excludedScenery-listan: 32 jäljellä ollutta puu-, vuori-, saari- ja maastopanoraamaa sekä yhdistettyä TC-maisemaa, ja 274 yli 45 metriä korkeaa XT-koristepuumallia / puuryhmää. Esimerkiksi PAN_Mountains_College_0.004 oli yli kilometrin korkuinen ja PAN_CT_EverGTreesA_01 noin 376 m korkuinen. Nämä ovat lähteisiin leivottuja taustakopioita tai suuria puuseinämiä; koko kaupunkia ei skaalata niiden takia.

Poisto tehdään lähdeosan ja objektin nimen perusteella ennen aluejakoa. Tavalliset enintään 45 m korkuiset katupuut, yksityiskohtainen TRN-rinnemaasto, ajotiet ja rakennukset säilyvät alkuperäisissä maailmankoordinaateissa. Yksittäisen puuryhmän korkeus tarkoittaa koko ryhmän pystysuuntaista ulottuvuutta, ei jokaisen puun pituutta. Poisto voi avata kaukonäkymää ja paljastaa tuodun kartan reunoja.

scenery-audit.json tallentaa lähteiden nimet, mitat, rajat ja kolmiomäärät. Toisto: python tools/audit-rockport-scenery.py. Se mittaa lähteet; scene-fixes.json on varsinainen pysyvä poistolista. Päivitetty optimoija ja lähdevertailu käyttävät molempia poistolistoja. Aluegeometria, koko kartan GLB ja niiden törmäyspinnat rakennetaan samasta rajauksesta, joten poistettu puumalli ei jätä omaa näkymätöntä törmäyskopiota. Aloituspaikka ja löydöt säilytetään.

Varmistus v0.13.4: kaikki 306 uutta poistoa löytyvät rakennetun kartan poistoraportista. Lopullinen kartta sisältää 485 aluetta ja 5 155 440 kolmiota; näkyviä kolmioita poistui 128 424. Ajotiekolmioita on edelleen täsmälleen 127 782. Aloituspaikka ja kahdeksan löytöä ovat samoissa koordinaateissa. Kaikkien 13 lähdeosan säilytetyn geometrian otosvertailu läpäisi tarkistuksen, samoin yhdistetyn GLB:n ja alueiden rakennetarkistus. 58 testiä ja syntaksitarkistukset läpäisty. Neljä 120 sekunnin AI-otosta etenivät noin 1,46–1,99 km ilman putoamista tai palautusta. Tulokset: scenery-validation.json, source-audit.json ja vehicle-physics-audit.json. Aiemmat karttakohtaisten vanhojen versioiden raportit eivät muutu koko kartan takuutesteiksi.

Selainvarmistus: erillisessä karttatarkistimessa tallin ympäristö ja kampus latautuivat. Kampuksen tie näkyi vapaana ja auto eteni 33 km/h (X 2076, Z −3300 → −3291), Ajopinta OK. Kuva: scenery-v0134.png. Käynnissä olevaa varsinaisen pelin ajoa ei ladattu uudelleen tarkistuksen takia.
