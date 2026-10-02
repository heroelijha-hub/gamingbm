const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slug = 'kaminholz-brennholz-kiefer-1-rm';
  
  const descriptionHtml = `<h2>Hochwertiges Kaminholz Kiefer: Schnelle Wärme für Ihr Zuhause</h2>\n<p>Entdecken Sie unser kammergetrocknetes <strong>Kaminholz Kiefer</strong> in der praktischen 1 RM (Raummeter) Palette. Kiefernholz ist das ideale Brennholz, wenn Sie Wert auf ein schnelles Anheizen und eine zügige Wärmeentwicklung legen. Dank des natürlichen Harzanteils verströmt Kiefer beim Verbrennen zudem einen wunderbaren, aromatischen Duft und sorgt für ein gemütliches Knistern im Kamin.</p>\n<p>Wenn Sie hochwertiges und zugleich <strong>günstig Kaminholz kaufen</strong> möchten, ist diese Palette die perfekte Wahl für gemütliche Winterabende.</p>\n<h2>Kammergetrocknet und sofort einsatzbereit</h2>\n<p>Unser Ofenholz wird sorgfältig kammergetrocknet. Mit einer optimalen Restfeuchte von lediglich 18 bis 20 % ist dieses Brennholz sofort feuerfertig. Sie vermeiden starke Rauchentwicklung, erreichen einen hohen Heizwert und schonen Ihren Kamin durch eine saubere, effiziente Verbrennung. Die praktische Scheitlänge von <strong>25 cm</strong> passt ideal in nahezu jeden handelsüblichen Kaminofen.</p>\n<h2>Produktdetails auf einen Blick</h2>\n<ul>\n  <li><strong>Holzart:</strong> Kiefer (Kaminholz / Ofenholz)</li>\n  <li><strong>Menge:</strong> 1 RM (Raummeter)</li>\n  <li><strong>Gewicht:</strong> &plusmn; 420 kg pro Palette</li>\n  <li><strong>Scheitlänge:</strong> ca. 25 cm (perfekt für kleine bis mittlere Öfen)</li>\n  <li><strong>Trocknung:</strong> Kammergetrocknet (Restfeuchte 18 &ndash; 20 %)</li>\n  <li><strong>Verpackung:</strong> Sauber gestapelt in einer stabilen Holzbox (Innenmaße: 120 x 80 x 110 cm)</li>\n</ul>\n<h2>Praktische Lieferung auf Palette</h2>\n<p>Sparen Sie sich das mühsame Stapeln! Das Brennholz wird Ihnen ordentlich geschlichtet auf einer Palette geliefert. Die robuste Box schützt das Holz und kann direkt als praktisches Holzlager in Ihrer Garage oder unter dem Carport genutzt werden.</p>`;

  const metaTitle = 'Kaminholz Kiefer 1 RM kaufen | Kammergetrocknet';
  const metaDescription = 'Günstig Kaminholz kaufen: Kammergetrocknetes Kiefernholz (1 RM) auf Palette. Scheitlänge 25cm, sofort feuerfertig, Restfeuchte unter 20%. Jetzt bestellen!';

  const updatedProduct = await prisma.product.update({
    where: { slug: slug },
    data: {
      description: descriptionHtml,
      metaTitle: metaTitle,
      metaDescription: metaDescription
    }
  });

  console.log('Product updated successfully:', updatedProduct.slug);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
