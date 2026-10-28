const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { id: "2299c1e9-8ca8-4e97-a4eb-f79ca757bc46", metaTitle: "Pegaso Madison Pelletofen (Stahl Anthrazit, 5,2 kW) Kaufen", metaDescription: "Kompakter Pelletofen Pegaso Madison in Anthrazit (5,2 kW). Sehr sparsamer Verbrauch (0,5-1,2 kg/h) und platzsparend (27,5 cm Tiefe) für kleine Räume." },
  { id: "cceac011-12f7-402f-86df-1c4ff8ce3c57", metaTitle: "Rowi Puro Pelletofen (Stahl Schwarz, 6 kW) | Günstig Heizen", metaDescription: "Schwarzer Pelletofen Rowi Puro aus Stahl (6 kW). Kompaktes Design, effiziente Heizleistung und geringer Pelletverbrauch für gemütliche Wärme." },
  { id: "b06687a6-91be-492d-bf83-ef8491795bff", metaTitle: "Interstoves Natalia Pelletofen (Schwarz, 8 kW) Optional WIFI", metaDescription: "Interstoves Natalia Pelletofen in Schwarz (8 kW). Schlankes Design (32 cm Tiefe), optionales WIFI-Control und sparsamer Betrieb." },
  { id: "9f730ada-d45a-4fac-b66b-f026ec6a4092", metaTitle: "Kaminofen Aduro 9-5 (Stahl Schwarz, 6 kW) Kaufen", metaDescription: "Aduro 9-5 Kaminofen aus schwarzem Stahl (6 kW). Zeitbrandofen mit elegantem Design, heizt bis zu 140 m³. Ideale Maße: 120 x 50 x 44,7 cm." },
  { id: "40d8e01d-b5fa-4e92-a8b8-b9a9f2e2d925", metaTitle: "Kaminofen Aduro 15 (Stahl Schwarz, 6,5 kW) | Gaming BM", metaDescription: "Aduro 15 Kaminofen in schwarzem Stahl (6,5 kW). Elegantes Breitformat, 140 m³ Raumheizvermögen und effizienter Zeitbrand-Betrieb." },
  { id: "e2268ed5-b427-4d8f-ba40-8c65f68a53de", metaTitle: "Xeoos Patagonia x8 Kaminofen (Stahl Anthrazit, 8 kW) EEK A+", metaDescription: "Premium Kaminofen Xeoos Patagonia x8 in Anthrazit (8 kW). Energieeffizienzklasse A+, innovatives Verbrennungssystem und zeitloses Design." },
  { id: "e2e36f5a-e143-4d45-ad44-34e93ef2f06d", metaTitle: "La Nordica Extraflame Caldaia PK 15 Pelletkessel (15 kW)", metaDescription: "Wasserführender Pelletkessel La Nordica Caldaia PK 15 (15 kW). Heizt bis zu 430 m³, 75 kg Tankkapazität für maximale Effizienz im ganzen Haus." },
  { id: "4d273fee-3b64-4399-9bc5-cb5db3e7e88d", metaTitle: "Kachelofen Hark Aspen 1 (Marmor Classico-Beige, 8 kW)", metaDescription: "Hark Aspen 1 Kachelofen mit edler Classico-Beige Marmorverkleidung (8 kW). Wärmespeichernder Zeitbrandofen für bis zu 175 m³ Raumgröße." },
  { id: "8adabed1-c137-4430-9d7d-8b61585476a9", metaTitle: "Kachelofen Haas & Sohn Arlberg (8 kW, Unbehandelt) Kaufen", metaDescription: "Haas & Sohn Arlberg Kachelofen (8 kW). Unbehandeltes Design, massiver Aufbau und enormes Raumheizvermögen von 230 m³." },
  { id: "90ba4a64-e9f4-44f7-843b-5529985936d3", metaTitle: "Wasserführender Kamineinsatz Malaga II (Schwarz, 18 kW)", metaDescription: "Bruno Malaga II wasserführender Kamineinsatz aus Stahl (18 kW). Kraftvolle Unterstützung für Ihr Heizsystem im kompakten Format." },
  { id: "816c2a77-c09b-4ca4-8f9b-d5cd6991c002", metaTitle: "Pegaso Madison Pelletofen (Stahl Bordeaux, 5,2 kW) Kaufen", metaDescription: "Bordeaux-roter Pelletofen Pegaso Madison (5,2 kW). Platzsparend (27,5 cm Tiefe) und extrem sparsam im Verbrauch. Ideal für kleine Wohnräume." },
  { id: "080b19ea-1223-4d22-86cd-c49034fde52e", metaTitle: "Interstoves Marina 14 Pelletofen (Kanalisierbar, 12,1 kW)", metaDescription: "Leistungsstarker Pelletofen Interstoves Marina 14 in Schwarz (12,1 kW). Kanalisierbar zur Beheizung mehrerer Räume. Zuverlässig und effizient." },
  { id: "2ed0a106-15ee-430a-a49a-1df88f0d3c7a", metaTitle: "Interstoves Natalia Pelletofen (Weiß, 8 kW) Optional WIFI", metaDescription: "Eleganter Interstoves Natalia Pelletofen in Weiß (8 kW). Platzsparend (32 cm Tiefe) und optional mit WIFI-Steuerung für smartes Heizen." },
  { id: "169466d2-a2ca-41d2-9245-42be4d342178", metaTitle: "La Nordica Extraflame PK 20 Pelletkessel (20 kW) Kaufen", metaDescription: "Wasserführender Pelletkessel La Nordica PK 20 (20 kW). Raumheizvermögen bis 573 m³ und 75 kg Tankkapazität. Zuverlässige Wärmeversorgung." },
  { id: "b41fc1e9-1305-446b-876b-15d583e4064b", metaTitle: "Kaminholz Buche 33cm (2 RM / 3 SRM) in Bretterbox Kaufen", metaDescription: "Hochwertiges Buchenbrennholz (33 cm Scheitlänge, 2 RM). Geliefert in einer stabilen Einweg-Bretterbox. Ideal für lang anhaltende Kaminwärme." },
  { id: "405786ad-35a6-486c-bfdb-e04027bae0ee", metaTitle: "Premium Hartholz Holzbriketts Rund (480kg Palette) Kaufen", metaDescription: "Runde Premium Hartholz-Holzbriketts auf der 480kg Palette (48x 10kg). Extrem hoher Heizwert und lange Glutdauer für Ihren Kamin." },
  { id: "410a8a5b-8d1e-44b6-a8c2-4e18ea341625", metaTitle: "REKORD Braunkohlebriketts (1000kg Palette, 40x 25kg) Kaufen", metaDescription: "REKORD Braunkohlebriketts auf der 1000kg Palette (40x 25kg Bündel). Hoher Heizwert, langanhaltende Glut und perfekte Brikett-Qualität." },
  { id: "76036a15-f748-4900-9ff3-b6a777d29b7c", metaTitle: "Kachelofen Hark Easy 500 (Naturschwarz, 5 kW) Kaufen", metaDescription: "Hark Easy 500 Kachelofen in Naturschwarz (5 kW). Zeitbrandofen mit 99 m³ Heizvermögen und massiven 188 cm Höhe. Ein echtes Highlight." },
  { id: "5c4da195-6def-4fc1-93fa-f258186f8654", metaTitle: "Kaminholz Mischholz (1 RM) | Trockenes Brennholz Kaufen", metaDescription: "1 Raummeter Kaminholz (Mischholz). Trocken, ofenfertig und ideal für ein schönes Flammenbild in Ihrem Kamin oder Holzofen." },
  { id: "c91d28bc-5d4b-458e-b6eb-a7410bd48892", metaTitle: "HEIZFUXX RUF Weichholz Holzbriketts (10 kg Gebinde) Kaufen", metaDescription: "HEIZFUXX RUF Holzbriketts aus Weichholz (10 kg Gebinde, 10 Stück). Hoher Heizwert (3 Briketts = 5 Holzscheite), platzsparend und sauber." },
  { id: "bc20a2e3-9e05-4dba-aa42-b3ea2e865e5f", metaTitle: "Kaminholz Kiefer (1 RM) Kammergetrocknet | 25cm Scheite", metaDescription: "Kammergetrocknetes Kiefer-Kaminholz (1 RM, ca. 420 kg). 25 cm Scheitlänge, ofenfertig und perfekt für schnelles Anfeuern und hohe Hitze." },
  { id: "e32c6f31-dad0-4709-a211-56c6b589ef7f", metaTitle: "Brennholz Eiche (2 RM) | Sehr hoher Brennwert Kaufen", metaDescription: "Hochwertiges Eichenbrennholz (2 RM, 23-26 cm Länge). Hervorragender Brennwert (2100 KWh/rm) und langanhaltende Glut für Ihren Kamin." },
  { id: "ecdc1366-afb6-40f2-9d8c-9c73dbd65f0f", metaTitle: "Premium Kaminholz Hainbuche 25cm (1,8 RM) Gebrauchsfertig", metaDescription: "Ofengetrocknetes Hainbuchen-Brennholz (1,8 RM, 25 cm). Restfeuchte unter 20%, sofort brennfertig und extrem hoher Heizwert." },
  { id: "6c724a07-5b05-4225-a050-8de11649cfe3", metaTitle: "Sortenreines Buche Premium Kaminholz (2 RM) Kammergetrocknet", metaDescription: "Premium Kaminholz (100% Buche) auf der 2 RM Palette. Kammergetrocknet (30-33 cm), umweltfreundlich verpackt und ideal für den Winter." },
  { id: "6541dbb0-a188-43b1-a56f-f39dea6af276", metaTitle: "Brennholz Birke (2 RM, 920 kg) Getrocknet & Gespalten Kaufen", metaDescription: "Ofenfertiges Birkenholz (2 RM / 920 kg). Getrocknet, gespalten (30-33 cm) und sofort einsatzbereit. Wunderschönes Flammenbild, ohne Spalten." },
  { id: "3a452432-bbcf-4973-ba2e-f9654ff8a18d", metaTitle: "Brennholz Buche 25cm (1 RM / 1,6 SRM) | Trocken Kaufen", metaDescription: "Buchenbrennholz mit 25 cm Scheitlänge (1 RM). Restfeuchte unter 20%, ofenfertig und perfekt für kleine Kaminöfen." },
  { id: "e4f98d78-0e37-484d-81ab-da0f09d49b85", metaTitle: "REKORD Braunkohlebriketts Halbpalette (45x 10kg) Kaufen", metaDescription: "Die kleine Größe: REKORD Braunkohlebriketts auf der 450kg Halbpalette (45x 10kg). Perfekt für Heiz-Fans mit kleinerem Brennstofflager." },
  { id: "508cb436-9516-4c18-b6e8-25a00ea31936", metaTitle: "Premium Hartholz Holzbriketts Rund (960kg Palette) Kaufen", metaDescription: "Runde Premium Hartholz-Briketts auf der 960kg Palette (96x 10kg). Ca. 60 Minuten Flammdauer und langanhaltende Glut." },
  { id: "2331938c-e15f-4e8b-a7e5-7ff5dfddced1", metaTitle: "REKORD Braunkohlebriketts (900kg Palette, 90x 10kg) Kaufen", metaDescription: "Original REKORD Braunkohlebriketts auf der 900kg Palette (90 Pakete à 10 kg). Hoher Heizwert und einfache Lagerung." },
  { id: "e6da2a94-6df1-4f5e-b8d3-44595f2b5e7e", metaTitle: "Brennholz Laubholzmix 28-33cm (1 RM) Kammergetrocknet", metaDescription: "Kammergetrocknetes Laubholzmix-Brennholz (1 RM, 28-33 cm). Restfeuchte unter 12% für sauberen Abbrand und hohen Heizwert (1900 kWh)." },
  { id: "3f557c4a-a75d-4b83-bada-0d340af28e7f", metaTitle: "Brennholz Buche auf Palette (1,8 RM) | 23-26cm Scheitlänge", metaDescription: "Buchenbrennholz auf Palette (1,8 RM, 23-26 cm). Sehr hoher Brennwert (2100 KWh/rm) und ideale Größe für jeden Kaminofen." }
];

async function main() {
  for (const update of updates) {
    await prisma.product.update({
      where: { id: update.id },
      data: {
        metaTitle: update.metaTitle,
        metaDescription: update.metaDescription
      }
    });
    console.log(`Updated ${update.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
