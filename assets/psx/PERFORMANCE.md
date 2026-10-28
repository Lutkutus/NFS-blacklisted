# Performance references and limits

Power is metric PS (Finnish UI: HV); 444 SAE bhp becomes about 450 PS. Top speed is km/h, acceleration is 0–100 km/h, not 0–60 mph. Stock means Stage 0, street tires, balanced gearing, level ground and no nitro. Garage ordering uses descending stock 0–100 times, then ascending top speed. It does not imply a real-world race ranking.

The simulation uses a calibrated acceleration curve, not a full engine/gearbox/tire simulation. Listed acceleration targets are reproduced within 0.09 seconds at 30/60/120 Hz; top speeds within 0.3 km/h after a 180-second straight-line run. Uphill roads and braking naturally change the result. Upgrades and nitro are fictional game tuning.

## Sourced baselines

- Golf GTI Mk5: 200 PS / 235 km/h: https://www.volkswagen-newsroom.com/en/golf-5-20032008-19480 . Manual 0–100 7.2 s: https://www.mynewsdesk.com/se/volkswagen/pressreleases/nya-golf-gti-tillbaka-till-roetterna-51154
- Porsche 993: early 272 PS Carrera, 5.6 seconds / 270 km/h: https://newsroom.porsche.com/en/press-kits/60-Years-Porsche-911/30-Jahre-911-Carrera-der-Generation-993-%E2%80%93-Der-letzte-seiner-Art.html
- Diablo: original 492 PS 5.7 baseline: https://www.lamborghini.com/en-en/history/diablo ; published 325 km/h: https://www.lambocars.com/diablo-specs-performance . Acceleration target 4.5 s varies by test.
- Police Interceptor: the supplied model is a 2000 P71: https://sketchfab.com/3d-models/police-interceptor-nfs-hot-pursuit-2-8cdde07c700c43bfba944d0186d563ac . Government test: https://nij.ojp.gov/library/publications/michigan-state-police-tests-2000-patrol-vehicles . Test transcription https://badgesandchrome.com/michigan-police-car-tests/ford-police-vehicles/ gives 129 mph and 8.75 s to 60 mph. The 208 km/h target is rounded; 9.3 s to 100 km/h is estimated. The existing civilian Crown uses a separate estimated LX baseline.
- M3 GTR: use the road homologation car, NOT fictional NFS race-car power: https://www.bmw-m.com/en/topics/magazine-article-pool/bmw-m3-gtr-strassenversion.html . 350 PS, 295 km/h baseline; 4.7 s target is estimated. Both liveries share the baseline.
- Viper: 2005 SRT-10 500 bhp: https://www.cars.com/research/dodge-viper-2005/specs/ ; published performance context: https://stage.theviperstore.com/Information_Viper_2003-2006_Page_2.htm . 306 km/h and 4.0-second targets approximate published performance; JV paint does not claim a real tuned specification.
- RX-8: European 231 PS six-speed baseline, 235 km/h / 6.4 s: https://en.wikipedia.org/wiki/Mazda_RX-8 . Mia is the supplied mod livery.
- Sannis is fictional; use a 205 PS SR20DET 180SX analogue, JDM 180 km/h limiter, estimated 7.5 s: https://nightrunnersgame.fandom.com/wiki/Sannis_Livisa_180RS ; https://en.wikipedia.org/wiki/Nissan_180SX . Not a claim that Sannis is a real manufacturer.
- Skyline versions: the main 1998 model uses an explicitly selected GT-T baseline; the two Java variants use a GT-R analogue. JDM 180 km/h limit retained; acceleration is estimated. Nissan period engine context: https://www.nissan-global.com/JP/DOCUMENT/PDF/IREVENT/PRESEN/2006/061205-1125-ohsawa.pdf
- AE86: Japanese 130 PS analogue (European version differs), estimated 195 km/h / 8.9 s: https://en.wikipedia.org/wiki/Toyota_AE86 . Model is a modded Panda body; its missing atlas is reconstructed from face materials.

## Other existing cars / explicit assumptions

Emery Aventus is fictional (240 km/h / 5.8 s estimated). Charger uses a 1969 440 R/T analogue (375 gross hp as historical rating; 220 km/h / 6.2 s estimated and gearing dependent). RX-7 uses an early export FD analogue (255 PS, 250 km/h / 5.3 s published approximation). R35 uses a 2008 480 PS export baseline (310 km/h / 3.6 s published approximation). R390 road-car 354 km/h / 3.9 s figures are estimates, not manufacturer-certified tests; Toyota GT-One 380 km/h / 3.2 s is a race-gearing estimate. These are labelled in the garage. The Razor and Jewels Mustangs use an estimated stock 2005 GT baseline (304 PS, 240 km/h / 5.3 s), not invented Blacklist upgrade specifications.

Different trims, transmissions, tires, governors and test methods change results. Asset filenames do not establish a verified exact mechanical specification. Every selected baseline is recorded in performance.json rather than implying all imported game models have exact real-world measurements.
