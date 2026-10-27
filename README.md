# BLACKLINE — Analog Street Series v0.25.1

Siviililiikenne käyttää kartan kolmea henkilöautoa ja tila-autoa alkuperäisine
tekstuureineen. Autot ajavat tieverkon mukaan, jarruttavat edellä ajaviin ja
osallistuvat samoihin koritörmäyksiin kuin pelaaja, poliisit ja kisavastustajat.
Liikennettä on myös kisoissa ja Camdenissa. Enintään kahdeksan autoa syntyy
ladatuille tieosuuksille pelaajasta etäälle; yli 600 metrin päähän jäävät autot
siivotaan, ja maailmasta poistuminen vapauttaa mallit sekä tekstuurit.
`node tools/build-traffic-cars.cjs` erottaa liikenteen mallit kartan geometriasta
tiedostoon `assets/rockport/traffic-cars.json`. Alkuperäiset pysäköidyt autot säilyvät.

Maasto-oikoreiteillä ei ole enää tien pintaluokkaan perustuvaa nopeusrajoitinta.
Sora, ruoho ja polut säilyttävät auton kiihtyvyyden ja liike-energian samalla
tavalla kuin asfaltti. Mäet, hypyt, jarrutus ja kiinteät törmäykset toimivat edelleen.
Pitkän kaltevan reunakivikolmion korkeus arvioidaan osumakohdasta, jotta sen
kauempana ylämäessä oleva kärki ei estä matalan reunan ylittämistä.

Oikoreittien tarkistus: `tools/inspect-shortcut-surfaces.py`,
`node tools/audit-shortcuts.cjs`, `node tools/audit-shortcut-routes.cjs` ja
`node tools/drive-shortcuts.cjs --access`. Tarkistus käy läpi koko kartan polku-
ja soramateriaalit, etsii tie–maasto–tie-koelinjoja ja erottaa niiden fyysisesti
läpiajettavat yhteydet. Koelinja rakennuksen läpi ei tarkoita puuttuvaa oikoreittiä.

Tienvarsien esineet (myös korkeammat katuvalo- ja liikennevalotolpat, pienet
liikennemerkit, kartiot, roskakorit, tynnyrit, pahvilaatikot ja irtoroskat) irtoavat
auton osumasta myös kisoissa ja tekoälyautojen osuessa niihin.
Myös pienet suojakaaret/pyörätelineet, tienrajauspylväät, siirrettävät sulut,
pysäköintimittarit, postilaatikot, renkaat ja muut pienet irralliset katuesineet
irtoavat. Pienen erillisen esineen materiaalin nimessä oleva `BARRIER` ei enää
estä rikkoutumista; yhtenäiset kaiteet ja rakenteelliset esteet säilyvät kiinteinä.
`OBJ_STREETBARRIER_JG`-suojakaaret erotetaan UV-toiston mukaan yksittäisiksi
paneeleiksi, vaikka niiden päät koskettavat toisiaan tai tienpinnan pisteitä.
Näin pitkä kaaririvi ei muutu yhdeksi rikkoutumattomaksi rakenteeksi.
Oranssit valkopäiset rajauskepit käyttävät erillistä `ARC_ROADDIVIDER_JG`-
materiaalia. Ne tunnistetaan pieninä irtoavina esineinä myös `ARC_`-etuliitteestä
huolimatta; kokoraja estää saman luokittelun laajoille kiinteille rakenteille.
Rikkoutumisesta syntyy materiaalin mukainen kolahdus/räsähdys, lyhyt pölypöllähdys
ja metalliosumista kipinöitä. Nykyinen ÄÄNI ON/OFF ohjaa myös törmäysääniä.
Äänet vaimenevat etäisyyden mukaan; samanaikaisia ääniä on enintään kuusi.
Kipinöille ja pölylle on kiinteät hiukkaspoolit (192/64), kaksi piirtoa ja lyhyt
elinikä. Alueen poistaminen tyhjentää myös sen hiukkaset. Efektit toimivat sekä
vapaassa ajossa että kisoissa, myös tekoälyautojen osumissa.
Rakennukset, muurit, kaiteet ja suuret rakenteet säilyvät kiinteinä. Irtokappaleet
poistuvat neljässä sekunnissa; niitä on enintään 48 samanaikaisesti. Esine pysyy
rikkoutuneena alueen ollessa muistissa ja palautuu vasta alueen latautuessa
uudelleen. Alueen poistaminen siivoaa myös sen irtokappaleet. Tilaa ei tallenneta.

`node tools/build-breakables.cjs` muodostaa kartan lopullisesta geometriasta
`assets/rockport/breakables/`-tiedot ja tarkat poistettavat törmäyskolmioindeksit.
Aja komento uudelleen kartan geometrian tai törmäystiedostojen muuttuessa.
Materiaalien nimet, yhtenäiset geometriakappaleet ja kokorajat rajaavat irtoavat
esineet; alkuperäisiä kartta- ja törmäystiedostoja ei muuteta. Tiedot sisältyvät
myös offline-paketin rakennukseen.

## v0.25.1 — katselusuuntaa seuraava minimap

Minimap kääntyy ajokameran vaakasuunnan mukana sekä vapaassa ajossa että kisoissa. Myös hiirellä sivulle katsominen kääntää karttaa. Tiet, GPS, kisareitti, portit, merkit ja auton nuoli käyttävät samaa suuntaa; kohteiden kirjaimet pysyvät oikein päin. Tiepintojen rasteri on välimuistissa, mutta sen kierto ja siirto päivittyvät joka ruudulla. Kaupunkikartan suunta säilyy ennallaan. Suuntalaskenta ja välimuistin aikainen liike tarkistetaan karttatesteissä.

## v0.25.0 — selkeämmät kisareitit

Kisojen ajolinjoilta on poistettu tarpeettomia lyhyitä paluukoukkauksia ja U-käännöksiä. Neljän perusreitin paluukisat käyttävät nyt samaa fyysistä reittiä vastakkaiseen suuntaan. Sataman liittymään on tehty erikseen oikean ajopinnan ja törmäysten perusteella tarkistettu linja; lähtö- ja maalipaikat sekä kisojen tunnisteet säilyvät.

Tienpinnan suuntanuolet näyttävät seuraavat 200–400 metriä. HUD ennakoi mutkan suunnan ja etäisyyden nopeuden mukaan, ja minimap korostaa lähestyvää reittiosuutta. Väärä ajosuunta, reitiltä poistuminen ja ohitettu portti saavat omat ohjeensa. Portit sijoittuvat aiempaa useammin suorille ja kattavat saman tason molemmat ajoradat myös keskikaistan yli. Reittiviiva on ohje: porttien välissä saa edelleen käyttää oikopolkuja.

R palauttaa nykyisen porttivälin ajolinjalle hieman auton taakse. Ennätykset tallentuvat uuden reittiversion avaimeen, koska reittien pituudet muuttuivat; rahat, autot ja uran eteneminen säilyvät.

Tarkistukset: 137 yksikkötestiä, syntaksitarkistus, 25 kisareitin kaikkien porttien ajopinta ja järjestyksessä ylittäminen sekä kuuden korjatun kohdan ajofysiikkakoe ilman osumia tai palautuksia. Nämä ovat rajattuja tarkistuksia, eivät koko kaupungin jokaisen tien koeajo. Opasteita voi kokeilla tallennusta muuttamatta sivulla `tools/race-guide-preview.html`.

Reittityökalujen järjestys alkuperäisestä `race-flow-before.json`-aineistosta: `improve-race-flow.cjs`, `repair-race-detours.cjs`, `align-race-directions.cjs`, `repair-harbour-road.cjs`; tarkistukset: `audit-race-gates.cjs` ja `audit-race-flow-driving.cjs`. Työkalut ajetaan projektin juuresta.

## v0.24.1 — suurempi ja pehmeämpi driftisavu

Pienten kiinteiden monikulmioiden tilalla on läpikuultava, kerroksellinen savuvana molempien takarenkaiden kohdalta. Pilvet kasvavat noin 4–6 metrin levyisiksi, kohoavat, kiertyvät ja haihtuvat 2,6–3,7 sekunnissa. Sivu­luisu synnyttää savua myös ilman käsijarrua; paikallaan tai ilmassa ei synny uusia pilviä. Savun voimakkuus kasvaa luiston ja nopeuden mukana.

Efekti käyttää yhtä instansoitua piirtoa ja enintään 256 hiukkasta, proseduraalista pehmeäreunaista tekstuuria ja pelin normaalia syvyystestausta sekä sumua. Savu ei muuta ajofysiikkaa. Kolme testiä kattavat syntymisehdot, hiukkasrajan, haihtumisen ja vastaavan tiheyden 30/60/120 Hz:llä. Kaikki 133 testiä läpäisty. Samaa savumoduulia käyttävä esikatselu: `tools/drift-smoke-preview.html`.

## v0.24.0 — tallikamera ja osien käsinsovitus

Tallissa ja Tuning Shopissa hiiren vasen veto kiertää kameraa vaakaan ja pystyyn. Rulla zoomaa, Shift + vasen veto tai oikean painikkeen veto siirtää katselukohdetta. **PALAUTA KAMERA** palauttaa lähtönäkymän. Valikoiden ja syöttökenttien käsittely toimii normaalisti; ajon aikainen kameran hiiriohjaus säilyy erillisenä.

Tuning Shop → **OSIEN SIJOITTELU** listaa autoon valitut vaihto-osat sekä neljä vaihtopyörää erikseen. Valitse osa ja muuta X/Y/Z-arvoja metreinä tai ota **SIIRRÄ OSAA HIIRELLÄ** käyttöön ja vedä osaa autonäkymässä. Veto siirtää osaa kameran näkötasossa; tarkka syvyyssäätö tehdään koordinaateilla tai vaihtamalla kuvakulmaa. Osaa voi myös valita napsauttamalla sitä siirtotilassa. **PALAUTA OSAN SIJAINTI** palauttaa kyseisen osan automaattisen sovituksen. Parina mallinnetut helmat, canardit, spatsit ja levikkeet liikkuvat yhtenä osamallina.

Manuaaliset siirrot tallentuvat autokohtaisesti ja erikseen kullekin osavalinnalle. Siirto tehdään automaattisen sovituksen jälkeen, joten käyttäjän asettamaa sijaintia ei kumota seuraavassa latauksessa. Vanhojen osien siivet, splitterit ja helmat ovat myös siirrettävissä. Säädön rajat ovat ±1,5 m per akseli; VAKIOASETUKSET palauttaa myös käsinsäädöt. Kameran tila on istuntokohtainen. Testit: `tests/garage-editing.test.cjs`; koko testikokonaisuus 130 testiä läpäisty.

## v0.23.0 — 32 korinosaa, viisi Sport-vannetta ja Testarossa

Tuning Shopin ulkoasussa on nyt koko 32 osan suunnittelukokoelma: kuusi etusplitteriä, viisi sivuhelmaparia, viisi diffuusoria, viisi takasiipeä, neljä canard-paria, kolme konepellin ilmanvaihto-osaa, kaksi spat-paria ja kaksi levikesarjaa. Levikesarjan vasen/oikea pari toistetaan molemmille akseleille. Valinnat tallentuvat autokohtaisesti. Alkuperäiset suunnittelumallit säilyvät `design/body-parts-v1/`-kansiossa; peli lataa niistä kevennetyt, indeksoidut ja kvantisoidut kopiot tiedostosta `assets/custom/workshop.js`.

Sovitus käyttää jokaisen auton alkuperäisiä korikolmioita ja pyöränpaikkoja. Kiinnitysalueet mukautetaan todellisiin pintoihin, sivuhelmojen pituus rajataan pyöränaukkojen väliin ja lokasuojan levikkeet seuraavat pyöränaukkoja. Osat liikkuvat madalluksen mukana. `node tools/audit-workshop.cjs` tarkistaa 39 mallin kaikki 32 osaa (1 248 sovitusta), äärellisen geometrian, maakorkeuden ja kiinnityspisteiden etäisyyden koripintaan. Raportti: `assets/custom/fit-audit.json`. Tämä mittaa kiinnityksiä, ei todista kaikkien mahdollisten yhtäaikaisten osien välistä leikkaamattomuutta.

Viisi käyttäjän toimittamaa vannetta löytyvät nimillä **Sport 01–05**. Niissä on noin 2 300–2 400 kolmiota per pyörä. Koko, leveys ja vasemman/oikean puolen suunta sovitetaan alkuperäiseen pyörään; camberin maakosketus lasketaan geometriasta. Vanteet pyörivät ja etupyörät kääntyvät normaalisti.

**Ferrari Testarossa / Miami Vice 1986** löytyy autokaupasta: 115 000 €, kuusi bossivoittoa. Vakiosuorituskyky on pelillinen arvio. Lähteen luurankomuunnokset jäädytetään ennen kevennystä ja saumojen kärjet yhdistetään, jotta pinnat eivät hajoa harvennuksessa. Piilossa oleva moottorin sisägeometria jätetään pois. Lopullinen auto sisältää 9 846 kolmiota alkuperäisen 262 854 sijaan; 15 tekstuuria ovat enintään 256 px / 96 väriä. Lähdearkistot säilyvät ennallaan.

Tarkastelusivu ilman pelitallennuksen muutoksia: `http://127.0.0.1:4175/tools/workshop-check.html`. Se käyttää samoja pelimalleja ja sovituskoodia kuin varsinainen peli. Päivitä avoin pelisivu ladataksesi version 0.23.0. Alla mainittu aiempi v0.22.1-offline-ZIP on vanhan version paketti.

Pelattava HTML/CSS/JavaScript-autopeli. **PS1 / Gran Turismo 2 -henkiset autot, vahva kellanvihreä värisuodin ja rosoinen kuva.**

## v0.22.1 — avauskoodi ilman funktionäppäimiä

Tallissa avaa **AVAUSKOODI**, kirjoita **BLACKLINE** ja paina **AVAA** tai Enter. Kenttä ohittaa F10:n mahdolliset näppäimistö- ja selainristiriidat. Vanha Ctrl + Shift + F10 toimii edelleen tallissa ja tauolla. Väärä koodi näyttää virheen eikä muuta tallennusta. Päivitä jo auki oleva pelisivu, jotta uusi kenttä tulee näkyviin. OneDriven aiemmin toimitettu `BLACKLINE-Windows-offline-v021.zip` päivitetään samalla sisällöllä; toisella koneella päivitetty ZIP täytyy purkaa uudelleen.

Avauskoodi ohittaa myös kaikkien Blacklist-haasteiden etenemislukon. Tallin Blacklist on edelleen katselutila: rivit näyttävät nyt AVATTU · HAASTA ROCKPORTISSA / B. Uusi AJA ROCKPORTIIN -painike siirtää vapaaseen ajoon; paina siellä B ja valitse bossi. Näin tallin harmaat painikkeet eivät näytä virheellisesti etenemislukolta.

## v0.22.0 — LB-Works F40 ja avauskoodi

Punainen Resonanso A40 on korvattu LB-Works Ferrari F40:llä. Tallennustunniste, aiempi omistus, viritykset ja auton suorituskyky säilyvät. Malli keveni 704 497 kolmiosta 13 246 kolmioon ja tekstuurit ovat enintään 256 px; tekijä ja lisenssi: `assets/street/lb-f40-LICENSE.txt`.

**Ctrl + Shift + F10** tallissa tai tauolla avaa kaikki käytössä olevat autot, Stage 4 -moottoripaketit ja Blacklist-haasteet sekä nostaa rahat vähintään **1 000 000 euroon**. Kustomointiosat ovat valmiiksi käytettävissä. Avaus tallentuu peliin. Oikeat bossi- ja kisavoitot säilyvät ennallaan; poistettuja autoja ei palauteta. Ilman koodia normaali 10 kisavoiton progressio jatkuu. Kisat aloitetaan edelleen Rockportin lähtömerkeiltä ja Blacklist painamalla B vapaassa ajossa.

## Windows-offlinepaketti

[BLACKLINE-Windows-offline-v0221.zip](dist/BLACKLINE-Windows-offline-v0221.zip) sisältää koko pelikäyttöön tarvittavan aineiston ja Windows x64 Node.js -käynnistysympäristön. ZIP on noin 267 Mt ja tiedostot purettuna noin 650 Mt. Siirrä ZIP toiselle koneelle, valitse **Pura kaikki** esimerkiksi kansioon `C:\Pelit\BLACKLINE` ja avaa **Kaynnista BLACKLINE.bat**. Node.js:ää, Pythonia, npm:ää tai Codexia ei tarvitse asentaa. Pidä käynnistysikkuna auki; peli avautuu osoitteeseen `http://127.0.0.1:4185/`.

Pelaaminen ei tarvitse internetiä, kun paketti on kokonaan ladattu ja purettu paikalliselle levylle. Karttapaloja ja tekstuureja luetaan edelleen levyltä ajon aikana. Alkuperäiset lähdemallit, lähdearkistot, työkalut ja 32 erillistä korinosamallia eivät kuulu pelikäyttöpakettiin. Kaikki 647 käytössä olevaa karttapalaa ovat mukana. Tavallinen WebGL:ää tukeva selain tarvitaan.

Tallennus on selaimen ja osoitteen paikallisessa muistissa; sitä ei siirretä toisen koneen mukana ZIPissä. Paketti ei poista vanhoja tallennuksia. `Tarkista tiedostot.bat` tarkistaa paketin tiedostojen SHA-256-tarkistussummat kokonaan paikallisesti.

Paketointi: `tools/build-offline-windows.py --node POLKU/node.exe`. `packaging/windows/` sisältää erillisen paikallispalvelimen, käynnistimen ja virallisen Node.js-lisenssin. Rakennus kerää varsinaiset glTF-puskurit, tekstuurit ja törmäystiedostot manifestin riippuvuuksista; vanhaa noin 313 Mt:n yhdistelmämallia ei monisteta mukaan. ZIPin CRC-tarkistus ja puretun paketin kaikkien 4 757 tiedoston varmennus on läpäisty. Paikallispalvelimen, välimuistivastausten ja käynnistysvirheiden testit: `node --test tests/offline-package.test.cjs` (tarvitsee localhost-yhteydet).

Offline-paketti käyttää omaa pysyvää porttia 4185, jotta vanha kehityspalvelin porteissa 4173 tai 4175 ei estä sen käynnistymistä.

## v0.21.0 — nopeampi kilpa-AI ja sitkeämpi poliisi

AI:n vanha 86 %:n huippunopeustavoite on poistettu. Vastustajat kiihdyttävät suoralla auton normaalin fysiikan rajoihin ja käyttävät enintään 1,6 s:n nitropyrähdyksiä, joiden välissä on vähintään 5 s. Nitro kulutetaan ja ladataan samoilla säännöillä kuin pelaajalla. Mutkat, seinät, lento, heikko suuntaus ja loppusuoran lyhyt jäljellä oleva matka estävät nitron. Mutkanopeus perustuu auton pitoon ja ennakoituun jarrutusmatkaan; suoran nitrovauhtia ei tuhota tarpeettomalla jarrutuksella. AI hakee ohituskaistan hitaamman auton viereltä, tarkistaa tien ja oman törmäyslaatikon sekä hidastaa lähellä edellä ajavaa. Tavallisten kisojen kalusto valitaan vastaavan suorituskykyluokan vahvemmasta päästä, enintään yhtä viritystasoa ylempää ja edelleen rajatuilla tehoeroilla.

Poliisien Interceptor-, Porsche-, GT-R- ja R390-kalusto sekä viritykset valitaan pelaajan suorituskyvyn ja heatin mukaan. Niillä on sama alustafysiikka kuin pelaajalla. Lähtöpaikat tarkistetaan todellisesta tiestä täydellä auton leveydellä ja pituudella, eikä yksiköitä pinota päällekkäin. Liikkuvan pelaajan perään lähetettävä yksikkö tulee liikenteeseen valmiiksi liikkeessä. Heat voi tuoda enintään kuusi autoa; lisäyksiä tehdään kolmen sekunnin välein vain tuoreen havaintotiedon aikana. Pelaajasta kauas jääviä yksiköitä ei teleportata takaisin rinnalle.

Takaa-ajoreitti päivitetään noin 0,65 s välein. Kohdetta ennakoidaan nopeuden perusteella, ja ruudukon sahaavat mutkat oikaistaan vain auton levyisillä, tien tukemilla ja esteettömillä yhteyksillä. Poliisi käyttää viimeksi nähtyä paikkaa: seinät ja korkeustasot huomioiva näköyhteystarkistus tehdään neljästi sekunnissa. Näköyhteys säilyy avoimella tiellä noin 305–405 m:iin heatista riippuen. Vanha 95 m:n automaattinen karkumatka ei riitä. Näköyhteys on katkaistava vähintään 14–22 sekunniksi ja etäisyyttä oltava yli 110 m; tämän jälkeen etsintä kestää 24–40 sekuntia. Uusi havainto käynnistää takaa-ajon uudelleen. Etsinnässä poliisi ajaa viimeiseen havaintopaikkaan. Alle 16 m:n päässä, samalla korkeustasolla ja näköyhteydessä oleva poliisi voi ottaa alle 6 m/s liikkuvan auton kiinni viidessä sekunnissa; näin puskurien väliin jääminen ei estä kiinniottoa.

**117 testiä ja syntaksitarkistukset läpäisty.** Testit kattavat näköesteet, eri korkeustasot, uudelleenhavainnon, pidemmän etsinnän, kaluston suorituskyvyn, turvalliset lähtöpaikat, fyysisesti tarkistetut reittioikaisut, ohituskaistan, nitron rajat ja ohjauksen vakauden 30/60/120 Hz:llä. Sama auto eteni 30 sekunnin suoravertailussa **29–52 % pidemmälle** kuin aiemmalla 86 %:n ilman nitroa ajavalla ohjauksella (`ai-pace-audit.json`); tämä mittaa suoraa, ei kokonaisten kisojen vaikeutta. `audit-pursuit.cjs` ajoi oikealla kartalla noin 180 m:n päästä alle 22 m:n päähän paikallaan olevasta kohteesta Rosewoodissa, Gray Pointissa ja Downtownissa (`pursuit-drive-audit.json`). Vanhoja kartta-aukkoja ei tällä muutoksella korjata. Selaimessa tarkistettu takaa-ajon alkaminen ja poliisien suorittama kiinniotto erillisellä localhost-testitallennuksella.

## v0.20.1 — kisat vain Rockportissa

Tallista poistetaan ratavalikoima, ajotavan valinta ja suora kisan aloitus. **Aja Rockportiin → etsi numeroitu lähtömerkki M-kartasta → pysähdy merkin luo → E.** Lähtöpaikalla avautuvasta ikkunasta valitaan neljän auton sprintti tai yksin ajettava aika-ajo. Peruuttaminen tai Esc palauttaa vapaaseen ajoon. Maailma ja ajokello pysähtyvät valinnan ajaksi.

**B** avaa Blacklistin vapaassa ajossa ilman aktiivista kisaa tai takaa-ajoa. Bossia voi haastaa tästä näkymästä, kun 10 kisavoiton vaatimus täyttyy. Tallin Blacklist-painikkeella voi edelleen katsoa etenemistä, mutta siitä ei voi aloittaa haasteita. Ikkunan sulkeminen palauttaa ajon. M-kartan opastus ja pikasiirtyminen lähtöpaikkojen lähelle säilyvät; pikasiirtyminen ei itsessään aloita kisaa.

110 testiä läpäisty sekä syntaksitarkistukset. Uudet testit tarkistavat tallista aloittamisen eston, lähtömerkin kisavalinnan, peruutuksen ja Blacklistin eron tallin ja vapaan ajon välillä. Selaimessa tarkistettu tallin siivous, E-valinta, Esc-peruutus, B-Blacklist ja oikean neljän auton sprintin käynnistyminen lähtöpaikalta. Kaikki 12 sprinttiä, bossit, palkinnot ja aiempi eteneminen säilyvät.

## v0.20.0 — 12 sprinttiä ja 10 voiton Blacklist-vaatimus

Kisavalikoimassa on nyt **12 sprinttiä**. Neljä alkuperäistä ja niiden bossiosuudet säilyvät. Lisätty neljä paluusuunnan tapahtumaa: Rosewood Return (8,1 km), Harbour Reverse (6,9 km), Downtown Ascent (4,6 km) ja The Long Climb (10,3 km). Neljä lyhyempää tapahtumaa käyttävät olemassa olevien ajolinjojen osia: Campus Climb (4,0 km), Industrial Cut (3,0 km), Central Sprint (3,0 km) ja Cross City (4,5 km). Kaikki löytyvät vieritettävästä ratavalikosta sekä M-kartasta ja vapaan ajon lähtömerkeistä. Uutta karttageometriaa ei tarvita.

**Jokaista seuraavaa voittamatonta bossia, myös Sonnya, ennen tarvitaan 10 tavallisen sprintin voittoa.** Vain ykkössija vastustajia vastaan lasketaan. Saman kisan uusintavoitot kelpaavat; aika-ajot, häviöt ja bossiuusinnat eivät. Uuden bossin voitto nollaa laskurin, joten ylimääräisiä voittoja ei voi säästää seuraavalle bossille. Hävitty bossikisa säilyttää saavutetun 10/10-oikeuden. Jo voitetut bossit voi haastaa uudelleen. Blacklist-paneeli näyttää laskurin, seuraavan bossin vaatimuksen ja myöhempien bossien järjestyslukituksen; kisan tulos kertoo uuden tilanteen.

Tallennuksen `raceWinsSinceBoss` säilyy latausten välillä, enintään 10; `regularRaceWins` seuraa tavallisten kisojen kokonaisvoittoja. Vanhat bossivoitot, autot, viritykset ja rahat säilytetään. Aiemmista tuntemattomista tavallisten kisojen voitoista ei arvata hyvityksiä: seuraavan voittamattoman bossin laskuri alkaa nollasta. Kokonaan läpäisty Blacklist pysyy läpäistynä.

Tavallisten kisojen vastustajat valitaan pelaajan auton ja viritystason suorituskyvyn läheltä, jotta myös Crown Victorian aloitusautolla voi ansaita vaadittavat voitot. Autoilla on sama ajofysiikka; bossien määrätyt autot ja viritykset säilyvät.

**108 testiä läpäisty sekä syntaksitarkistukset.** Testattu jokaisen 13 bossin 9/10-lukitus, kymmenes voitto, tallennuksen lataaminen, tappiot, aika-ajot, uusinnat ja tuplalaskennan esto oikeassa maalintulokäsittelijässä. Kaikkien kahdeksan uuden tapahtuman 32 m:n lähtöruudukko tarkistetaan auton kokoisena. `node tools/audit-additional-races.cjs` ajoi AI:lla 150 m jokaisen uuden tapahtuman alusta ilman osumia tai putoamista; tämä ei tarkoita kaikkien reittien koko pituuden virheettömyyttä. Porttitarkistus kattaa kaikki 12 sprinttiä ja 13 bossiosuutta. Selaimessa tarkistettu uusi kisavalikko ja tuoreen uran Sonnyn lukitus.

Uusien tapahtumien rakentaminen: `node tools/expand-rockport-races.cjs`. Perusreittien normaalin uudelleenrakennuksen jälkeen lisätapahtumat muodostetaan automaattisesti. Mittaukset: `additional-races-audit.json`, `additional-races-drive-audit.json` ja `race-gates-audit.json` Rockportin hakemistossa.

## v0.19.0 — leveät kisaportit ja vapaat ajolinjat

Sprinttien näkymätön 15 m:n reittikäytävä on poistettu. Pelaaja saa käyttää vaihtoehtoisia teitä ja oikaisuja porttien välillä: vain seuraavan portin ylittäminen eteenpäin oikeassa järjestyksessä ratkaisee. Minikartan viiva on opaste. Sama porttisääntö koskee vastustajia; niiden fysiikalla ajettava ohjauslinja käsitellään erillään kilpailun etenemisestä.

Porttien leveys mitataan oikean korkeustason tienpinnoista molempiin suuntiin, myös silloin kun ajolinja on tien laidassa. Kapea keskikaista sallitaan ja tien kallistus huomioidaan. Nykyisten sprinttien ja bossikisojen mitatut portit ovat noin 18–60 m leveitä. Kymmenmetriset pylväät, yläpalkki ja himmeä läpinäkyvä pinta näyttävät hyväksyttävän alueen. Myös minikartan merkki näyttää portin leveyden. Mittaus odottaa koko portin ympäristön latautumista.

Portteja on noin 700 m välein aiemman 240 m:n sijasta. Niitä siirretään lähistön suorempiin kohtiin, jotta pitkä osuus antaa tilaa ajolinjoille. Neljässä sprintissä on 12 / 10 / 7 / 15 porttia. HUD näyttää linnuntie-etäisyyden seuraavaan porttiin. Vastakkaiseen suuntaan ajo, väärä korkeustaso, puuttuvien porttien ohittaminen tai teleportti ei kelpaa suoritukseksi; tavallinen hyppy portin läpi sallitaan. R palauttaa viimeksi hyväksytylle portille. Uuden porttisäännön ennätykset tallennetaan erikseen vanhoista ajoista.

Vertailuna katsottu [Most Wanted 2005: Bristol & Bayshore -gameplay](https://www.youtube.com/watch?v=vwACJCp1CpU): leveän tien ja nurmialueiden käyttö ohjasi vapaan ajolinjan toteutusta. Tämä päivitys ei jäljennä alkuperäisiä kisareittejä yksi yhteen; nykyiset neljä tiegeometriaan validoitua reittiä, autot ja bossijärjestys säilyvät.

**103 testiä läpäisty.** `node tools/audit-race-gates.cjs` mittaa kaikkien neljän sprintin ja 13 bossikisan portit todellisesta kartasta ja tarkistaa niiden järjestyksessä läpäisemisen. `assets/rockport/race-gates-audit.json` sisältää mitat. `/tools/race-gate-check.html?route=1&gate=1` näyttää saman porttirenderöinnin ja ylitystarkistuksen oikealla ajofysiikalla ilman pelitallennuksen muuttamista. Selaimessa tarkistettu neljän auton sprintin käynnistys sekä 25,3 m leveän portin hyväksyminen oikealla ajofysiikalla, aloittaen vasta 35 m portin edestä.

## v0.18.1 — minikartan suunta ja pikasiirtyminen

Minikartta käyttää nyt samoja maailman X/Z-akseleita kuin M-kartta: pohjoinen on ylhäällä. Tiet, löydöt, kisareitit, ajo-ohje, kilpailijat ja poliisit piirretään samaan suuntaan. Auton nuoli seuraa korjattua suuntaa; esimerkiksi maailman +Z-suuntaan ajaminen liikkuu kartalla alas.

**M → valitse kohde → PIKASIIRRY KOHTEESEEN** siirtää auton tallin, autokaupan, aluekohteen tai kisan lähdön lähelle. Kisakohteeseen siirtyminen päättyy vapaaseen ajoon; kilpailu aloitetaan normaalisti E:llä. Pikasiirtyminen toimii myös tallivalikosta ja tauolta. Se on lukittu aktiivisessa kisassa, lähtölaskennassa ja takaa-ajossa.

Kohteen karttapalat ladataan ennen auton siirtoa. Turvapaikka tarkistetaan oikean auton törmäyslaatikolla, kuudella tien tukipisteellä ja tien korkeudella; tarvittaessa haetaan vapaa paikka enintään 70 m:n päästä. Nopeus ja kameran hiirikatselu nollautuvat ja R-palautus viittaa uuteen paikkaan. Tallille siirtyminen tallentaa sen viimeksi käytetyksi talliksi. Omistus, rahat ja Blacklist-voitot säilyvät.

**99 testiä läpäisty.** Minikartan oikea piirto tarkistetaan myös sen todellisesta renderöintifunktiosta. Kaikille kymmenelle karttakohteelle tarkistetaan turvallinen paikka 2,5 × 5,8 m:n autolla. Selaimessa tarkistettu pikasiirtyminen satamaan tallivalikosta ja tallille vapaasta ajosta.

## v0.18.0 — Camdenin rannikko ja Mastersonin satama

Käyttäjän toimittamasta Mauleous Gamingin **NFS World x Assetto Corsa** -paketista on yhdistetty nykyiseen Rockportiin Camdenin puuttuvia teitä, maastoa, rakennuksia ja tavallista kasvillisuutta. **M → ◆ MASTERSON NAVAL SHIPYARD** tai **◆ BAYSHORE / RANNIKKO → ASETA AJOREITTI** näyttää ajettavan lähestymisreitin. Myös **Gray Pointin talli on nyt käytössä**.

Kohdistus on pelkkä siirto, ei skaalaus: 6 569 yhteisen tien kärkipisteen vertailun mediaanivirhe on 2,2 mm. Alkuperäiset 485 alueen geometria- ja törmäystiedostot säilyvät ennallaan. Lisäys sisältää **162 alueittain ladattavaa palaa, yhteensä 68 065 332 tavua (68,1 Mt)**. Suurin geometria- tai törmäyspala on **991 800 tavua**. Näkyviä tienpintoja ja maastoa ei harvenneta; rakennusten ja koristeiden pienet yksityiskohdat yksinkertaistetaan ennen aluejakoa. Puuttuvista pinnoista jää noin 850 000 kolmiota alkuperäisen noin 1,87 miljoonan sijaan. Tekstuurit ovat enintään 128–256 px ja 128–256 värin paleteilla, samalla lähimmän pikselin suodatuksella kuin muu peli.

Paketti sisältää myös Palmontin ja erittäin tiheät `RoadsPhysical`-/`Walls`-apumallit. Palmontia ei tuoda. Paketin oma `ext_config.ini` piilottaa fysiikkakopiot, joten niitä ei lisätä näkyvän kartan päälle; pelin törmäykset muodostetaan lopullisista näkyvistä pinnoista. Opaakkien DDS-kuvien kiiltokanava poistetaan ennen PNG-palettimuunnosta. Aitojen aita-, puu- ja muiden leikkausmateriaalien läpinäkyvyys säilyy.

Camdenin navigointiverkkoon lisätään sekä uudet tiet että aiemmasta verkosta puuttuneet, jo valmiiksi ajettavat tienpätkät. Vanhojen 50 987 solmun tunnisteet ja nykyiset kisareitit säilyvät. Uusia solmuja on 11 843; tarkistetuista yhteysehdotuksista 25 816 hyväksyttiin ja 10 180 hylättiin törmäyslaskennalla. Tallin saavutettava verkko kasvaa 39 151 → 51 324 solmuun. M-kartassa on edelleen himmeitä, irrallisia osia: päivitys ei ole lupaus koko Rockportin kaikkien vanhojen aukkojen korjaamisesta. Lähde on NFS Worldin versio alueesta, joten se voi erota vuoden 2005 pelistä.

**95 testiä läpäisty.** Uudet testit tarkistavat lisäyksen koon ja tekstuurit, opacity-/kiiltokanavien eron, todelliset reitit kolmanteen talliin ja molempiin uusiin aluekohteisiin sekä sataman rampin ajamisen pelaajan yhteisellä fysiikalla. Neljän vanhan sprintin 1 469 aiemmin tuettua auton asentoa tarkistettiin uudelleen ilman uusia ongelmia. `extension-report.json`, `extension-navigation-audit.json` ja `extension-race-audit.json` sisältävät mittaukset. Alkuperäisiä lataustiedostoja ei muuteta.

## v0.17.0 — Rockportin M-kartta ja tallien sijainnit

**M** avaa koko kaupungin kartan tallista, ajosta, kisasta ja tauolta. M, Esc tai Sulje palauttaa aiemman tilan. Kartan aikana autot, poliisit, lähtölaskenta ja kisakello pysähtyvät. Kartassa näkyvät oma paikka ja ajosuunta, kolme tallikohdetta, autokauppa, neljän sprintin lähdöt ja käynnissä olevan kisan reitti. Hiiren rulla zoomaa, vetäminen siirtää näkymää; painikkeilla saa koko kaupungin tai oman sijainnin. Viitekartta-painike näyttää aiemmin toimitetun alkuperäisen aluekartan.

Valitse kohde kartalta tai sivun listasta ja paina **Aseta ajoreitti**. Sininen viiva seuraa nykyisen tieverkon yhteyksiä sekä isossa kartassa että vapaan ajon minikartassa. Se säilyy kartan sulkemisen jälkeen ja poistuu kohteeseen saavuttaessa; uuden reitin saa valitsemalla kohteen uudelleen. Kisassa näytetään kilpailun oma reitti. Kartta ei siirrä autoa kohteeseen.

Vihreiden talokuvakkeiden mukaiset tallin sisäänkäynnit on sovitettu oikealle, esteettömälle tielle **Rosewoodissa (1728, 147.719, −2508)** ja **Downtownissa (2178, 107.15, 144)**. Pysähdy vihreän renkaan luo ja paina E. Seuraava vapaa ajo alkaa viimeksi käytetystä tallista; vanhan tallennuksen oletus on Rosewood. Viitekuva on kaaviomainen, joten sisäänkäynnit ovat lähimmissä turvallisissa kohdissa, noin 87 ja 57 metriä kuvan maamerkkisovituksesta. Gray Pointin kolmas talli näkyy suljettuna: sen kohdalla ei ole nykyisessä aineistossa ajettavaa tieyhteyttä. Puuttuvia kartan osia ei ole tässä päivityksessä täydennetty.

Karttakerros on paikallinen 97 kt:n PNG oikeasta tieverkosta. `src/world-map.js` käsittelee tallit ja reitinhaun; `src/world-map-ui.js` kartan käyttöliittymän. Kuuden uuden testin kanssa **90 testiä läpäisty**. Selaimessa tarkistettu kartan M-avaus tallista ja ajosta, zoomaus, viitekartta, kohteen valinta, 3,7 km:n ajoreitti ja ajokellon pysähtyminen.

## v0.16.1 — hiirellä katselu ajossa

Pidä **hiiren oikea painike pohjassa** pelinäkymässä ja liikuta hiirtä: kamera kiertää auton ympäri, ja pystysuuntainen liike muuttaa katselukorkeutta. Kaasu, jarru ja ohjaus toimivat samaan aikaan. Vapautus palauttaa kameran pehmeästi auton taakse. C vaihtaa edelleen lähi- ja kaukokameran välillä; normaali seurantaetäisyys ei kasva kiihdyttäessä. Nykyinen seinien läpi katsomisen estävä kameratörmäys säilyy.

Hiirikatselu toimii vapaassa ajossa, kisoissa ja lähtölaskennassa. Tauko, talliin tai kauppaan siirtyminen, hiiren vapautus ikkunan ulkopuolella sekä ikkunan piilottaminen vapauttavat katselun. R-palautus ja uuden ajon aloitus nollaavat katselukulman. Selaimen oikean painikkeen valikko estetään vain ajon pelinäkymässä; tallin ja kaupan hiirikäyttö säilyy.

`src/drive-camera.js` sisältää katselun ja syötteen käsittelyn. `tests/drive-camera.test.cjs` tarkistaa normaalin kameran säilymisen, kierron, pystykulman rajat, vapautuksen, 30/60/120 Hz:n vastaavuuden ja seinätörmäykset. `/tools/drive-camera-check.html` tarjoaa oikeaan peliin DOM-hiiri- ja kaasusyötteitä lähettävät tarkistuspainikkeet. Testisivu käyttää saman selaimen pelitallennusta. Kaikki 84 testiä läpäisty; sivulle katselu, kaasuttaminen, vapautus ja tauon jälkeinen katselu tarkistettu myös pelissä selaimella.

## v0.16.0 — Mazdaspeed RX-7 ja seitsemän uutta katuautoa

Vanhan RX-7 FD:n korvaa käyttäjän toimittama **1999 Mazdaspeed RX-7 FD3S A-Spec / GT Concept**. Tallennustunniste pysyy `rotary`: omistus, 72 000 €:n kauppahinta, virityspaketit ja säädöt säilyvät. Myös aiempi RX-7:n ajosuorituskyky säilyy; tässä vaihdettiin malli ja sen tekstuurit. Vanhaa RX-7-geometriaa ei enää ladata pelin peruspaketista.

Autokauppaan lisättiin Datsun 280Z / Fairlady Z (20 000 €, 0 bossivoittoa), Hyundai Tiburon V6 2003 (22 000 €, 0), Plymouth Road Runner 1971 (32 000 €, 1), Toyota Supra 1998 (68 000 €, 3), BMW M5 E39 (82 000 €, 4), Resonanso A40 Concept (145 000 €, 7) ja Porsche Carrera GT (195 000 €, 9). Kaupassa on nyt 18 tavallista autoa. Aiemmin poistetut viisi autoa pysyvät pois pelaajan valikoimasta. Uudet autot ostetaan normaalisti; niitä ei myönnetä ilmaiseksi vanhaan tallennukseen. Blacklist-autot ja pink slip -palkinnot säilyvät.

Kaikki kahdeksan ZIPin omaa mallia on muunnettu: neljä erillistä pyöräryhmää, oikein päin olevat keulat, auton mittakaava ja enintään 256 px:n tekstuurit. Road Runnerin alkuperäiset GT2-kärkipistevärit säilyvät. M5:n lähteen kääntyneet etupyörät on suoristettu. RX-7-paketin viisi samannimistä mutta erilaista tekstuuria säilytettiin erillisinä ja yhdistettiin oikeisiin materiaaleihin. Lisäpaketti on **2 572 979 tavua (2,57 Mt)** tekstuureineen, yhteensä 71 655 kolmiota. Lähde-ZIPit (noin 39,4 Mt) säilyvät koskemattomina.

Uusien autojen suorituskykyarvot ovat tämän pelin lähtöarvioita, eivät väite kaikkien lähdemallien täsmällisistä tehdastiedoista. Resonanso on fiktiivinen konsepti. Reittejä tai kartan törmäysgeometriaa ei muutettu tässä päivityksessä.

Toteutus ja uudelleenmuunnos: [assets/street/README.md](assets/street/README.md). `/tools/street-preview.html` näyttää kaikki kahdeksan mallia. **79 testiä läpäisty**: kaikki autot, neljä pyörää, kustomointiosien sopivuus, kuvasuodatus, suorituskyky, kaupparajat ja RX-7:n tallennuksen säilyminen. Mallit ja kauppavalikoima on tarkistettu myös selaimessa.

## v0.15.1 — väliaikaisesti poistettu valikoimasta

Trueno AE86, Mian RX-8, Police Interceptor sekä Skyline Beta Blue ja Java on poistettu käyttäjän pyynnöstä pelaajan autovalinnasta ja kaupasta. Kaupassa on nyt 11 autoa. Crown Victoria korvaa AE86:n ilmaisena aloitusautona ja toimii myös vanhan tallennuksen varana, jos valittuna oli poistettu auto. Rahat, Blacklist-edistyminen ja vanhat autokohtaiset säädöt säilyvät. Interceptorin lähdemalli säilyy poliisien NPC-käytössä; lähdetiedostoja ei poisteta. Izzyn Blacklist-RX-8 säilyy.

## v0.15.0 — Rosewood Motors ja auton omistus

**AUTOKAUPPA** avaa käyttäjän toimittamaan NFS Edge -autotalliin tehdyn näyttelyhallin. Kaikkia 16 aiempaa tavallista autoa voi esikatsella, mutta ajoon ja virityspajaan pääsee omilla autoilla. Kaupan voi avata tallista tai ajamalla Rosewood Motorsin A-merkille Rockportissa ja painamalla E hitaassa vauhdissa. Minikartan reunanuoli näyttää kaupan suunnan sen ollessa kuvan ulkopuolella. Sulkeminen jatkaa vapaata ajoa; **VALITSE JA PALAA TALLIIN** ottaa omistetun auton käyttöön tallissa.

Uusi tallennus alkaa AE86:lla ja 8 000 eurolla. Kauppahinnat ovat 12 000–285 000 €; tehokkaampi valikoima avautuu vähitellen 1–12 Blacklist-voiton myötä. Hinnat ovat tämän pelin talouden tasapainotusta, eivät oikeiden autojen markkinahintoja. Bossien autot pysyvät taattuina pink slip -palkintoina ja niitä ei myydä kaupassa. Hintataulukko: [assets/dealer/README.md](assets/dealer/README.md).

Sprintin voittopalkinto riippuu pituudesta: nykyisillä tavallisilla radoilla noin 3 200–4 900 €. Toinen sija saa noin 40 %, muut sijat noin 20 % ja aika-ajo noin 35 % voittopalkinnosta. Bossien kertabonukset ja muut ansaintatavat säilyvät. Kaikkien bossien ensimmäisistä voitoista ja aloitusrahasta kertyy ilman kulutusta noin 159 000 € sekä pink slip -autot; 285 000 €:n GT-One vaatii lisäksi säästämistä. Viritysten hinnat säilyvät.

Vanhan tallennuksen rahat ja säädöt säilyvät. Siirtymässä omiksi merkitään käytössä ollut auto, moottoripaketeilla jo viritetyt autot, ansaitut pink slip -autot ja aloitus-AE86. Muiden aiemmin vapaasti selattujen autojen mallit ja säädöt jäävät talteen, ja autot ostetaan nyt kaupasta. Päivitys ei nollaa Blacklistiä eikä lukitse jo omaksi siirtynyttä autoa myöhemmän valikoimarajan takia.

Käyttäjän Rockport-karttakuvaa käytettiin alueviitteenä. Kaupan paikka sovitettiin nykyiseen yhtenäiseen tieverkkoon Rosewoodissa: kyseessä ei ole karttakuvan pikselikoordinaateista tehty tarkka alkuperäisen autokaupan paikannus. Hallimalli on erillinen sisätila; sen seiniä ei sijoiteta kaupungin katujen päälle. Hallin pelipaketti on noin 0,42 Mt alkuperäisen GLB:n 6,14 Mt:n sijaan, tekstuurit enintään 256 px. Alkuperäinen ZIP säilyy koskemattomana.

Tarkistukset: 74 testiä läpäisty, mukaan lukien tallennussiirto, oston kertaveloitus, hintojen ja bossirajojen valvonta, palkintojen tasapaino, varsinainen ostokäsittelijä sekä kauppapaikan tiepinta ja auton tila. Kaupan esikatselu, varojen riittävyys ja tallin omistusvalikoima tarkistettu selaimessa. Pelaajan rahoilla ei tehty testiostoksia.

## v0.14.1 — tasaisemmat kisareitit ja AI

Hakuruudukon porrasmainen reitti korvattiin tiepintaa, auton kokoista tilaa ja rakenteiden törmäyksiä vasten tasoitetulla ajolinjalla. Sama reitti ohjaa AI:ta, minikarttaa, checkpointteja ja Blacklist-kisoja. Suuntakulmien kokonaisvaihtelu pieneni reitistä riippuen 76–85 %, ja yli 0,4 radiaanin yksittäiset suunnanvaihdot vähenivät yhteensä 1 496:sta 79:ään. Alku- ja loppupaikat säilyvät; siksakin poistuminen lyhensi sprintit noin 4,6–10,3 kilometriin.

AI katsoo nopeuden mukaan 8–28 metriä eteenpäin ja arvioi tien suunnan 12 metrin jaksolta yhden lyhyen segmentin sijaan. Väistölinjan siirtymä on asteittainen, ja ohituslinjalta paluussa on viive. Autot käyttävät edelleen yhteistä ajofysiikkaa. Minikartan kadut piirretään täytettyinä tiepintoina aiempien harvojen kolmioääriviivojen sijaan.

Uudet ajat tallennetaan omiin reitti- ja bossikohtaisiin ennätyksiinsä. Vanhoja aikoja ei poisteta tallennuksesta eikä verrata muuttuneisiin reitteihin. Rahat, autot, kustomointi ja Blacklist-voitot säilyvät.

`assets/rockport/routes-grid.json` säilyttää hakuruudukon lähdereitit. `tools/smooth-rockport-routes.cjs` muodostaa lopullisen `routes.json`:n; normaali reittien rakennustyökalu kutsuu sitä automaattisesti. `road-line-audit.json` sisältää reittikohtaiset mittaukset. `/tools/race-lines-preview.html` näyttää saman tieosuuden ennen ja jälkeen.

Tarkistukset: 67 testiä läpäisty, mukaan lukien suoraan ajaminen 30/60/120 Hz:llä, tiepinnan rajaama tasoitus, siltojen korkeudet ja kaikkien bossien reitit. Lisäksi jokaisella bossilla enintään 120 sekunnin koeajo oikeassa Rockportin törmäysgeometriassa (maaliin päästyä ajo lopetetaan). Ahtaissa kohdissa esiintyy edelleen osumia ja peruutuspalautumisia; tämä korjaus ei takaa virheetöntä ajamista koko kartalla eikä muuta puuttuvia karttaosia.

## v0.14.0 — Blacklist ja pink slip -autot

Blacklist sisältää nyt 13 bossia alkuperäisillä sijoituksilla ja autoilla. Ronnie (#3) ja Bull (#2) on jätetty käyttäjän pyynnöstä pois, koska niiden malleja ei ollut saatavilla. Ensimmäinen voitto antaa vastustajan auton viritystasoineen talliin sekä kertaluonteisen bossibonuksen. Autoa voi sen jälkeen ajaa ja kustomoida normaalisti. Uusinta ei anna samaa autoa tai bossibonusta uudelleen; tavallinen kisapalkinto maksetaan edelleen.

Järjestys on Sonny → Taz → Vic → Izzy → Big Lou → Baron → Earl → Jewels → Kaze → Ming → Webster → JV → Razor. Razorin varsinainen loppukisa käyttää BMW M3 GTR:ää; toimitettu prologin Mustang avautuu samalla bonusautona. Omistajat ja sijoitukset on tarkistettu [MW 2005:n Blacklist-luettelosta](https://nfs.fandom.com/wiki/Need_for_Speed:_Most_Wanted_(2005)/Blacklist).

Jokaisella on oma 2,6–11 km:n sprinttiosuutensa Rockportin nykyisillä reiteillä. Nämä ovat tämän pelin bossikisoja, eivät alkuperäisen MW:n kisareittien tai moniosaisen uran täsmällisiä kopioita. Vastustajat käyttävät samaa ajofysiikkaa ja auton mitoista muodostettua törmäyslaatikkoa kuin pelaaja. Kartan puuttuvaa osaa ei muutettu tässä päivityksessä.

Kaikki 14 toimitettua mallia on muunnettu pelin tyyliin: yhteensä 178 232 kolmiota alkuperäisen 780 683:n sijaan, enintään 256 px:n palettitekstuurit ja pakatut indeksoidut geometriat. Pelin lataama uusi autopaketti on **5 742 369 tavua (5,74 Mt)** tekstuureineen; lähde-ZIPit yhteensä noin 155 Mt. Lähdemallien omat teippaukset säilyvät, myös niiden mahdolliset erot alkuperäiseen MW:hen. Alkuperäisiä ZIP-tiedostoja ei muuteta.

Vanhat neljän bossin tallennukset siirretään voitettujen bossien nimien perusteella. Raha, autokohtaiset säädöt ja ostetut viritykset säilyvät. Aiemmin voitetut autot avautuvat ilman uutta rahapalkintoa; väliin lisättyjä bosseja ei merkitä automaattisesti voitetuiksi.

Tiedostot ja muunnokset: [assets/blacklist/README.md](assets/blacklist/README.md). Tarkistukset: 63 automaattitestiä ja JavaScript-syntaksit läpäisty; kaikki 14 mallia tarkistettu selaimessa ja Sonny-kisan lähtö koeajettu. Jokaisesta bossista on myös 120 sekunnin fysiikkasimulaatio oikealla autolla ja reitillä (`assets/blacklist/race-audit.json`); se tarkistaa lähdön ja ensimmäiset kilometrit, ei kokonaisen uran läpipeluuta.

## Pelaaminen

Käynnistä `Kaynnista.bat`: se käynnistää paikallisen Node-palvelimen ja avaa pelin selaimeen. Valitse **AJA ROCKPORTIIN**. Rockportin alueiden lataus tarvitsee HTTP-palvelimen; index.html:n avaaminen tiedostona ei käynnistä ajotiloja. Selain tarvitsee WebGL-tuen.

Kehityspalvelin: `node server.cjs`, osoite `http://127.0.0.1:4175/`. Portin voi vaihtaa `PORT`-ympäristömuuttujalla. Selaimen file-, localhost- ja muut porttiosoitteet tallentavat edistymisen erikseen.

WASD/nuolet: ajo. Välilyönti: käsijarru. Shift: nitro. C: kamera. R: palautus. E: talli/tapahtuma. X: speedbreaker. Esc: tauko. H: käynnistä poliisihaaste vapaassa ajossa.

## Uusi talli

Vanha kahdeksan auton valikoima on korvattu näillä käyttäjän toimittamilla malleilla:

- Emery Aventus 1992
- Lamborghini Diablo
- Porsche 911 Carrera 993
- Dodge Charger R/T
- Nissan R390 GT1
- Toyota GT-One
- Nissan GT-R
- Ford Crown Victoria
- Nissan Skyline 1998
- Mazda RX-7

Mallien omat korit ja tekstuuriatlasit säilyvät. Kaikissa on neljä erillistä pyöräryhmää ja kääntyvät etupyörät. Joidenkin lähdemallien valmiiksi käännetyt pyörät on suoristettu. RX-7:n FBX ei sisältänyt käyttökelpoisia tekstuureja ja toi materiaalit mustina: sen oma geometria käyttää uudelleen tehtyä rajattua väripalettia. Crown Victoria toimii myös poliisiautona.

Vanhoja malleja ei ladata eikä tarjota autovalikossa. Vanhat lähdetiedostot ovat projektissa tallessa. Moottoripakettien omistus siirretään vanhan auton vastineelle; rahat ja Blacklist-edistyminen säilyvät. Vanhoja kierrosaikoja ei verrata uusiin säätöluokkiin.

## Virityspaja

**Tuning Shop → Ulkoasu:** alkuperäinen tekstuuri tai lämmin/kylmä/tumma sävy, puhdas/katupöly/kisakuluma, alkuperäiset/teräs-/kilpavanteet ja vanteiden väri. Teippauksia tai yleismallisia korisarjoja ei enää piirretä atlasien päälle.

**Ajettavuus:** katu-, sport-, semi-slick- tai drift-renkaat; lyhyet/tasapainoiset/pitkät välitykset; vakio-/sport-/kilpajarrut; madallus ja camber. Rengasseos vaikuttaa pitoon. Lyhyt välitys parantaa kiihtyvyyttä ja pienentää huippunopeutta; pitkä tekee päinvastoin. Jarrupaketti muuttaa jarrutustehoa. Madallus ja camber ovat visuaalisia.

Katu/Rata/Drift-esiasetukset ja palautus. Asetukset tallentuvat autokohtaisesti. Säätöosat ovat ilmaisia; Stage 1–4 -moottoripaketit ostetaan tallin pelirahalla. Esiasetukset eivät muuta moottoripaketin tasoa. Vakiosuorituskyky perustuu ilmoitettuun vuosimalliin ja varustetasoon. Epävarmat tai fiktiiviset vastineet on merkitty arvioiksi. Viritykset ja nitro ovat pelillisiä.

## Kuva ja pelialueet

- Enintään 800 pikseliä leveä sisäinen kuva, lähimmän pikselin suodatus.
- Enintään 256 px tekstuuriatlasit, ei tekstuurien pehmennystä.
- Kärkipisteiden ruudukkoon napsautus, 5-bittinen väriporras, dithering, kohina, himmeät vaakajuovat ja vinjetti.
- Vahva kellanvihreä värimäärittely sekä likaisemmat betoni-, lattia- ja asfalttipinnat.
- Rockport on ainoa ajettava maailma: vapaa ajo, Central- ja Campus-kisat, aika-ajo, Blacklist ja poliisijahdit.

Tämä on PS1-henkinen tyylittely, ei alkuperäisen konsoliraudan emulointi. Kaikki ajotilat käyttävät Rockportia.

## Toteutus ja muunnokset

`assets/psx-source/` sisältää käyttäjän kymmenen paketin puretut työversiot. Downloads-kansion alkuperäispaketteja ei muuteta. `tools/convert-psx.py` tuo lähdemallit Blender 3.6:n tausta-ajossa (`blender -b --disable-autoexec --python tools/convert-psx.py`) ja kirjoittaa `assets/psx/raw.json`-tiedoston. `node tools/pack-psx.cjs` kokoaa pyöräryhmät, korjaa materiaalit ja tuottaa `assets/psx/cars.js`:n. Lopullinen peli ei tarvitse Blenderiä.

`src/psx-cars.js`: auton rakentaminen ja pyöräanimaatiot. `src/psx-render.js`: retropiirto. `src/core.js`: ajofysiikka ja säädöt. `src/terrain.js`: maaston korkeuskentät. `src/game.js`: pelitilat ja käyttöliittymä.

## Varmistus

`node --test tests/core.test.cjs tests/career.test.cjs tests/psx.test.cjs tests/rockport.test.cjs`

Testit kattavat: kierrokset, ajaminen, ostot, poliisijahti, 22 mallin geometria/UV:t, pyörien pyöriminen, tekstuurisuodatus, säätöjen vaikutukset ja korkeuserot. Selainkokeissa on tarkistettu kaikki kymmenen autoa, asetusten palautuminen ja lyhyet ajokokeet. Kokonaista Blacklist-uraa ei ole pelattu läpi.

Three.js 0.160.1 on paikallisesti `vendor/`-kansiossa lisensseineen. Automallit ovat käyttäjän toimittamista paketeista; tämä projekti ei muuta niiden alkuperäisiä oikeuksia tai lisenssejä.

## Rockport-karttapaketti

Kaikki 13 toimitettua osaa on yhdistetty ja optimoitu. Yhdistetty tiedosto: assets/rockport/rockport-psx.glb. Alueversio, tulokset ja käyttöohjeet: assets/rockport/README.md. Esikatselu: /tools/rockport-preview.html paikallisella palvelimella. Rockport toimii kaikkien ajotilojen karttana.


## Rockportin pelaaminen

AJA ROCKPORTIIN avaa tuodun kaupungin nykyisellä autolla ja tallin säädöillä. WASD/nuolet ajaa, Shift käyttää nitroa, Space on käsijarru, C vaihtaa kameraa, R palauttaa viimeiseen turvalliseen kohtaan. Esc avaa tauon; Aloita uudelleen palauttaa aloituspaikkaan. Tallin vihreän renkaan luona E avaa autotallin. Kahdeksasta löydöstä saa kustakin 250 euroa, ja löydöt tallentuvat erikseen Districtin löydöistä.

Tienpinta, korkeuserot, sillat, seinät ja kaiteet luetaan tuodusta geometriasta. Kamera väistää kiinteitä pintoja. Alueet ladataan etukäteen ja kaukaiset geometriat vapautetaan. Lataamattoman alueen reunalla auto odottaa; oikealta tien reunalta voi pudota painovoimalla; R tai taukovalikon uudelleenaloitus palauttaa tarvittaessa.

Rockport Central (1 289 m) ja Campus (1 373 m) ovat suljettuja kisareittejä. Valitse kolmen kierroksen kilpailu tai yhden kierroksen aika-ajo; Blacklist käyttää samoja reittejä. Portit on ajettava järjestyksessä. R palauttaa viimeiselle portille. Vapaan ajon C/U-merkit aloittavat tapahtuman, S on nopeustutka. Poliisit toimivat vapaassa ajossa: ylinopeus tai H käynnistää takaa-ajon. Poliisit reititetään tieverkkoa pitkin ja törmäystarkistus estää seinien läpi ajamisen. Kilpailuissa poliisijahti on pois käytöstä. Kaupungin kaikkia reittejä ei ole koeajettu. Lähdekartan aukoissa voi yhä olla ajamisen estäviä kohtia.

Fysiikkatiedostot: tools/build-rockport-physics.py, sitten node tools/check-rockport-spawn.cjs. Ne ajetaan kartan uudelleenoptimoinnin jälkeen. src/rockport-physics.js käsittelee pintavalinnan, jatkuvan törmäystarkistuksen ja kameran; src/rockport-world.js hoitaa paikallisen glTF-latauksen ja alueiden elinkaaren.


## v0.8 karttamuutokset

Keltaiset SFX_TRACKBARRIER-nuoliseinät poistettu sekä yhdistetystä GLB:stä että alueista (21 724 kolmiota). Tavalliset liikennemerkit ja ympäristötekstuurit säilyvät. A kääntää vasemmalle ja D oikealle auton takaa katsottuna; etupyörien animaatio seuraa samaa suuntaa.

Uudelleenrakennus optimoinnin jälkeen: `python tools/remove-rockport-race-barriers.py`, `python tools/build-rockport-physics.py`, `node tools/check-rockport-spawn.cjs`, `python tools/build-rockport-navigation.py`, `node tools/build-rockport-routes.cjs`. Reittityökalu tarkistaa molempien reittien jokaisen osuuden oikealla törmäysfysiikalla.


## v0.9 · 22 auton valikoima

Lisätty 12 uutta valittavaa autoa/versiota kolmesta arkistosta. BMW M3 GTS ja Mustang Boss 302 poistettiin käyttäjän pyynnöstä. Blacklist-paketista erotettiin kymmenen kokonaista autoa; sen irrallisia pyöriä ja tie-/rakennusrekvisiittaa ei tuoda autotalliin. Poliisit käyttävät uutta vuoden 2000 P71 Interceptoria.

Autot järjestetään vakion 0–100 km/h -ajan mukaan hitaimmasta nopeimpaan (tasatilanteessa huippunopeus). Aika, vakiohuippunopeus ja valittu vastinemalli näkyvät tallissa. Uusi nopeusmalli saavuttaa määritetyn vakiohuippunopeuden ilman nitroa ja osuu 0–100-tavoitteeseen tasaisella tiellä. Stage 1–4 ja muut säädöt muuttavat suorituskykyä; niiden arvot eivät ole valmistajan testituloksia. Uusille kierrosennätyksille on oma tallennusavain.

Tuonti: `node tools/inspect-new-cars.mjs` ja `python tools/build-extra-cars.py`. Muunnos lukee paikalliset OBJ/FBX/GLB-tiedostot, säilyttää korigeometrian, suoristaa auton suunnan pyörien perusteella, asettaa mittakaavan ja erottaa pyörät animaatiota varten. Tekstuurit ovat enintään 256 px ja käyttävät lähimmän pikselin suodatusta. Alkuperäiset ZIP-tiedostot säilyvät koskemattomina.

Blacklist-OBJ-arkistosta puuttuu viitattu MTL-tiedosto. Atlasit on kohdistettu uudelleen. Panda/AE86:n oma atlas puuttuu: sen kori käyttää geometriapohjaista valkoista/mustaa pintaa ja lasimateriaaleja. Sonny-Golfin atlasin räikeä magenta taitetaan shaderissa tummaksi kulumaksi. Java-Skylinen puuttuva materiaalikohdistus käyttää toisen Skyline-korin yhteensopivaa atlasia kylmällä sävyllä. Muut lähdekuvioinnit säilyvät. Mallien nimissä oleva beta tarkoittaa käyttäjän tuomaa modiversiota, ei valmistajan erikoismallia.

Suorituskykyarvot ja lähtöoletukset: `assets/psx/performance.json` ja `assets/psx/PERFORMANCE.md`. Tuontierittely: `assets/psx/import-audit.json`. Mallien tarkistusruudukko: `/tools/cars-preview.html`. Testit: `node --test tests/*.test.cjs` sisältää myös historiallisia prototyyppitestejä; nykyisen version tarkka testilista on package.json-tiedostossa.


## Maaston korjaus v0.9.1

Rockportin teiden päälle osuneet 28 kaukomaiseman kopiota on poistettu. Varsinaiset tiet, rakennukset ja korkeuserot säilyvät alkuperäisessä mittakaavassa. Jäljelle jääneet panorama-taustat eivät osallistu auton törmäyksiin. Ajopintojen pakkaussaumat, ennakoiva alueiden lataus ja R-palautuksen turvallinen tienpinta on korjattu. Tarkemmat tiedot ja tarkistusraportit: assets/rockport/README.md.


## v0.10 — sprintit, Blacklist ja muurit

Vanhojen kahden pienen kierrosradan tilalla on neljä pisteestä pisteeseen ajettavaa sprinttiä: Rosewood Ridge 8,6 km, Harbour Run 7,5 km, Downtown Descent 4,9 km ja The Last Run 11,0 km. Reittikortit näyttävät varsinaisen ajolinjan. Portit ovat noin 240 m välein; maalin edellä väli voi olla pidempi. Reittiä seurataan jatkuvasti myös porttien välillä, joten suora siirtyminen maaliin ei riitä voittoon. Tavalliset kisat ovat neljän auton sprinttejä; aika-ajossa ajetaan yksin. R palauttaa viimeiselle hyväksytylle portille.

Blacklist: #15 Sonny / Golf GTI, #8 Jewels / Mustang GT, #4 JV / Viper SRT-10, #1 Razor / M3 GTR. Käytössä ovat käyttäjän toimittamat mallit. Nämä neljä autoa sekä tarinaversiot Razor Mustang ja M3 Redfire eivät ole tavallisessa 16 auton valikossa. Vastustajat käyttävät omien autojensa suoritusarvoja ja virityksiä. Blacklist-kisat ovat kaksintaisteluja; voitto avaa seuraavan vastustajan. Uusi eteneminen tallentuu blacklistMW-kenttään erillään vanhoista keksityistä haasteista. Rahat ja ostetut viritykset säilyvät. Jos tallennettu pelaajan auto siirtyi vastustajien joukkoon, käytössä on Skyline omilla aiemmilla virityksillään.

Rosterin tarkistus: [Most Wanted 2005 / Cars](https://nfs.fandom.com/wiki/Need_for_Speed%3A_Most_Wanted_%282005%29/Cars). Razor käyttää loppuvastustajana M3 GTR:ää; Mustang kuuluu pelin alun tarinaan.

Kuvan kaltainen pitkä sprinttimuoto toimii kartan yhtenäisessä ajoverkossa. Harbour Run ei ole kuvan Gray Point–Point Camden -viivan täsmällinen kopio: toimitetun kartan itäisillä teillä on katkoja. Näille katkoille ei ole tehty näkymättömiä oikoteitä.

54 437 tekstuurin läpinäkyvyyden vuoksi pois jäänyttä muuri-, aita- ja kaidekolmiota on palautettu törmäysgeometriaan. Törmäystunnistus alkaa nyt 20 cm korkeudelta, jotta matalien kivimuurien yli ei ajeta. Varsinainen kasvillisuus ei muutu kiinteiksi tekstuuriseiniksi. Tarkistusraportit: assets/rockport/wall-collision-audit.json ja sprint-audit.json. Kaikki uusien sprinttien segmentit on ajettu läpi pelin törmäyslaskennalla.


## v0.11 — MW-henkinen ajotuntuma ja säätöpaja

Pehmennetty näppäimistöohjaus, nopeuden mukana pienenevä kääntö ja kaarteissa hidastuminen. Käsijarru irrottaa pitoa tiukkoihin mutkiin. Vakioautojen suoran tien suorituskykyarvot säilyvät. Tämä on oma arcade-ajomalli, ei MW 2005:n fysiikan kopio.

Ajettavuus-välilehdellä on ohjausvaste, downforce sekä nitron kesto/voima-säätö. Nitro latautuu vain eteenpäin yli 43 km/h ajettaessa ja nopeampi ajo lataa sitä nopeammin. Shift käyttää nitroa. Ulkoasussa voi lisätä matalan tai korkean takasiiven; se on visuaalinen lisä eikä muuta downforce-säätöä. Alkuperäinen siipi voi näkyä lisäsiiven alla. Säädöt tallennetaan autokohtaisesti kuten aiemmin.

Rockportin tunnetut tiekatkot ja v0.10:n karttarajoitukset ovat edelleen voimassa.

Varmistus v0.11: 31 Node-testiä ja package.json:n syntaksitarkistukset läpäisty. Tämän muutoksen selaintarkistus jäi tekemättä: automaatioselain ei saanut yhteyttä paikalliseen 4174-palvelimeen. Ajotuntuma ja lisäsiipien autokohtainen istuvuus tarvitsevat vielä visuaalisen koeajon.


## v0.11.2 — ajomallin ja säätöjen viimeistely

Nitron vapauttaminen tai loppuminen purkaa huippunopeuden ylitystä asteittain. Tyhjällä säiliöllä Shiftin pitäminen pohjassa ei vuorottele latauksen ja lyhyiden boostien välillä: vapauta Shift, odota 0,65 sekunnin latausviive ja aja yli 43 km/h. Jarru ja käsijarru estävät boostin. Nitrovoima suhteutetaan viimeisen polttoaine-erän määrään.

Ajon laskenta käyttää enintään 1/120 sekunnin askelia. Ohjaus, mutkasta palautuminen ja nitro toimivat yhtenäisesti 30/60/120 Hz:n päivityksillä. Downforce muuttaa huippunopeutta ja nopean ajon pitoa; se ei enää vahingossa muuta välityksistä laskettua lähtökiihtyvyyttä.

Lisäsiipien leveys ja kiinnityskorkeus sovitetaan auton korigeometriaan. Siivet seuraavat korin madallusta ja käyttävät PSX-materiaalia. Alkuperäiseen koriin yhdistettyjä siipiä ei poisteta. Tämä geometriaan perustuva sovitus tarvitsee edelleen visuaalisen tarkistuksen jokaisella autolla.

Katu/Rata/Drift-esiasetukset muuttavat vain ajettavuutta, myös uusia ohjaus-, aero- ja nitrosäätöjä. Ulkoasu, madallus, camber ja moottoritaso säilyvät. Vakioasetukset-painike palauttaa koko säätölapun kuten aiemmin. Auton vaihto palauttaa kyseiselle autolle tallennetun moottoritason omistettujen osien rajoissa.

Ennätysavain on nyt v112: ohjausvaste, downforce ja nitrosäätö erotellaan muiden ajosäätöjen lisäksi. Vanhoja aikoja ei poisteta tallennuksesta, mutta niitä ei verrata uuteen ajomalliin. Rahat, moottoriosat ja Blacklist säilyvät.

Varmistus: kaikki 34 testiä sekä package.json:n syntaksitarkistukset läpäisty. Selaimen visuaalista koeajoa ei ole vahvistettu; edellisen version automaatioselain ei tavoittanut paikallista palvelinta.


## v0.12 — JDM-vanteet, spoileripaketti ja stance

Tuning Shop → Ulkoasu: neljä käyttäjän JDM-vannemallia, kymmenen koottua spoileria, Street/Race-etusplitteri ja -sivuhelmat. Spoileripaketin 19 objektista kymmenen on siipiä ja yhdeksän niiden kiinnikesarjoja; ne yhdistetään sijainnin mukaan kokonaisuuksiksi. Alkuperäiset ja aiemmat osavalinnat säilyvät. Korimalliin yhdistettyä alkuperäistä takasiipeä ei leikata pois: lisäsiipi voi näkyä sen kanssa yhtä aikaa.

Camber säätyy −10°…0° ja pyörän yläreuna kallistuu sisään kummallakin puolella. Vanhat positiivisina tallennetut camber-arvot muunnetaan saman suuruisiksi negatiivisiksi. Pyörien ulostulo on 0–0,18 m per puoli: koko pyörä, myös rengas, liikkuu ulospäin. Vanteet säilyttävät auton rengaskoon, pyörivät ja etupyörät kääntyvät. Nämä ulkoasusäädöt eivät muuta ajofysiikkaa tai törmäysleveyttä.

JDM-vanteet korvaavat alkuperäisen pyörägeometrian, joten päällekkäisiä renkaita ei piirretä. Vanteet pienennetään alkuperäisestä 29 248–55 658 kolmiosta 2 337–2 769 kolmioon kappaleelta. Tekstuurit ovat enintään 128 × 128 ja 32 väriä, lähimmän pikselin suodatuksella. Yksinkertaistetut normaalit ja PSX-materiaali sovittavat osat pelin tyyliin. Spoilerit käyttävät alkuperäisen paketin kevyttä geometriaa: 102–656 kolmiota kokonaisuutta kohti. Pelin osageometria on noin 1,1 MB ja tekstuurit yhteensä noin 70 kB.

Tiedostot: assets/custom/parts.js, assets/custom/textures ja assets/custom/import-audit.json. Lähdepakettien kopiot ovat assets/custom-source-kansiossa; Downloads-kansion ZIP-tiedostoja ei muuteta. Uudelleenmuunnos: node tools/build-custom-parts.mjs ja Python/Pillow-ympäristössä python tools/pack-custom-textures.py. Vanteiden erillinen tarkistusnäkymä: /tools/custom-parts-preview.html.

Tallin kustomointiin on lisätty Etu/Sivu/Taka-kamerat. Kapeassa chat-paneelissa auto sijoittuu säätövalikon yläpuolelle ja takanäkymän kamera pysyy tallin seinän sisäpuolella.

Varmistus: 35 testiä sekä syntaksitarkistukset läpäisty. Testit rakentavat uudet vanteet ja spoilerit kaikille 22 lähdeautolle, tarkistavat camberin suunnan, pyörän ulostulon ja alkuperäisten pyörien korvaamisen. Selain: neljän vanteen tarkistusnäkymä, Skylinen osavalinnat, etu-/takanäkymä sekä asetusten säilyminen sivun latauksessa tarkistettu. Kaikkia osayhdistelmiä ei ole visuaalisesti tarkistettu jokaisella autolla. Rockportin tiegeometriaa ei muuteta tässä versiossa.


## v0.13 — korin hitbox, hypyt ja yhteinen AI-fysiikka

Kaikilla aktiivisen Rockport-pelin autoilla on lähdekorin mitoista laskettu laatikkohitbox. Se kääntyy auton mukana ja kallistuu tien kaltevuuteen. Puskuri, kyljet ja kulmat tarkistetaan pyyhkäisyllä seinäkolmioita vasten myös kovassa vauhdissa. Autojen keskinäisissä osumissa käytetään käännettyjä laatikoita, korkeuseroa ja liikesuunnan impulssia; autot eivät enää vain hidasta toisiaan etäisyysrajan perusteella. Hitbox on yksinkertaistettu korilaatikko, ei jokaisen koripaneelin tai aero-osan erillinen törmäysmalli.

Rampin tai mäen harjan vauhti voi irrottaa auton maasta. Auto säilyttää vaakanopeuden, saa rampilta pystynopeutta ja putoaa painovoimalla 9,81 m/s². Nokka seuraa lentokaarta. Ilmassa kaasu, nitro, jarru ja ohjaus eivät muuta auton lentorataa. Alastulossa palataan saavutetulle tienpinnalle ja isku vaimentaa vauhtia. Sillan alempi taso ei vedä autoa ylemmälle kannelle. Kamera seuraa auton todellista korkeutta. Hyppynappia ei ole: hyppy syntyy pinnasta ja vauhdista; Space on edelleen käsijarru.

Lataamaton törmäysalue pysäyttää simulaation kyseisen auton kohdalla; oikea geometriakatko tai tien reuna sallii putoamisen. R palauttaa edelleen viimeiselle portille tai turvalliselle tielle. Koko kartan alapuolelle (Y < −500 m) pudonnut auto palautetaan automaattisesti. Pelialueen pienin lähdekorkeus on noin −228 m. Kartan tunnettuja katkoksia ei ole täytetty tai muutettu uusiksi reiteiksi tässä versiossa.

Pelaaja, kilpailijat ja poliisit käyttävät samaa src/vehicle-physics.js-moduulia ja src/core.js-ajomallia: kaasua, jarruja, pitoa, ohjausta, painovoimaa ja koritörmäyksiä. Autokohtaiset suoritusarvot ja moottoritasot säilyvät. AI tuottaa ohjaussyötteitä reitin perusteella: ennakoi mutkia ja jarrutusmatkaa, etsii korilaatikolle vapaata ajolinjaa ja yrittää peruuttaa irti juuttuessaan. Autoja ei siirretä reittinäytteestä toiseen eikä niille anneta seinien läpi ajavaa nopeusmallia. Kilpailijoiden on läpäistävä samat järjestetyt portit ja reitin etenemistarkistus. Myös kaukana pelaajasta oleville kilpailijoille ladataan oma karttanaapurusto. Poliisin kiinniotto huomioi korkeuseron.

Fysiikka lasketaan enintään 1/120 sekunnin askelilla. Tämä on yksinkertaistettu arcade-chassis, jossa ei ole täyttä kaatumis-/rengasjousitussimulaatiota. Nykyiset autot, kustomointi, lompakko ja Blacklist säilyvät. Ennätysten avain on v13, joten vanhoja aikoja ei verrata uuteen ajomalliin.

Varmistus: 44 testiä ja syntaksitarkistukset. Uudet testit kattavat puskurin/kyljen/kääntyvän kulman, matalat seinät, autojen välisen nopean osuman, rampilta lentämisen ja alastulon, putoamisen, siltojen tasot, katon alapuolisen osuman, R-palautuksen tilan sekä 30/60/120 Hz:n yhdenmukaisuuden. Selainkokeessa kilpailun lähtö, pelaajan ajo ja poliisijahdin käynnistyminen tarkistettu. Työkalu node tools/audit-vehicle-physics.cjs ajaa yhden auton 120 simuloitua sekuntia jokaisella sprintillä; tulokset ovat assets/rockport/vehicle-physics-audit.json. Se eteni noin 1,4–2,0 km per reitti. The Last Run -otoksessa tuli osumia, joista AI pääsi jatkamaan. Tämä ei varmista kaikkien pitkien sprinttien maaliinajoa tai kaikkia tieverkon kohtia.


## v0.13.1 — reunakivet ja liukuvat osumat

Seinäosuma poistaa vain seinää kohti osoittavan nopeuskomponentin. Seinästä poispäin menevä liike säilyy, ja seinän suuntainen jäljellä oleva liike ajetaan saman fysiikka-askeleen aikana pienellä hankauskitkalla. Kylkikosketuksen jälkeen auto voi rauhoittua seinän suuntaan ohjausta vastustamatta. Suorassa nokkaosumassa liike pysähtyy edelleen. Pienessä nopeudessa kaasu ja vahva ohjaus auttavat kääntämään nokan irti seinästä. Autojen kylkiosumat säilyttävät yhteisen eteenpäin suuntautuvan liikemäärän; vain osuman lisäämä siirtymä tarkistetaan uudestaan ympäristöä vasten.

Enintään 26 cm:n reunakivi voidaan ylittää, kun sen päällä on ajettava pinta ja koko korilaatikolle on tilaa korotuksen jälkeen. Korin tukipisteet huomioivat jalkakäytävän yläpinnan. Yksittäisiä matalia seinäkolmioita ei poisteta: 35 cm:n kivimuuri ja matala seinä ilman ajettavaa yläpintaa säilyvät esteinä. Kartan törmäysgeometriaa ei muutettu. Hypyt, painovoima ja lataamattoman alueen suojaus säilyvät.

Pelaaja, kilpailijat ja poliisit käyttävät samaa korjattua vastetta. AI mittaa juuttumista todellisesta siirtymästä; nopeusmittarin lukema ei yksin riitä. Väistölinjaa pidetään esteen ohituksen ajan. Ennätysten avain on v131, vanhat ajat säilyvät tallennuksessa erillään.

Käyttäjän 5b4eef-UndercoverMWPhysics_nfsmods.zip sisältää 95 tavun readme.txt-tiedoston, joka linkittää [UndercoverMWPhysics-projektiin](https://github.com/gaycoderprincess/UndercoverMWPhysics). Viitteenä tutkittiin [SuspensionRacer.cpp](https://github.com/gaycoderprincess/UndercoverMWPhysics/blob/main/decomp/behaviors/SuspensionRacer.cpp)-tiedoston OnCollision- ja DoWallSteer-kohtia. Sen seinäkontaktin ohjausavustus toimi periaatteellisena viitteenä omalle JavaScript-toteutukselle. Pelin törmäysratkaisu, reunakiven ylitys ja liukuminen on toteutettu tämän projektin korilaatikolle; alkuperäisen modin binäärejä ei tarvita.

Varmistus: 50 testiä sekä syntaksitarkistukset. Uudet tapaukset kattavat kylkiliukumisen ja vauhdin säilymisen, molempiin suuntiin piirretyt seinät, irtoamisen pienestä päällekkäisyydestä, 15/25 cm:n reunakivet, 35 cm:n muurin, ajettavan yläpinnan vaatimuksen, nokan kääntämisen irti sekä autojen välisen kylkiosuman. Rockportin 120 sekunnin reittikoe päivitettiin käyttämään pelin RX-7:n todellisia, viiteen desimaaliin pyöristettyjä korimittoja; tulokset: assets/rockport/vehicle-physics-audit.json. Reittikoe on rajattu otos, ei kaikkien pitkien sprinttien maaliinajon varmistus.

Selainvarmistus v0.13.1: GT-One ajoi aloitusalueen jalkakäytävälle ja jatkoi kylkikosketuksesta 26 km/h. Kaasu ja oikealle ohjaus irrottivat auton takaisin kadulle (32 km/h). Suora osuma rakennukseen pysäytti auton. Tallin rahat säilyivät 15 883 eurossa. Tämä on paikallinen ajokoe, ei kaikkien Rockportin reunakivien tarkistus.

## v0.13.2 — pyöräkontaktit ja putoamisen korjaus

Neljä pyöräanturia korvaa pelkän keskipisteen varaan jääneen tuennan. Keskipisteen puuttuva kolmio, pieni poikittainen sauma tai kahdella pyörällä ajettu tien reuna ei yksin pudota autoa. Tukitaso, mäki ja kallistus lasketaan kontaktipinnoista; myös alastulo käyttää pyöräkontakteja. Jousituksen ulosjouston yksinkertaistus estää pienten pinnan muutosten muuttumisen välittömästi lennoksi. Spatial bin -rajan saumavara tarkistaa nyt tarvittaessa myös viereisen ruudun.

MW-modin lähdekoodin pohjalta tutkittu hyppyavustus lisää ilmassa 3 m/s² alaspäin suuntautuvaa kiihtyvyyttä ja tietyin ehdoin lisää laskuavustusta. Auto oikenee pehmeästi alastulopinnan suuntaan. Oikeat rampit, putoaminen, sillan eri tasot, kylkiliukuminen ja reunakiven ylitys säilyvät. Pelaaja, kilpailijat ja poliisit käyttävät samaa toteutusta.

Puuttuvaan karttakohtaan pudonnut auto palautetaan nopeammin: yli 1,5 s ilmassa, yli 12 m tukitason alapuolella ja ilman alastulopintaa seuraavaan 60 metriin. Turvallinen paikka tallennetaan vain neljän pyörän tuella. Palautus ei anna kisaportteja tai palkintoja. Ennätysten uusi avain on v132; autot, kustomointi, rahat ja Blacklist säilyvät.

58 testiä ja syntaksitarkistukset. Oikean Downtownin saumakohdan testissä kaikki neljä pyörää pysyvät tuettuina, vaikka keskipisteen alla ei ole kolmiota. 39 810 staattisen reitti-/reunanäytteen kartoitus löysi 108 vastaavaa pyörien pelastamaa tukitapausta. Neljän sprintin 120 sekunnin AI-otokset etenivät 1,45–1,99 km ilman putoamista tai palautusta. Reunojen tuettomia näytteitä on yhä; koko karttaa tai kaikkia sprinttejä ei ole ajettu läpi.

Selain: GT-One ajoi aloituskadun reunakivelle ja pysyi jalkakäytävällä myös aidan kylkikosketuksessa (21–24 km/h). Rahat säilyivät 17 020 eurossa. Kartan geometriaa ei muutettu.

Tämä ei ole koko MW-ajomallin 1:1-portti. Tutkimus, ensisijaiset lähteet, sovelletut kohdat ja puuttuvat osat: [docs/mw-handling-research.md](docs/mw-handling-research.md). ZIPin linkittämä modi käyttää edelleen alkuperäisen pelin törmäysmoottoria; se ei itsessään sisällä korjausta tuodun Rockport-mallin aukkoihin.

## v0.13.3 — lähempänä pysyvä kamera ja selkeämpi kuva

Kamera kulkee nyt auton vaakasuuntaisen siirtymän mukana. Pehmennys koskee edelleen käännöksiä, korkeutta ja kameratilojen vaihtoa. Suoraan kiihdyttäessä seuraamisviive ei enää kasvata kameraetäisyyttä nopeuden mukana. Lähikameran tavoite-etäisyys on edelleen 7 m ja kaukokameran 15 m. Nopeuden FOV-lisä on enintään 2 astetta, nitron lisä 3 astetta (aiemmin nitro 9 astetta). Seinien kameratörmäykset säilyvät.

Sisäisen kuvan leveys nostettiin 50 prosentista 62,5 prosenttiin näkymän leveydestä ja enimmäisleveys 640:stä 800 pikseliin. Leveys on noin 25 % suurempi ja piirrettävä pikselimäärä noin 56 % suurempi. Kärkipisteiden ruudukko on hienompi (400 × 300), ja ditheringiä sekä kohinaa on kevennetty hieman. Kellanvihreä suodin, 5-bittinen väriporras ja tekstuurien pikselisuodatus säilyvät.

Varmistus: syntaksitarkistukset sekä nykyistä kamerafunktiota ajava kiihtyvyyskoe 0–110 m/s: suoralla seuraamisetäisyys pysyi 7 metrissä ja nitron FOV enintään 65 asteessa. Piirtoputken resize tarkistettiin mobiili-, chat- ja työpöytäkoossa. Ajofysiikkaa ei muutettu.

## v0.13.4 — liian suuret puut ja vuoritaustat pois

Kartasta poistetaan 306 nimettyä lähdekohdetta: 32 suurta maisemakopiota ja 274 yli 45 m korkeaa koristepuumallia / puuryhmää. Tavalliset katupuut, yksityiskohtainen maasto, rakennukset ja ajotiet säilyvät. Kaupunkia tai autoja ei skaalata. Poisto tehdään ennen kartan optimointia ja törmäyspintojen muodostusta, joten poistettujen kohteiden omia näkymättömiä esteitä ei jätetä.

Lähteet ja mitat: assets/rockport/scenery-audit.json. Pysyvä poistolista: assets/rockport/scene-fixes.json → excludedScenery. Viimeksi korjattu kamera, kuvan tarkkuus, ajomalli, autot ja kustomointi säilyvät. Kartan reunoilla voi näkyä aiempaa avoimempaa kaukomaisemaa. Tämä ei täytä tieverkon tunnettuja puuttuvia alueita.

Varmistus v0.13.4: 58 testiä ja syntaksitarkistukset läpäisty. GLB ja kaikki 485 aluetta validoitu; 13 lähdeosan säilytetty geometria läpäisi otosvertailun. Ajotiekolmioiden määrä säilyi 127 782:ssa ja aloituspaikka/löydöt ennallaan. Neljän sprintin 120 sekunnin AI-otoksissa ei putoamisia eikä palautuksia. Tarkemmat tulokset: assets/rockport/scenery-validation.json.

### Poliisit ja tiesulut

Poliisien lähitakaa-ajossa on ennakoiva kohdistus ja eri lähestymislinjoja. Tuetuille oikoreiteille voidaan seurata suoraan, mutta seinät ja tienpinnan korkeus tarkistetaan edelleen. Piilossa olevaa pelaajaa etsitään viimeisestä tunnetusta paikasta.

Heat 2:sta alkaen poliisit voivat muodostaa tiesulkuja 200–420 metrin päähän eteen. Sulut vaativat ladatun, yhdistetyn ja riittävän leveän tien; vapaan aukon on oltava vähintään 3,5 metriä. Sulun autot käyttävät normaalia autofysiikkaa ja kartiot rikkoutuvien esineiden järjestelmää. Enintään kaksi sulkua säilyy kerrallaan; ne poistetaan ajan, etäisyyden, alueen poistumisen tai takaa-ajon päättymisen perusteella. Sulku näkyy mittaristossa ja pienoiskartalla.

Käynnistin käyttää samaa osoitetta kuin kehityspalvelin: `http://127.0.0.1:4175/`. Avaa `Kaynnista.bat` käynnistääksesi palvelimen uudelleen. Mahdolliset palvelinvirheet kirjautuvat tiedostoon `tmp/launcher-server.log`.

### Levikkeiden sovitus ja sivuhelmojen leveys

Lokasuojan levikkeen ulompi kiinnitysreuna seuraa koripintaa. Vanteen ulostulo leventää renkaan puoleista huulta, eikä nosta kiinnitysreunaa irti korista.

Sivuhelmojen X-siirto on yhteinen leveyssäätö: positiivinen arvo siirtää molempia ulospäin ja negatiivinen sisäänpäin. Myös hiirellä vetäminen toimii kummaltakin auton puolelta. Y- ja Z-siirrot säilyvät yhteisinä korkeus- ja pituussäätöinä.

Lokasuojan levikkeillä on sama symmetrinen X-leveyssäätö kuin sivuhelmoilla: + vie molemmat puolet ulos ja − sisään. Säätö vaikuttaa kaikkiin neljään levikkeeseen. Levikkeen perussovitus hakee koripinnan jokaisen pyörän ympäriltä erikseen ja huomioi renkaan koon. Korin aukkojen läpi osuvaa vastakkaista kylkeä ei käytetä kiinnityspintana.

Hyundai Tiburonin levikkeiden korjaus: kiinnitysreunan alkuperäinen kuoripaksuus säilytetään. Sovitus pitää kaaren korkeus- ja pituuskoordinaatit vakaina ja sovittaa leveyden korin ulkopintaan. Tiburonin molempien levikemallien ulkopintojen pysyminen korin ulkopuolella tarkistetaan oikeita korikolmioita vasten sekä vakio- että enimmäisulostulolla.

### Uudet vanteet ja yhteinen rengas

Vannevalikossa ovat JDM 1–4 sekä käyttäjän toimittamat Wheel Draft, WORK Zistance W5S, ADVAN Racing ONI II ja WORK VS-XX. Uudet neljä vannetta käyttävät samaa tire.zip-paketin rengasmallia, jonka kulutuspinta ja kylkitekstuuri säilyvät erillisinä materiaaleina. Sport-, teräs- ja vanhat kilpavannevalinnat on poistettu; vanhat valinnat vaihtuvat JDM 1:een auton muut säädöt säilyttäen. Tehdasvanteet säilyvät auton alkuperäisessä mallissa ja palautuvat auton vakioasetuksilla.

Tuonti: lähteet ovat `assets/custom-source/new-wheels/`-kansiossa. `tools/pack-new-wheel-textures.py` pienentää tekstuurit, `tools/export-new-wheels.py` muuntaa lähteet Blenderin tausta-ajossa automaattiset lähdeskriptit estettyinä, ja `node tools/pack-new-wheels.cjs` pakkaa ne runtimeen. Ladattava `assets/custom/new-wheels.js` on noin 211 kt ja sisältää yhteisen renkaan vain kerran. Mallikohtaiset kolmiomäärät ovat `assets/custom/new-wheels-audit.json`-tiedostossa. Vanteiden tarkastelu: `http://127.0.0.1:4175/tools/wheel-check.html`.

### Vapaat kori- ja vannevärit

Tuning Shopin Ulkoasu-välilehdellä korille ja vaihtovanteille voi valita oman RGB-värin värivalitsimella tai HEX-koodilla. HEX-kenttä hyväksyy esimerkiksi `#ff8800` ja lyhyen `#f80`-muodon. Vanteen oman värin valitseminen ottaa käyttöön Oma väri -tilan. Renkaan kulutuspinta ja kylki säilyvät alkuperäisinä. ↺ palauttaa alkuperäisen värityksen, ja valinnat tallentuvat autokohtaisesti. Vannevärin säätö aktivoituu vaihtovanteen valitsemisen jälkeen.

### Tuning Garage

Rosewood Tuning Garagella on oma T-karttamerkki, violetti sisäänkäyntirengas ja kyltti nosto-ovien edustan pihassa osoitteessa X 1330 / Z −2815. Tavallisen autotallin ETSI TUNING GARAGE -painike näyttää sen kartalla. Pikasiirtyminen ja ajoreitti päättyvät turvalliseen lähestymiskohtaan kadulla; aja siitä pihaan ympyrään ja paina E. G-merkkien tavalliset tallit säilyvät erillisinä. Kustomointi sisältää ulkoasun, värit, vanteet ja korinosat. Tuning sisältää ajosäädöt sekä rahalla ostettavat moottoripaketit. Osioiden palautukset ovat erilliset: ulkoasun palautus ei muuta ajosäätöjä tai ostettuja paketteja.

Talli ladataan ensimmäisellä avauksella ja säilytetään myöhempiä avauksia varten. Sulkeminen palauttaa auton pajan edustalle vapaaseen ajoon, ja tehdyt muutokset otetaan heti ajoautoon. Autopaikka on takaosan ovien ja portaiden lähellä, poikittain käyttäjän merkitsemällä lattia-alueella. Hiirellä siirtämisen akselit seuraavat auton asentoa. Malli, tekstuurit ja valmiit viritykset sisältyvät myös offline-paketin riippuvuuksiin.
