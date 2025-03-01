import Stripe from "stripe";
import { vendorCustomerPayment } from "../../../services/web/vendorCustomerDetails/vendorCustomerService.js";
import { generateInvoiceNumber } from "../../../utils/invoice/invoicepdf.js";
import { getSalonBySalonId } from "../../../services/web/admin/salonService.js";
import Salon from "../../../models/salonRegisterModel.js";
import { salonPayments } from "../../../services/web/salonPayments/salonPaymentService.js";
import { sendPaymentSuccesEmail } from "../../../utils/emailSender/emailSender.js";
import Admin from "../../../models/adminRegisterModel.js";
import moment from "moment";

const stripe = Stripe("sk_test_51QiEoiBFW0Etpz0PlD0VAk8LaCcjOtaTDJ5vOpRYT5UqwNzuMmacWYRAl9Gzvf4HGXH9Lbva9BOWEaH9WHvz1qNb00nkfkXPna")

const endpointSecret = "whsec_pKv2A3YHgbW0MkJOKVgISTXZjtLoBNYX";

const saveAccountEndpointSecret = "whsec_DI2vfnOkeWPhrsuIpX1S3gzNf5mw2ArF"


export const handleStripeWebhook = async(request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {

    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // console.log(session)

    const paymentIntentId = session.payment_intent;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const vendorAccountId = session.metadata.vendorAccountId
    const paymentStatus = paymentIntent.status

    const purchaseDate = Math.floor(Date.now() / 1000); // Convert to Unix timestamp

    if (vendorAccountId && paymentStatus === "succeeded") {

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const products = lineItems.data.map((item) => ({
        productName: item.description,
        quantity: item.quantity,
        price: item.amount_total / 100, // Amount in dollars (converted from cents)
        currency: session.currency,
      }));

      const salonId = Number(session.metadata.salonId);

      // Access additional data from metadata
      const paymentData = {
        salonId: salonId,
        salonName: session.metadata.salonName,
        vendorEmail: session.metadata.adminEmail,
        vendorAccountId: session.metadata.vendorAccountId,
        purchaseDate: moment.unix(purchaseDate).format('YYYY-MM-DD'),
        customerEmail: session.metadata.customerEmail,
        customerName: session.metadata.customerName,
        amount: session.amount_total / 100, // Convert from cents
        isoCurrencyCode: session.metadata.isoCurrencyCode,
        currency: session.metadata.currency,
        paymentIntentId: session.payment_intent,
        status: session.payment_status,
        products: products,
      };

      console.log(paymentData)

      await vendorCustomerPayment(paymentData)

    }
    else {

      // akhane pae 
      //paymentIntentId: session.payment_intent,

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const products = lineItems.data.map((item) => ({
        productName: item.description,
        quantity: item.quantity,
        productPrice: item.amount_total / 100, // Amount in dollars (converted from cents)
        currency: session.currency,
      }));

      const invoice = await generateInvoiceNumber()

      // Access additional data from metadata
      const paymentData = {
        salonId: Number(session.metadata.salonId),
        adminEmail: session.metadata.adminEmail,
        invoiceNumber: invoice,
        paymentType: session.metadata.paymentType,
        purchaseDate: moment.unix(purchaseDate).format('YYYY-MM-DD'),
        planValidity: Number(session.metadata.planValidityDate),
        customerEmail: session.customer_details.email,
        customerName: session.customer_details.name,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency,
        paymentIntentId: session.payment_intent,
        status: session.payment_status,
        products: products,
      };

      // Fetch the salon
      const salon = await getSalonBySalonId(session.metadata.salonId);
      if (!salon) {
        throw new Error("Salon not found");
      }

      // Ensure `subscriptions` array exists
      if (!Array.isArray(salon.subscriptions)) {
        salon.subscriptions = [];
      }

      const paymentDaysToAdd = parseInt(paymentData.planValidity, 10); // Number of days to add

      // Iterate through products and update subscriptions separately
      for (const product of products) {
        if (product.productName === "Queue") {
          salon.isQueuing = true;

          const queueSubscription = salon.subscriptions.find(sub => sub.name === "Queue");
          const existingQueueExpiryDate = queueSubscription && queueSubscription.trial !== "Free"
            ? (queueSubscription.expirydate ? parseInt(queueSubscription.expirydate, 10) : purchaseDate)
            : purchaseDate;

          const newQueueExpiryDate = moment.unix(existingQueueExpiryDate).add(paymentDaysToAdd, 'days').unix();

          if (queueSubscription) {
            queueSubscription.trial = session.metadata.paymentType;
            queueSubscription.planValidity = paymentDaysToAdd;
            queueSubscription.expirydate = newQueueExpiryDate;
            queueSubscription.paymentIntentId = paymentData.paymentIntentId;
            queueSubscription.bought = "Renewal";
          } else {
            salon.subscriptions.push({
              name: "Queue",
              trial: session.metadata.paymentType,
              planValidity: paymentDaysToAdd,
              paymentIntentId:paymentData.paymentIntentId,
              expirydate: newQueueExpiryDate,
              bought: "Renewal"
            });
          }

          // Save updated salon details
          await salon.save();

          // Save Queue payment
          await salonPayments(paymentData, newQueueExpiryDate);

          const emailSubject = ` Payment Confirmation - ${salon.salonName}`;
          const emailBody = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Payment Confirmation</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto&display=swap" rel="stylesheet">

              <style>
              body {
                     font-family: 'Poppins', sans-serif;
                     margin: 0;
                     padding: 0;
                     background-color: #f9f9f9;
                     color: #000,
                  }
                  .container {
                      max-width: 600px;
                      margin: 20px auto;
                      padding: 20px;
                      background-color: #ffffff;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  }
                  .header {
                      text-align: center;
                      margin-bottom: 20px;
                  }
                  .logo img {
                      max-width: 150px;
                      border-radius: 50%;
                      width: 150px;
                      height: 150px;
                      object-fit: cover;
                  }
                  .email-content {
                      padding: 20px;
                      background-color: #f8f8f8;
                      font-size: 1rem;
                      border-radius: 10px;
                  }
                  ul {
                      padding-left: 20px;
                  }
                  li {
                      margin-bottom: 8px;
                  }
                  p {
                      line-height: 1.6;
                  }
                  .footer {
                      margin-top: 20px;
                      font-size: 0.9em;
                      text-align: center;
                      color: #888888;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="email-content">
                  <div class="header">
                      <h1>Payment Confirmation</h1>
                  </div>
                      <p>Dear ${session.customer_details.name},</p>
                      <p>Thank you for your payment at <strong>${salon.salonName}</strong>. Below are the details of your transaction:</p>
                      <ul>
                          <li><strong>Purchase Date:</strong> ${moment.unix(purchaseDate).format('YYYY-MM-DD')}</li>
                          <li><strong>Expiry Date:</strong> ${moment.unix(newQueueExpiryDate).format('YYYY-MM-DD')}</li>
                          <li><strong>Total Amount Paid:</strong> ${session.currency.toUpperCase()} ${session.amount_total / 100}</li>
                          <li><strong>Product Purchased:</strong> ${product.productName}</li>
                      </ul>
                      <p>If you have any questions or need further assistance, feel free to contact us.</p>
                      <p>Best regards,</p>
                      <p>
                          <strong>IQueueBook</strong><br>
                          <strong>support@iqueuebarbers.com</strong> 
                      </p>
                  </div>
                  <div class="footer">
                      &copy; ${new Date().getFullYear()} IQueueBook. All rights reserved.
                  </div>
              </div>
          </body>
          </html>
          `;

          try {
            sendPaymentSuccesEmail(session.customer_details.email, emailSubject, emailBody, invoice, paymentData, products);
            console.log("Payment Email Sent")
            return
          } catch (error) {
            console.error('Error sending email:', error);
            return
          }

        }
        else if (product.productName === "Appointment") {
          salon.isAppointments = true;

          const appointmentSubscription = salon.subscriptions.find(sub => sub.name === "Appointment");
          const existingAppointmentExpiryDate = appointmentSubscription && appointmentSubscription.trial !== "Free"
            ? (appointmentSubscription.expirydate ? parseInt(appointmentSubscription.expirydate, 10) : purchaseDate)
            : purchaseDate;

          const newAppointmentExpiryDate = moment.unix(existingAppointmentExpiryDate).add(paymentDaysToAdd, 'days').unix();

          if (appointmentSubscription) {
            appointmentSubscription.trial = session.metadata.paymentType;
            appointmentSubscription.planValidity = paymentDaysToAdd;
            appointmentSubscription.expirydate = newAppointmentExpiryDate;
            appointmentSubscription.paymentIntentId = paymentData.paymentIntentId;
            appointmentSubscription.bought = "Renewal";
          } else {
            salon.subscriptions.push({
              name: "Appointment",
              trial: session.metadata.paymentType,
              planValidity: paymentDaysToAdd,
              paymentIntentId: paymentData.paymentIntentId,
              expirydate: newAppointmentExpiryDate,
              bought: "Renewal"
            });
          }

          // Save updated salon details
          await salon.save();

          // Save Appointment payment
          await salonPayments(paymentData, newAppointmentExpiryDate);

          const emailSubject = ` Payment Confirmation - ${salon.salonName}`;
          const emailBody = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Payment Confirmation</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto&display=swap" rel="stylesheet">

              <style>
              body {
                     font-family: 'Poppins', sans-serif;
                     margin: 0;
                     padding: 0;
                     background-color: #f9f9f9;
                     color: #000,
                  }
                  .container {
                      max-width: 600px;
                      margin: 20px auto;
                      padding: 20px;
                      background-color: #ffffff;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  }
                  .header {
                      text-align: center;
                      margin-bottom: 20px;
                  }
                  .logo img {
                      max-width: 150px;
                      border-radius: 50%;
                      width: 150px;
                      height: 150px;
                      object-fit: cover;
                  }
                  .email-content {
                      padding: 20px;
                      background-color: #f8f8f8;
                      font-size: 1rem;
                      border-radius: 10px;
                  }
                  ul {
                      padding-left: 20px;
                  }
                  li {
                      margin-bottom: 8px;
                  }
                  p {
                      line-height: 1.6;
                  }
                  .footer {
                      margin-top: 20px;
                      font-size: 0.9em;
                      text-align: center;
                      color: #888888;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="email-content">
                  <div class="header">
                      <h1>Payment Confirmation</h1>
                  </div>
                      <p>Dear ${session.customer_details.name},</p>
                      <p>Thank you for your payment at <strong>${salon.salonName}</strong>. Below are the details of your transaction:</p>
                      <ul>
                          <li><strong>Purchase Date:</strong> ${moment.unix(session.metadata.purchaseDate).format('YYYY-MM-DD')}</li>
                          <li><strong>Expiry Date:</strong> ${moment.unix(newExpiryDate).format('YYYY-MM-DD')}</li>
                          <li><strong>Total Amount Paid:</strong> ${session.currency.toUpperCase()} ${session.amount_total / 100}</li>
                          <li><strong>Product Purchased:</strong> ${product.productName}</li>
                      </ul>
                      <p>If you have any questions or need further assistance, feel free to contact us.</p>
                      <p>Best regards,</p>
                      <p>
                          <strong>IQueueBook</strong><br>
                          <strong>support@iqueuebarbers.com</strong> 
                      </p>
                  </div>
                  <div class="footer">
                      &copy; ${new Date().getFullYear()} IQueueBook. All rights reserved.
                  </div>
              </div>
          </body>
          </html>
          `;

          try {
            sendPaymentSuccesEmail(session.customer_details.email, emailSubject, emailBody, invoice, paymentData, products);
            console.log("Payment Email Sent")
            return
          } catch (error) {
            console.error('Error sending email:', error);
            return
          }

        }
      }

    }
  }
  response.status(200).json({ received: true });
}

export const saveaccountid = async(req, res) => {
    let event;

    try {
      // Verify the webhook signature to ensure it's from Stripe
      const signature = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, signature, saveAccountEndpointSecret);
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
  
    if (event.type === 'account.updated') {
      const account = event.data.object;
  
      if (
        account.requirements.currently_due.length === 0 && // No remaining requirements
        account.capabilities.transfers === 'active' // Account is fully activated for transfers
      ) {
  
        const vendorEmail = account.email
        const vendorAccountId = account.id
        const vendorCountry = account.country
        const vendorCurrency = account.default_currency
        const vendorCardPaymentStatus = account.capabilities.card_payments
        const vendorTransferStatus = account.capabilities.transfers
  
  
        const updatedAdminVendorDetails = await Admin.findOneAndUpdate(
          { email: vendorEmail }, // Match condition
          {
            $set: {
              "vendorAccountDetails.vendorEmail": vendorEmail,
              "vendorAccountDetails.vendorAccountId": vendorAccountId,
              "vendorAccountDetails.vendorCountry": vendorCountry,
              "vendorAccountDetails.vendorCurrency": vendorCurrency,
              "vendorAccountDetails.vendorCardPaymentStatus": vendorCardPaymentStatus,
              "vendorAccountDetails.vendorTransferStatus": vendorTransferStatus
            }
          },
          { new: true, upsert: true } // Options to return updated document and insert if not found
        );
  
        return
      }
  
      return res.status(200).send('Webhook processed');
    } else {
      // Ignore other events
      return res.status(200).send('Event ignored');
    }
  
}