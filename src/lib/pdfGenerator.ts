import PDFDocument from 'pdfkit';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  // Fetch store logo and name from DB
  let logoBuffer: Buffer | null = null;
  let storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Gaming BM';
  
  try {
    const settingsDb = await prisma.setting.findMany({
      where: { key: { in: ['HEADER_LOGO_IMAGE', 'NEXT_PUBLIC_STORE_NAME'] } }
    });
    const sMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    if (sMap.NEXT_PUBLIC_STORE_NAME) storeName = sMap.NEXT_PUBLIC_STORE_NAME;

    const logoSetting = sMap['HEADER_LOGO_IMAGE'];
    if (logoSetting && /^https?:\/\//i.test(logoSetting)) {
      try {
        const res = await fetch(logoSetting);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          logoBuffer = Buffer.from(ab);
        }
      } catch (err) {
        console.error('Failed to fetch remote logo for PDF', err);
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback to local logo in public/ if no remote logo could be loaded
  if (!logoBuffer) {
    try {
      const localLogoPath = path.join(process.cwd(), 'public', 'logo.jpg');
      if (fs.existsSync(localLogoPath)) {
        logoBuffer = fs.readFileSync(localLogoPath);
      }
    } catch (e) {
      // ignore
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Fetch customer details from order
      let customerName = 'Kunde';
      let customerEmail = order.user?.email || '';
      let customerAddress = '';
      
      if (order.destinationAddress) {
        try {
          const metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
          const billing = metadata?.billing || metadata?.shipping;
          if (billing) {
            customerName = `${billing.firstName || ''} ${billing.lastName || ''}`.trim();
            customerEmail = billing.email || customerEmail;
            const street = [billing.address1, billing.address2, billing.address].filter(Boolean).join(', ');
            const cityPostal = [billing.postalCode, billing.zipCode, billing.city].filter(Boolean).join(' ');
            customerAddress = [street, cityPostal, billing.country].filter(Boolean).join('\n').trim();
          }
        } catch (e) {
          // ignore
        }
      }

      // Generate content
      generateHeader(doc, logoBuffer, storeName);
      generateCustomerInformation(doc, order, customerName, customerEmail, customerAddress);
      generateInvoiceTable(doc, order);
      generateFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function generateHeader(doc: typeof PDFDocument, logoBuffer: Buffer | null, storeName: string) {
  let headerTop = 45;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 50, headerTop, { width: 140, height: 45, fit: [140, 45] });
    } catch (e) {
      doc
        .fillColor('#ea580c')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(storeName, 50, headerTop + 10);
    }
  } else {
    doc
      .fillColor('#ea580c')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(storeName, 50, headerTop + 10);
  }

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('RECHNUNG', 200, headerTop + 5, { align: 'right' })
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#64748b')
    .text(storeName, 200, headerTop + 30, { align: 'right' })
    .text('DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND', 200, headerTop + 43, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(doc: typeof PDFDocument, order: any, customerName: string, customerEmail: string, customerAddress: string) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Rechnungsdetails', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text('Rechnungs-Nr.:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(order.id.slice(-6).toUpperCase(), 150, customerInformationTop)
    .font('Helvetica')
    .text('Datum:', 50, customerInformationTop + 15)
    .text(formatDate(new Date(order.createdAt)), 150, customerInformationTop + 15)
    .text('Zahlungsart:', 50, customerInformationTop + 30)
    .text(order.paymentMethod || 'N/A', 150, customerInformationTop + 30)

    .text('Kunde:', 300, customerInformationTop)
    .font('Helvetica-Bold')
    .text(customerName, 300, customerInformationTop + 15)
    .font('Helvetica')
    .text(customerEmail, 300, customerInformationTop + 30);
    
  if (customerAddress) {
    doc.text(customerAddress.replace(/\n/g, ', '), 300, customerInformationTop + 45);
  }

  generateHr(doc, 267);
}

function generateInvoiceTable(doc: typeof PDFDocument, order: any) {
  let i;
  const invoiceTableTop = 330;

  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Artikel',
    'Menge',
    'Einzelpreis',
    'Gesamt'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  let position = invoiceTableTop + 30;
  
  if (order.orderItems && order.orderItems.length > 0) {
    for (i = 0; i < order.orderItems.length; i++) {
      const item = order.orderItems[i];
      const title = item.product?.title || 'Produkt';
      const quantity = item.quantity;
      const price = item.price;
      const lineTotal = quantity * price;

      generateTableRow(
        doc,
        position,
        title.substring(0, 40) + (title.length > 40 ? '...' : ''),
        quantity.toString(),
        formatPrice(price),
        formatPrice(lineTotal)
      );

      generateHr(doc, position + 20);
      position += 30;
    }
  }

  const subtotalPosition = position + 20;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    'Gesamtsumme',
    formatPrice(order.total)
  );
  doc.font('Helvetica');
}

function generateFooter(doc: typeof PDFDocument) {
  doc
    .fontSize(10)
    .text(
      'Vielen Dank für Ihren Einkauf. Bei Fragen kontaktieren Sie uns bitte.',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

function generateTableRow(
  doc: typeof PDFDocument,
  y: number,
  item: string,
  quantity: string,
  unitCost: string,
  lineTotal: string
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(quantity, 330, y, { width: 90, align: 'right' })
    .text(unitCost, 400, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc: typeof PDFDocument, y: number) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
