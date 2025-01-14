import fs from "fs"
import PDFDocument from "pdfkit"
import path from "path";
import moment from "moment";
import { fileURLToPath } from 'url';
import { getSalonBySalonId } from "../../services/mobile/salonServices.js";


// Define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate the invoice PDF
export const generateInvoicePDF = async (session, products) => {

    const salon = await getSalonBySalonId(session.metadata.salonId)

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const invoicePath = path.resolve(__dirname, 'invoice.pdf');
  
      const writeStream = fs.createWriteStream(invoicePath);
      writeStream.on('finish', () => resolve(invoicePath));
      writeStream.on('error', reject);
  
      doc.pipe(writeStream);
  
      // Invoice Header
      doc.fontSize(18).text('Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice Date: ${moment().format('YYYY-MM-DD')}`);
      doc.text(`Customer: ${session.customer_details.name}`);
      doc.text(`Salon: ${salon.salonName}`);
      doc.text('----------------------------------------');
  
      // Payment Details
      doc.text(`Amount Paid: ${session.currency.toUpperCase()} ${session.amount_total / 100}`);
      doc.text(`Payment Status: ${session.payment_status}`);
      
      // Products List
      doc.text('Products Purchased:');
      products.forEach(product => {
        doc.text(`${product.name} - Price: ${product.price} ${session.currency.toUpperCase()}`);
      });
  
      // Footer
      doc.moveDown();
      doc.text('All the best for your business!', { align: 'center' });
  
      doc.end(); // Finalize the document
    });
  };
  