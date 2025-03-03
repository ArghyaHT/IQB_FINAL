import SalonPaymentsHistory from "../../../models/salonPaymentsHistoryModel.js";
import SalonPayments from "../../../models/salonPaymnetsModel.js";

export const salonPayments = async(paymentData, newExpiryDate) =>{
    // Create a new SalonPayments document with the payment data as a single entity
const newPayment = new SalonPayments({
    salonId: paymentData.salonId,
    invoiceNumber: paymentData.invoiceNumber,
    adminEmail: paymentData.adminEmail,
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    amount: paymentData.amount,
    currency: paymentData.currency,
    paymentIntentId: paymentData.paymentIntentId,
    status: paymentData.status,
    paymentType: paymentData.paymentType,
    purchaseDate: paymentData.purchaseDate,
    paymentExpiryDate: newExpiryDate,
    products: paymentData.products, // This will be an array of products
  });
  
  // Save the new payment document directly
  await newPayment.save();
}


export const getSalonPaymentsBySalonId = async(salonId) => {
  const salonpayments = await SalonPayments.find({salonId})

  return salonpayments
}


export const checkSalonPaymentExpiryDate = async () => {
  try {
      // Get today's date in Unix timestamp format
      const today = Math.floor(Date.now() / 1000);

      // Fetch all salon payments
      const salonPayments = await SalonPayments.find();

      for (const payment of salonPayments) {
          const paymentExpiryDate = Number(payment.paymentExpiryDate); // Convert string to number

          if (paymentExpiryDate <= today) {

            console.log(`Processing Payment ID: ${payment._id}`);
            console.log(`Payment Expiry Date: ${paymentExpiryDate}`);
            console.log(`Today's Date: ${today}`);
            
              try {
                  // Move to history
                  await SalonPaymentsHistory.create({
                      salonId: payment.salonId,
                      invoiceNumber: payment.invoiceNumber,
                      adminEmail: payment.adminEmail,
                      customerName: payment.customerName,
                      customerEmail: payment.customerEmail,
                      amount: payment.amount,
                      currency: payment.currency,
                      paymentIntentId: payment.paymentIntentId,
                      status: payment.status,
                      paymentType: payment.paymentType,
                      purchaseDate: Number(payment.purchaseDate), // Convert purchaseDate to number
                      paymentExpiryDate: paymentExpiryDate,
                      products: payment.products,
                  });

                  console.log(`Moved to History: ${payment._id}`);

                  // Delete from active payments
                  await SalonPayments.deleteOne({ _id: payment._id });
                  console.log(`Deleted from SalonPayments: ${payment._id}`);
              } catch (error) {
                  console.error(`Error processing payment ID ${payment._id}:`, error);
              }
          }
      }
  } catch (error) {
      console.error("Error checking salon payment expiry:", error);
  }
};
