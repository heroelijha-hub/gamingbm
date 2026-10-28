const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { id: "c31b2562-a914-42c2-a57c-0f5d33633e5c", metaTitle: "JUSTUS Usedom 5D Kaminofen Gussgrau 5kW | Gaming BM", metaDescription: "Kaufen Sie den JUSTUS Usedom 5D Kaminofen in Gussgrau. 5,5 kW Nennleistung, Energieeffizienz A und 88 m³ Raumheizvermögen für effizientes Heizen." },
  { id: "69d1926f-50cb-4f89-8350-4a4cd2e18e69", metaTitle: "JUSTUS Usedom 5 Kaminofen Schwarz (5,5 kW) Kaufen", metaDescription: "Entdecken Sie den JUSTUS Usedom 5 Kaminofen (Stahl Schwarz, 5,5 kW). Hoher Wirkungsgrad über 80% (Holz & Kohle) und umweltfreundliche Verbrennung." },
  { id: "723164ce-295d-4e1b-a6b3-92a1c3291673", metaTitle: "Nemaxx P6 Pelletofen (6 kW, Rot, WiFi-Ready) | A+ Effizienz", metaDescription: "Bestellen Sie den roten Nemaxx P6 Pelletofen (6 kW). WiFi-Ready, ECO-Modus, geringe Ascheproduktion und Energieeffizienzklasse A+ für Ihr Zuhause." },
  { id: "3017eb77-4924-4bb3-aa59-c9625590a503", metaTitle: "Nemaxx P12 Pelletofen (13,6 kW, Weiß, WiFi) Kaufen", metaDescription: "Weißer Nemaxx P12 Pelletofen mit 13,6 kW Leistung. Hohe Effizienz, WiFi-Ready, herausnehmbarer Aschekasten und edles Design." },
  { id: "400199d1-b6bd-4cb9-afaf-d7ff51a282a7", metaTitle: "La Nordica Extraflame PK 30 Pelletkessel (30 kW)", metaDescription: "Wasserführender Pelletkessel La Nordica Extraflame PK 30. Heizt bis zu 860 m³, 75 kg Tankkapazität und 30 kW Nennwärmeleistung für maximale Energieeffizienz." },
  { id: "aa072551-6c30-4426-a9cc-8dc14d2161fd", metaTitle: "Nemaxx P9 Pelletofen (11 kW, Weiß, WiFi-Ready)", metaDescription: "Kaufen Sie den Nemaxx P9 Pelletofen in Weiß (11 kW). TÜV SÜD geprüft, automatischer Zeitplaner und enormes Raumheizvermögen bis 220 m³." },
  { id: "e14897f7-27a5-4120-8f7d-a219b99878cf", metaTitle: "Nemaxx P9 Pelletofen (11 kW, Rot, WiFi-Ready) Kaufen", metaDescription: "Roter Nemaxx P9 Pelletofen (11 kW) mit WiFi. Hohe Wärmeabgabe, TÜV SÜD geprüft und BImSchV-konform für sparsames und sauberes Heizen." },
  { id: "a0e360b9-1668-4e56-9648-174112c7dda8", metaTitle: "Brennholz Birke 25cm (1 RM / 1,5 SRM) in Bretterbox Kaufen", metaDescription: "Birken-Brennholz (25 cm Scheitlänge, 1 RM) in stabiler Einweg-Bretterbox. Ideal für den Kamin, ca. 500-550 kg Palettengewicht. Jetzt günstig bestellen." },
  { id: "c56e01bd-25c6-442d-8e92-121688cc775f", metaTitle: "Buchenbrennholz 25cm (1 RM / 1,5 SRM) Kammergetrocknet", metaDescription: "Bestellen Sie hochwertiges, kammergetrocknetes Buchenbrennholz (1 RM, 25cm Scheitlänge). Geliefert in einer praktischen Box (500-550 kg) für sofortiges Heizen." },
  { id: "8fb23953-c937-452d-b7fb-13b153e7fc56", metaTitle: "Nemaxx P6 Pelletofen (6 kW, Schwarz, WiFi-Ready)", metaDescription: "Nemaxx P6 Pelletofen in Schwarz (6 kW). Ausgestattet mit ECO-Modus, WiFi-Funktion und TÜV-Zertifizierung für umweltfreundliches Heizen bis 120 m³." },
  { id: "3f245bce-7ff3-47ad-b201-f80b4daa97c6", metaTitle: "Brennholz Mix 33cm (1 RM Box) | Kammergetrocknet Kaufen", metaDescription: "Praktische 1 RM-Box mit Brennholz Mix (33 cm Scheite). Kammergetrocknet (Restfeuchte < 20%), ca. 450-500 kg, sicher verpackt mit Netz und Folie." },
  { id: "46467498-463a-421e-ab11-c89f671a908d", metaTitle: "HEIZFUXX Holzpellets Blue Weichholz | 975 kg Palette Kaufen", metaDescription: "HEIZFUXX Blue Weichholzpellets auf 975kg Palette (65x 15kg Sack). Kosteneffizient, fest gepresst und saubere Verbrennung mit sehr geringem Feinanteil." },
  { id: "8b23eba0-82f8-4a22-8697-92546dc5ffb9", metaTitle: "Kaminofen Umea Schwarz (Stahl, 6 kW) Kaufen", metaDescription: "Zeitbrandofen Umea in Schwarz mit Stahlverkleidung. Kompakte Maße (90,5 x 55,8 x 40,5 cm) und 6 kW Nennwärmeleistung für wohlige Wärme." },
  { id: "d061be98-7050-44d3-9d00-b75c473dbe57", metaTitle: "Nemaxx P12 Pelletofen (13,6 kW) | Raumheizvermögen 300m³", metaDescription: "Leistungsstarker Nemaxx P12 Pelletofen (13,6 kW). Heizt bis zu 300 m³, TÜV SÜD geprüft, ECO-Modus und automatischer Zeitplaner für höchsten Komfort." },
  { id: "d880d467-e35a-4a32-a689-762f3c515c09", metaTitle: "Brennholz Buche 2 RM (25cm/33cm) Kammergetrocknet", metaDescription: "Kammergetrocknetes Buchenbrennholz (2 RM) in 25cm oder 33cm Scheitlänge. Geliefert in einer stabilen Einweg-Bretterbox. Ideal für Kamin und Ofen." },
  { id: "2d20940c-eb71-4aaa-9412-9bac3d565ef5", metaTitle: "Brennholz Buche 33cm (2 RM / 3 SRM) Sortenrein Kaufen", metaDescription: "Sortenreines, kammergetrocknetes Buchenbrennholz (33 cm, 2 RM). Unter 20% Restfeuchte im Kern, frei von Störstoffen. Direkt ofenfertig." },
  { id: "7e99a2ee-0f03-4bfb-a553-8ebaff1bee9e", metaTitle: "RUF Rindenbriketts Gluthalter (1000kg Palette) Kaufen", metaDescription: "Original RUF Rindenbriketts \"Nachtwächter\" (1000kg Palette). 8-12 Stunden Glutdauer, ca. 4,8 kWh/kg Heizwert. Perfekt zum Halten der Glut über Nacht." },
  { id: "515f5b88-fee7-4f66-b7c8-9a6f298ef737", metaTitle: "Kaminholz Buche (1 Raummeter) | Top Heizwert & Glut", metaDescription: "Buchenkaminholz (1 Raummeter) für ein schönes Flammenbild und perfekte Glutentwicklung. Sehr hoher Heizwert und nahezu kein Funkenspritzen." },
  { id: "479afe20-ab5a-4786-a182-dbd3e5733a7a", metaTitle: "Kamineinsatz Stahl NADIA 12 kW (Ø 200) Schwarz Kaufen", metaDescription: "Moderner Kamineinsatz NADIA aus Stahl (12 kW, Ø 200) mit edler schwarzer Verkleidung. Hochwertige Verarbeitung für effizientes und stilvolles Heizen." },
  { id: "626b28b1-1582-4e01-a961-279d99ce5431", metaTitle: "Brennholz Buche Abschnitte (0,9 FM / 750kg) Kaufen", metaDescription: "Trockenes Buchenbrennholz (Abschnitte, 750 kg / ca. 1,9 SRM). Ideal als kostengünstiges Kaminholz. Produktionsbedingt leicht variierende Größen." },
  { id: "5345eb2b-1b80-4f12-86b5-f3631ecc7a6b", metaTitle: "HEIZFUXX Holzpellets Red Hartholz | 975 kg Palette", metaDescription: "HEIZFUXX Red Hartholzpellets (65x 15kg Sack). Eurofins laborgeprüft, nachhaltige Waldwirtschaft und ohne chemische Bindemittel für sauberes Heizen." },
  { id: "ddd63e04-5dbc-4d2a-96fa-2e7a94b5d677", metaTitle: "TotalEnergies Premium Holzpellets (Nadelholz, 975 kg)", metaDescription: "ENplus A1-zertifizierte Premium Holzpellets von TotalEnergies. 975 kg Palette, extrem saubere Verbrennung, geringe Restfeuchte und kein Bindemittel." },
  { id: "bce8eb2a-7971-49fd-84dc-c83df548613a", metaTitle: "HEIZFUXX Holzpellets Green Weichholz | 975 kg Palette", metaDescription: "Ökologische HEIZFUXX Green Weichholzpellets im Papiersack (975 kg Palette). ENplus A1 zertifiziert, hoher Heizwert und extrem wenig Asche." },
  { id: "7216f64c-e66a-449b-b52f-98d1fd74dd77", metaTitle: "Holzbrx Hartholz-Holzbriketts (960kg Palette) Kaufen", metaDescription: "Holzbrx Hartholz-Holzbriketts auf der 960kg Palette. Ohne Bindemittel unter hohem Druck gepresst, sofort verwendbar und extrem hoher Heizwert." },
  { id: "a8dc1509-9072-4e6c-be73-16a5b809c775", metaTitle: "Kaminofen Magna 3.0 Schwarz (7 kW) Kaufen", metaDescription: "Zeitbrandofen Magna 3.0 in Schwarz. Kompakte Bauweise (98 x 48 x 35,5 cm) und kraftvolle 7 kW Nennwärmeleistung für eine gemütliche Raumatmosphäre." }
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
