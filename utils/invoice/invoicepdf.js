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

      // Header
      doc.fontSize(14).text('IQueueBook', { align: 'left' });
      doc.fontSize(10).text('16 Raffles Quay, #33-02, Hong Leong Building, Singapore 48581', { align: 'left' });
      doc.text('Singapore', { align: 'left' });
      doc.text('Registration No.: 9919SGP29004OSJ', { align: 'left' });
      doc.moveDown();

      // Invoice Information
      doc.fontSize(12).text('INVOICE', { align: 'center' });
      doc.moveDown();
      doc.text(`Invoice #:${invoice}`, { align: 'left' });
      doc.text(`Invoice Issued: ${moment().format('DD-MM-YYYY')}`, { align: 'left' });
      doc.text(`Invoice Amount: ${session.currency.toUpperCase()} ${(session.amount_total / 100).toFixed(2)}`, { align: 'left' });
      doc.text(`Payment Status: ${session.payment_status.toUpperCase()}`, { align: 'left' });
      doc.moveDown();

      // Billing Information
      doc.text('BILLED TO', { underline: true });
      doc.text(`${session.customer_details.name}`, { align: 'left' });
      doc.text(`${session.customer_details.email}`, { align: 'left' });
      doc.moveDown();

      // Product Details (Table Structure)
      doc.text('DESCRIPTION               PRICE               DISCOUNT               TOTAL', { underline: true });
      products.forEach(product => {
          doc.text(`${product.name}          ${product.price}          -          ${product.price}`, { align: 'left' });
      });
      doc.moveDown();

      // Summary
      const total = products.reduce((sum, product) => sum + product.price, 0);
      const tax = total * 0.18; // Assuming 18% GST
      const grandTotal = total + tax;

      doc.text(`Total excl. Tax: ${session.currency.toUpperCase()} ${total.toFixed(2)}`);
      doc.text(`Tax @ 18%: ${session.currency.toUpperCase()} ${tax.toFixed(2)}`);
      doc.text(`Total: ${session.currency.toUpperCase()} ${grandTotal.toFixed(2)}`);
      doc.text(`Payments: ${session.currency.toUpperCase()} -${grandTotal.toFixed(2)}`);
      doc.text(`Amount Due: ${session.currency.toUpperCase()} 0.00`, { align: 'left' });
      doc.moveDown();

      // Footer
      doc.text('Thank you for choosing IQueueBook!', { align: 'center' });

      doc.end();
  });
};


// Function to generate invoice number
export const generateInvoiceNumber = async () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase(); // Get the short month (JAN, FEB, etc.)
  const year = new Date().getFullYear(); // Get current year

  // Find the latest invoice based on invoice number
  const lastInvoice = await SalonPayments.findOne()
    .sort({ "productPayment.invoiceNumber": -1 }); // Sort by invoice number descending

  let newInvoiceNumber = 1;

  if (lastInvoice) {
    const lastInvoiceNumber = parseInt(lastInvoice.productPayment.invoiceNumber.split('-')[2]);
    newInvoiceNumber = lastInvoiceNumber + 1; // Increment the invoice number
  }

  // Format the new invoice number as `IQB-MMM-001`
  return `IQB-${currentMonth}-${String(newInvoiceNumber).padStart(3, '0')}`;
};
  