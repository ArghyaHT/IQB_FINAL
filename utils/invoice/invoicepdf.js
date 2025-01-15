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

  const salon = await getSalonBySalonId(session.metadata.salonId)
  
  const doc = new PDFDocument({ margin: 50 });
  const invoicePath = path.resolve(__dirname, 'invoice.pdf');
  const writeStream = fs.createWriteStream(invoicePath);
  doc.pipe(writeStream);

  // Header Section
  doc.fontSize(16).text('IQueueBook', 50, 50);
  doc.fontSize(10).text('16 Raffles Quay, #33-02, Hong Leong Building, Singapore 48581', 50, 70);
  doc.text('Singapore', 50, 85);
  doc.text('Registration No.: 9919SGP29004OSJ', 50, 100);

  // Invoice Details (Right-aligned)
  const detailsX = 400;
  const detailsY = 50;
  doc.fontSize(14).text('INVOICE', detailsX, detailsY);
  doc.fontSize(10)
    .text(`Invoice #: ${invoice}`, detailsX, detailsY + 15)
    .text(`Invoice Issued: ${moment().format('DD MMM, YYYY')}`, detailsX, detailsY + 30)
    .text(`Invoice Amount: ${salon.currency}${(session.amount_total / 100).toFixed(2)}`, detailsX, detailsY + 45)
    .text(`Status: ${session.payment_status.toUpperCase()}`, detailsX, detailsY + 60);

  // Billed To Section
  doc.moveTo(50, 130).lineTo(550, 130).stroke();
  doc.fontSize(12).text('BILLED TO', 50, 140, { underline: true });
  doc.fontSize(10).text(session.customer_details.name, 50, 160);
  doc.text(session.customer_details.email, 50, 175);

  // Table Header
  const tableTop = 200;
  const colWidths = { description: 200, price: 100, discount: 100, total: 100, tax: 100 };
  doc.fontSize(10)
    .text('DESCRIPTION', 50, tableTop, { width: colWidths.description, ellipsis: true })
    .text('PRICE', 100, tableTop, { align: 'left', width: colWidths.price })
    .text('DISCOUNT', 150, tableTop, { align: 'left', width: colWidths.discount })
    .text('TAX (18%)', 200, tableTop, { align: 'left', width: colWidths.tax })
    .text('TOTAL', 250, tableTop, { align: 'left', width: colWidths.total })

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Table Rows
  let currentY = tableTop + 20;
  products.forEach((product) => {
    doc.text(product.name, 50, currentY, { width: colWidths.description, ellipsis: true })
      .text(`${salon.currency}${product.price.toFixed(2)}`, 100, currentY, { align: 'left' })
      .text('-', 150, currentY, { align: 'left' })
      .text(`${salon.currency}${(product.price * 0.18).toFixed(2)}`, 200, currentY, { align: 'left' })
      .text(`${salon.currency}${product.price.toFixed(2)}`, 250, currentY, { align: 'left' })

    currentY += 20;

    // Add row separator
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
  });

  // Summary Section
  const summaryStartY = currentY + 30;
  const total = products.reduce((sum, p) => sum + p.price, 0);
  const tax = total * 0.18;
  const grandTotal = total + tax;

  doc.fontSize(10)
    .text(`Total excl. Tax: ${salon.currency}${total.toFixed(2)}`, 50, summaryStartY)
    .text(`Tax @ 18%: ${salon.currency}${tax.toFixed(2)}`, 50, summaryStartY + 15)
    .text(`Total incl. Tax: ${salon.currency}${grandTotal.toFixed(2)}`, 50, summaryStartY + 30)
    .text(`Payments: ${salon.currency}${grandTotal.toFixed(2)}`, 50, summaryStartY + 45)
    .text(`Amount Due: ${salon.currency}0.00`, 50, summaryStartY + 60);

  // Footer
  doc.moveDown(2);
  doc.fontSize(10).text('Thank you for choosing IQueueBook!', 50, summaryStartY + 90, { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(invoicePath));
    writeStream.on('error', reject);
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
