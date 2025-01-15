import fs from "fs"
import PDFDocument from "pdfkit"
import path from "path";
import moment from "moment";
import { fileURLToPath } from 'url';
import { getSalonBySalonId } from "../../services/mobile/salonServices.js";
import SalonPayments from "../../models/salonPaymnetsModel.js";


// Define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = async (invoice, session, products) => {
  const salon = await getSalonBySalonId(session.metadata.salonId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const invoicePath = path.resolve(__dirname, 'invoice.pdf');
    const writeStream = fs.createWriteStream(invoicePath);
    writeStream.on('finish', () => resolve(invoicePath));
    writeStream.on('error', reject);
    doc.pipe(writeStream);

    // Header Section
    doc.fontSize(16).text('IQueueBook', { align: 'left' });
    doc.fontSize(10).text('16 Raffles Quay, #33-02, Hong Leong Building, Singapore 48581', { align: 'left' });
    doc.text('Singapore', { align: 'left' });
    doc.text('Registration No.: 9919SGP29004OSJ', { align: 'left' });

    // Invoice Details - Right-aligned
    doc.moveDown();
    doc.fontSize(14).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice #: ${invoice}`, { align: 'right' });
    doc.text(`Invoice Issued: ${moment().format('DD MMM, YYYY')}`, { align: 'right' });
    doc.text(`Invoice Amount: ₹${(session.amount_total / 100).toFixed(2)}`, { align: 'right' });
    doc.text(`Status: ${session.payment_status.toUpperCase()}`, { align: 'right' });

    // Billed To Section
    doc.moveDown();
    doc.fontSize(12).text('BILLED TO', { underline: true });
    doc.fontSize(10).text(`${session.customer_details.name}`);
    doc.text(`${session.customer_details.email}`);
    doc.text(`${session.customer_details.address || ''}`);

    // Table Header
    doc.moveDown();
    const tableTop = doc.y;
    doc.fontSize(10)
      .text('DESCRIPTION', 50, tableTop)
      .text('PRICE', 200, tableTop, { align: 'right' })
      .text('DISCOUNT', 300, tableTop, { align: 'right' })
      .text('TOTAL', 400, tableTop, { align: 'right' })
      .text('TAX (18%)', 500, tableTop, { align: 'right' });

    // Draw horizontal line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Rows
    let currentY = tableTop + 20;
    products.forEach((product) => {
      doc.text(product.name, 50, currentY)
        .text(`₹${product.price.toFixed(2)}`, 200, currentY, { align: 'right' })
        .text('-', 300, currentY, { align: 'right' })
        .text(`₹${product.price.toFixed(2)}`, 400, currentY, { align: 'right' })
        .text(`₹${(product.price * 0.18).toFixed(2)}`, 500, currentY, { align: 'right' });
      currentY += 20;

      // Draw horizontal line
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    });

    // Summary Section
    doc.moveDown(2);
    const total = products.reduce((sum, p) => sum + p.price, 0);
    const tax = total * 0.18;
    const grandTotal = total + tax;

    doc.fontSize(10).text(`Total excl. Tax: ₹${total.toFixed(2)}`);
    doc.text(`Tax @ 18%: ₹${tax.toFixed(2)}`);
    doc.text(`Total incl. Tax: ₹${grandTotal.toFixed(2)}`);
    doc.text(`Payments: ₹-${grandTotal.toFixed(2)}`);
    doc.text('Amount Due: ₹0.00');

    // Footer Section
    doc.moveDown();
    doc.fontSize(10).text('Thank you for choosing IQueueBook!', { align: 'center' });

    doc.end();
  });
};




// Function to generate invoice number
export const generateInvoiceNumber = async () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase(); // Get the short month (JAN, FEB, etc.)
  const year = new Date().getFullYear(); // Get current year

  // Find the latest invoice based on invoice number, sorted in descending order
  const lastInvoice = await SalonPayments.findOne().sort({ invoiceNumber: -1 }); // Sort by invoice number descending

  let newInvoiceNumber = 1; // Default to 1 for the first invoice

  // If there is a last invoice, extract and increment its number
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const lastInvoiceNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    newInvoiceNumber = lastInvoiceNumber + 1; // Increment the invoice number
  }

  // Format the new invoice number as `IQB-MMM-001`
  return `IQB-${currentMonth}-${String(newInvoiceNumber).padStart(3, '0')}`;
};
