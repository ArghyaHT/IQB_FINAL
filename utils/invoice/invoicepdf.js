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

    // Invoice Information Section - Right-aligned
    const rightColumnX = 400; // X position for right-aligned invoice info
    doc.fontSize(12).text('INVOICE', rightColumnX);
    doc.fontSize(10).text(`Invoice #:${invoice}`, rightColumnX);
    doc.text(`Invoice Issued: ${moment().format('DD-MM-YYYY')}`, rightColumnX);
    doc.text(`Invoice Amount: ${session.currency.toUpperCase()} ${(session.amount_total / 100).toFixed(2)}`, rightColumnX);
    doc.text(`Payment Status: ${session.payment_status.toUpperCase()}`, rightColumnX);

    doc.moveDown(2); // Space before the billing section

    // Billing Information Section
    doc.fontSize(10).text('BILLED TO', { underline: true });
    doc.text(`${session.customer_details.name}`, { align: 'left' });
    doc.text(`${session.customer_details.email}`, { align: 'left' });
    doc.moveDown(2); // Space before the table starts

    // Grid (Table) Setup
    const columnWidths = [200, 100, 100, 100, 100]; // Column widths for DESCRIPTION, PRICE, DISCOUNT, TOTAL, EXTRA
    const gridStartY = doc.y; // Remember the Y position to start the table
    const rowHeight = 20; // Height for each row

    // Define X positions for each column (column grid)
    const colX = [50, 250, 350, 450, 550]; // X positions for each column

    // Draw table header (grid-like)
    doc.fontSize(10).text('DESCRIPTION', colX[0], gridStartY);
    doc.text('PRICE', colX[1], gridStartY, { align: 'right' });
    doc.text('DISCOUNT', colX[2], gridStartY, { align: 'right' });
    doc.text('TOTAL', colX[3], gridStartY, { align: 'right' });
    doc.text('EXTRA', colX[4], gridStartY, { align: 'right' });

    // Draw horizontal line below header to simulate grid separation
    doc.moveTo(50, doc.y + 5).lineTo(600, doc.y + 5).stroke();

    // Draw product rows
    products.forEach((product, index) => {
      const rowY = gridStartY + (index + 1) * rowHeight; // Calculate Y position for each row
      doc.text(product.name, colX[0], rowY);
      doc.text(`${session.currency.toUpperCase()} ${product.price.toFixed(2)}`, colX[1], rowY, { align: 'right' });
      doc.text('-', colX[2], rowY, { align: 'center' });
      doc.text(`${session.currency.toUpperCase()} ${product.price.toFixed(2)}`, colX[3], rowY, { align: 'right' });
      doc.text('Some Extra', colX[4], rowY, { align: 'right' });

      // Draw horizontal line below each row to simulate grid separation
      doc.moveTo(50, rowY + 5).lineTo(600, rowY + 5).stroke();
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
