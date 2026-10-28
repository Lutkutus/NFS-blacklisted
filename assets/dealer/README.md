# Rosewood Motors — v0.16.0

Käyttäjän `nfs-edge-mobile-garage (2).zip` sisältää NFS Edge -autotallin GLB-mallin ja kuusi tekstuuria. Näyttelyhalli käyttää tätä oikeaa lähdegeometriaa, ei uudelleen rakennettua korviketta. Omat autot ja aiempi virityspaja käyttävät edelleen nykyistä tallia.

## Valikoima

| Auto | Hinta | Vaaditut Blacklist-voitot |
|---|---:|---:|
| Ford Crown Victoria | 16 000 € / aloitusauto ilmaiseksi | 0 |
| Datsun Fairlady Z / 280Z | 20 000 € | 0 |
| Hyundai Tiburon V6 | 22 000 € | 0 |
| Sannis Livisa 180RS | 28 000 € | 0 |
| Plymouth Road Runner 1971 | 32 000 € | 1 |
| Dodge Charger R/T | 34 000 € | 1 |
| Nissan Skyline GT-T | 48 000 € | 2 |
| Emery Aventus | 50 000 € | 2 |
| Toyota Supra 1998 | 68 000 € | 3 |
| Mazdaspeed RX-7 A-Spec | 72 000 € | 4 |
| BMW M5 E39 | 82 000 € | 4 |
| Porsche 993 | 88 000 € | 5 |
| Nissan GT-R | 125 000 € | 7 |
| Resonanso A40 | 145 000 € | 7 |
| Lamborghini Diablo | 165 000 € | 8 |
| Porsche Carrera GT | 195 000 € | 9 |
| Nissan R390 GT1 | 215 000 € | 10 |
| Toyota GT-One | 285 000 € | 12 |

Bossiautoja ei myydä. Ensimmäinen voitto antaa niiden pink slip -omistuksen normaalisti. Auton ostaminen ei varusta sitä automaattisesti eikä osta virityksiä. **VALITSE JA PALAA TALLIIN** ottaa omistetun auton käyttöön ja palauttaa sen aiemmat säädöt; uuden auton moottoritaso on vakio.

AE86, Mian RX-8, Interceptor sekä Beta Blue ja Java on poistettu pelaajan valikoimasta v0.15.1:ssä. Niitä ei voi valita vanhasta omistuksesta eikä ostaa uudelleen. Interceptor säilyy NPC-poliisiautona. Tallennuksessa säilyvät vanhat säädöt ja ostetut viritykset, vaikka nämä autot ovat pois valikoimasta.

`src/dealership.js` on hintojen, omistuksen, siirtymän ja kisapalkintojen lähde. Vakioauton hinta ei riipu sen vanhoista tallennetuista kosmeettisista säädöistä. Omistus ja rahat tallennetaan samaan `blackline-v1`-tallennukseen; moottoripakettien omistus ja bossivoitot säilyvät.

## Sijainti ja malli

`location.json` määrittelee sisäänkäynnin Rosewoodin nykyisen reitin 480 metrin kohdalla, noin x=841, z=-2264. Se on käyttäjän karttakuvan Rosewood-alueen perusteella valittu ja nykyiseen ajettavaan tieverkkoon sovitettu paikka. Kuvaa ei käsitellä tarkkana maailmankoordinaatistona.

Sisäänkäynti on tarkistettu oikeasta törmäysgeometriasta: tiepinta löytyy ja 2,2 × 5 metrin törmäyslaatikko mahtuu paikalle. Maailmassa näkyy opaste ja asiointirengas; halli avautuu erillisenä sisätilana, joten rakennus ei tuki nykyisiä katuja. Kauppa pysäyttää ajosimulaation asioinnin ajaksi. Sulkeminen palauttaa saman auton ja ajotilanteen; auton käyttöön ottaminen palauttaa talliin.

Työlähde on `assets/dealer-source/source/garage.glb`. Muunnoksen voi toistaa projektin juuresta komennolla `python tools/pack-dealer.py` (Python, NumPy ja Pillow). Alkuperäisen GLB:n paikat ja UV:t pakataan 16-bittisiksi paikallisilla skaaloilla. Piilottamiseen tarkoitettu occluder-verkko ja godray-apuverkko jätetään pois näkyvästä hallista. Kolmioita jää 14 838. Tekstuurit ovat enintään 256 px, 96 värin PNG-kuvia ja käyttävät lähimmän pikselin suodatusta. Normaalit lasketaan paikallisesti.

`showroom.json`, `showroom.bin` ja `textures/` vievät yhteensä 419 838 tavua; lähde-GLB 6 142 704 tavua. `src/dealer-showroom.js` lataa hallin vasta kauppaa avatessa ja säilyttää sen muistissa seuraavia käyntejä varten. Kamera pysyy hallin etuosan sisällä myös pitkän katselun ajan.
