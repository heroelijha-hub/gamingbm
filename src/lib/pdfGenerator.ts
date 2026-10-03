import PDFDocument from 'pdfkit';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

export function generateInvoicePDF(order: any): Promise<Buffer> {
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
            customerAddress = `${billing.address || ''}\n${billing.zipCode || ''} ${billing.city || ''}\n${billing.country || ''}`.trim();
          }
        } catch (e) {
          // ignore
        }
      }

      // Generate content
      generateHeader(doc);
      generateCustomerInformation(doc, order, customerName, customerEmail, customerAddress);
      generateInvoiceTable(doc, order);
      generateFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function generateHeader(doc: typeof PDFDocument) {
  doc
    .fillColor('#444444')
    .fontSize(24)
    .text('RECHNUNG', 50, 57)
    .fontSize(10)
    .text('Top Kaminbrennstoffe', 200, 65, { align: 'right' })
    // If they have an address, you can add it here, or just keep it simple
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
