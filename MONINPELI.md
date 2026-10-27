# Pelaa kavereiden kanssa

1. Käynnistä **Moninpeli.bat**. Se käynnistää pelin ja avaa tilapäisen tunnl.gg-nettilinkin. Osoite löytyy myös tiedostosta `Moninpelilinkki.txt`.
2. Avaa pelin **MONINPELI**, kirjoita nimimerkki ja paina **LUO HUONE**.
3. Paina **KOPIOI KUTSULINKKI** ja lähetä linkki kavereille. He avaavat linkin selaimessa, hyväksyvät tarvittaessa **Continue to site** -sivun ja kirjoittavat nimensä ja painavat **LIITY**.
4. Jokainen painaa **AJA KAVEREIDEN KANSSA**. Kaikki aloittavat Rosewoodista. Huoneeseen mahtuu 8 pelaajaa.

Isäntä voi käyttää vanhaa `http://127.0.0.1:4175/`-osoitetta: sen nykyiset autot ja tallennukset säilyvät käytössä. Nettilinkistä pelaavien tallennukset ovat kyseisen selaimen ja osoitteen omia. Kaverit tarvitsevat vain nykyaikaisen WebGL-selaimen; kartan ensimmäinen lataus netistä voi kestää.

Tämä ensimmäinen versio jakaa vapaan ajon, sijainnit, nimimerkit ja auton ulkoasun. Pelaajien autot kulkevat toistensa läpi. Tavalliset soolokisat, poliisit, siviililiikenne, rikkoutuvat esineet ja eteneminen toimivat pelaajakohtaisesti. Peliä ei tarvitse pysäyttää kaverin mennessä talliin tai tauolle. Huoneen koodi toimii kutsuna, joten jaa linkki kavereille.

Pidä isännän kone, pelipalvelin ja tunneli käynnissä. **Sulje moninpeli.bat** lopettaa nettijaon. Uudelleen käynnistetty tunneli saa uuden osoitteen; kopioi silloin uusi kutsulinkki. Ilmainen tunnl.gg-tunneli kestää enintään 24 tuntia, sulkeutuu kahden tunnin käyttämättömyyden jälkeen ja sallii 5 Gt liikennettä päivässä. Lisätietoja: https://tunnl.gg/docs

Huoneet ovat vain palvelimen muistissa. Sivun päivitys säilyttää huoneistunnon samassa välilehdessä. Yli 90 sekunnin yhteyskatko tai palvelimen uudelleenkäynnistys vaatii liittymisen uudelleen. Huoneessa ei ole keskustelua eikä pysyvää moninpelitulostaulukkoa.


## Kisa kaveria vastaan

Ajakaa molemmat vapaaseen ajoon alle 60 metrin päähän toisistanne samalle tien tasolle. Avaa **KAVERIT**, valitse vastustaja ja paina **HAASTA KISAAN**. Vastustaja hyväksyy ruudulle ilmestyvän haasteen. Huoneessa voi olla yksi kahden pelaajan kisa kerrallaan.

Peli arpoo saavutettavan maalipaikan noin 450–1900 metrin päähän. Molemmat odottavat viiden sekunnin yhteisen lähtölaskennan. Maali näkyy M-merkkinä minikartalla, isolla kartalla ja kultaisena kehänä maailmassa. Voit ajaa mitä tahansa reittiä: välipisteitä tai pakollista ajolinjaa ei ole. Ensimmäisenä maalialueelle samalla tien tasolla saapuva voittaa. Palvelin vahvistaa molemmille saman tuloksen lyhyen verkkoviiveen tasauksen jälkeen.

Kisan aikana pikasiirtyminen, R-palautus ja muiden kisojen käynnistys ovat lukossa. **KESKEYTÄ** lopettaa kisan; talliin palaaminen, poistuminen huoneesta tai pitkä yhteyskatko keskeyttää sen myös. Tuloksen sulkemisen jälkeen voitte haastaa uudelleen. Voitot eivät muuta uran rahoja tai soolokisojen etenemistä.
