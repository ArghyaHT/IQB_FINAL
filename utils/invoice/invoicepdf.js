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

    // Header Section - Left-aligned
    doc.fontSize(14).text('IQueueBook', { align: 'left' });
    doc.fontSize(10).text('16 Raffles Quay, #33-02, Hong Leong Building, Singapore 48581', { align: 'left' });
    doc.text('Singapore', { align: 'left' });
    doc.text('Registration No.: 9919SGP29004OSJ', { align: 'left' });

    // Move to a specific line height for the next section
    const headerHeight = doc.y; // Track current Y position after header content
    const rightColumnX = 400;  // X position for the right-aligned invoice information

    // Ensure the invoice information is on the same line
    doc.y = headerHeight;  // Keep Y position from header to maintain same line

    // Invoice Information Section - Right-aligned
    doc.fontSize(12).text('INVOICE', rightColumnX);
    doc.moveDown(0);  // Prevent default line break after text, keeping it on the same line
    doc.fontSize(10).text(`Invoice #:${invoice}`, rightColumnX);
    doc.text(`Invoice Issued: ${moment().format('DD-MM-YYYY')}`, rightColumnX);
    doc.text(`Invoice Amount: ${session.currency.toUpperCase()} ${(session.amount_total / 100).toFixed(2)}`, rightColumnX);
    doc.text(`Payment Status: ${session.payment_status.toUpperCase()}`, rightColumnX);

    // Continue with other content below
    doc.moveDown(2); // Adjust vertical space for the next section
    // Billing Information Section
    doc.fontSize(10).text('BILLED TO', { underline: true });
    doc.text(`${session.customer_details.name}`, { align: 'left' });
    doc.text(`${session.customer_details.email}`, { align: 'left' });
    doc.moveDown(2); // Space before the table starts

    // Product Details Section (Table)
    const columnWidths = [300, 100, 100, 100]; // Adjust column widths for DESCRIPTION, PRICE, DISCOUNT, TOTAL
    const lineHeight = 15; // Line height for each row
    doc.fontSize(10).text('DESCRIPTION', 50, doc.y, { width: columnWidths[0], align: 'left' });
    doc.text('PRICE', 350, doc.y, { width: columnWidths[1], align: 'right' });
    doc.text('DISCOUNT', 450, doc.y, { width: columnWidths[2], align: 'right' });
    doc.text('TOTAL', 550, doc.y, { width: columnWidths[3], align: 'right' });
    doc.moveDown(1);

    // Draw table rows for products
    products.forEach(product => {
      doc.text(product.name, 50, doc.y, { width: columnWidths[0], align: 'left' });
      doc.text(`${session.currency.toUpperCase()} ${product.price.toFixed(2)}`, 350, doc.y, { width: columnWidths[1], align: 'right' });
      doc.text('-', 450, doc.y, { width: columnWidths[2], align: 'center' });
      doc.text(`${session.currency.toUpperCase()} ${product.price.toFixed(2)}`, 550, doc.y, { width: columnWidths[3], align: 'right' });
      doc.moveDown();
    });

    doc.moveDown(2); // Space between the table and summary

    // Summary Section
    const total = products.reduce((sum, product) => sum + product.price, 0);
    const tax = total * 0.18; // Assuming 18% GST
    const grandTotal = total + tax;

    doc.fontSize(10).text(`Total excl. Tax: ${session.currency.toUpperCase()} ${total.toFixed(2)}`, { align: 'left' });
    doc.text(`Tax @ 18%: ${session.currency.toUpperCase()} ${tax.toFixed(2)}`, { align: 'left' });
    doc.text(`Total: ${session.currency.toUpperCase()} ${grandTotal.toFixed(2)}`, { align: 'left' });
    doc.text(`Payments: ${session.currency.toUpperCase()} -${grandTotal.toFixed(2)}`, { align: 'left' });
    doc.text(`Amount Due: ${session.currency.toUpperCase()} 0.00`, { align: 'left' });
    doc.moveDown(2);

    // Footer Section
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
