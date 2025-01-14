import fs from "fs"
import PDFDocument from "pdfkit"
import path from "path";
import moment from "moment";
import { fileURLToPath } from 'url';
import { getSalonBySalonId } from "../../services/mobile/salonServices.js";
import SalonPayments from "../../models/salonPaymnetsModel.js";
import chrome from "html-pdf-chrome"


// Define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = async (invoice, session, products) => {
  const salon = await getSalonBySalonId(session.metadata.salonId);
  const invoiceDate = moment().format('DD-MM-YYYY');
  const amount = (session.amount_total / 100).toFixed(2);

  // Write the HTML content
  let htmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .invoice-container {
            margin: 50px;
          }
          .header, .footer {
            text-align: center;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .table th, .table td {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .summary {
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>IQueueBook</h1>
            <p>16 Raffles Quay, #33-02, Hong Leong Building, Singapore 48581</p>
            <p>Singapore</p>
            <p>Registration No.: 9919SGP29004OSJ</p>
          </div>

          <div class="invoice-info" style="text-align: right;">
            <h2>INVOICE</h2>
            <p><strong>Invoice #: </strong>${invoice}</p>
            <p><strong>Invoice Issued: </strong>${invoiceDate}</p>
            <p><strong>Invoice Amount: </strong>${session.currency.toUpperCase()} ${amount}</p>
            <p><strong>Payment Status: </strong>${session.payment_status.toUpperCase()}</p>
          </div>

          <div class="billing-info">
            <h3>BILLED TO</h3>
            <p>${session.customer_details.name}</p>
            <p>${session.customer_details.email}</p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Extra</th>
              </tr>
            </thead>
            <tbody>
  `;

  // Add product rows
  products.forEach(product => {
    htmlContent += `
      <tr>
        <td>${product.name}</td>
        <td>${session.currency.toUpperCase()} ${product.price.toFixed(2)}</td>
        <td>-</td>
        <td>${session.currency.toUpperCase()} ${product.price.toFixed(2)}</td>
        <td>Some Extra</td>
      </tr>
    `;
  });

  // Add summary section
  const total = products.reduce((sum, product) => sum + product.price, 0);
  const tax = total * 0.18; // Assuming 18% GST
  const grandTotal = total + tax;

  htmlContent += `
            </tbody>
          </table>

          <div class="summary">
            <p><strong>Total excl. Tax: </strong>${session.currency.toUpperCase()} ${total.toFixed(2)}</p>
            <p><strong>Tax @ 18%: </strong>${session.currency.toUpperCase()} ${tax.toFixed(2)}</p>
            <p><strong>Total: </strong>${session.currency.toUpperCase()} ${grandTotal.toFixed(2)}</p>
            <p><strong>Payments: </strong>${session.currency.toUpperCase()} -${grandTotal.toFixed(2)}</p>
            <p><strong>Amount Due: </strong>${session.currency.toUpperCase()} 0.00</p>
          </div>

          <div class="footer">
            <p>Thank you for choosing IQueueBook!</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Generate PDF using chrome-headless
  const pdf = await chrome.create().fromHTML(htmlContent).toPdf();
  const invoicePath = path.resolve(__dirname, 'invoice.pdf');
  await chrome.create().fromHTML(htmlContent).toFile(invoicePath);

  return invoicePath;
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
