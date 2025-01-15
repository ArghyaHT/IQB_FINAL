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

  const logoPath = path.resolve(__dirname, '../../utils/images/IQB-Logo.png'); // Adjusted to your relative path
  doc.image(logoPath, 50, 30, { width: 100 });
  
  // Adjust the Y-axis positions for the header and subsequent content
  const headerY = 150;  // Adjusted header Y position below the logo
  
  // Header Section
  doc.fontSize(16).text('IQueueBook', 50, headerY);
  doc.fontSize(10).text('16 Raffles Quay, #33-02, Hong Leong Building, Singapore 48581', 50, headerY + 20);
  doc.text('Singapore', 50, headerY + 35);
  doc.text('Registration No.: 9919SGP29004OSJ', 50, headerY + 50);
  
  // Invoice Details (Right-aligned)
  const detailsX = 400;
  const detailsY = headerY;
  doc.fontSize(14).text('INVOICE', detailsX, detailsY);
  doc.fontSize(10)
    .text(`Invoice #: ${invoice}`, detailsX, detailsY + 15)
    .text(`Invoice Issued: ${moment().format('DD MMM, YYYY')}`, detailsX, detailsY + 30)
    .text(`Invoice Amount: ${salon.currency}${(session.amount_total / 100).toFixed(2)}`, detailsX, detailsY + 45)
    .text(`Status: ${session.payment_status.toUpperCase()}`, detailsX, detailsY + 60);
  
  // Billed To Section
  const billedToY = headerY + 70; // Adjust Y-axis to position it below the previous sections
// Draw a straight horizontal line for the section
doc.moveTo(70, billedToY - 5) // Move slightly above for better alignment
   .lineTo(550, billedToY - 5) // Keep the same Y-coordinate for a straight line
   .stroke();  doc.fontSize(12).text('BILLED TO', 50, billedToY + 10, { underline: true });
  doc.fontSize(10).text(session.customer_details.name, 50, billedToY + 30);
  doc.text(session.customer_details.email, 50, billedToY + 50);
  
  // Table Header
  const tableTop = billedToY + 70;
  const colWidths = { description: 200, price: 100, discount: 100, total: 100, tax: 100 };
  doc.fontSize(10)
    .text('DESCRIPTION', 50, tableTop, { width: colWidths.description, ellipsis: true })
    .text('PRICE', 150, tableTop, { align: 'left', width: colWidths.price })
    .text('DISCOUNT', 250, tableTop, { align: 'left', width: colWidths.discount })
    .text('TAX (18%)', 350, tableTop, { align: 'left', width: colWidths.tax })
    .text('TOTAL', 450, tableTop, { align: 'left', width: colWidths.total });
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
  
  // Table Rows
  let currentY = tableTop + 20;
  products.forEach((product) => {
    doc.text(product.name, 50, currentY, { width: colWidths.description, ellipsis: true })
      .text(`${salon.currency}${product.price.toFixed(2)}`, 150, currentY, { align: 'left' })
      .text('-', 250, currentY, { align: 'left' })
      .text(`${salon.currency}${(product.price * 0.18).toFixed(2)}`, 350, currentY, { align: 'left' })
      .text(`${salon.currency}${product.price.toFixed(2)}`, 450, currentY, { align: 'left' });
  
    currentY += 20;
  
    // Add row separator
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
  });
  
  // Summary Section
  const summaryStartY = currentY + 30;
  const total = products.reduce((sum, p) => sum + p.price, 0);
  const tax = total * 0.18;
  const grandTotal = total + tax;
  
  const summaryX = 450; // Adjust this value as needed for proper alignment on the right side
  
  doc.fontSize(10)
    .text(`Total excl. Tax: ${salon.currency}${total.toFixed(2)}`, summaryX, summaryStartY, { align: 'left' })
    .text(`Tax @ 18%: ${salon.currency}${tax.toFixed(2)}`, summaryX, summaryStartY + 15, { align: 'left' })
    .text(`Total incl. Tax: ${salon.currency}${grandTotal.toFixed(2)}`, summaryX, summaryStartY + 30, { align: 'left' })
    .text(`Payments: ${salon.currency}${grandTotal.toFixed(2)}`, summaryX, summaryStartY + 45, { align: 'left' })
    .text(`Amount Due: ${salon.currency}0.00`, summaryX, summaryStartY + 60, { align: 'left' });
  
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
