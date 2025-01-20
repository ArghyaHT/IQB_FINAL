import SalonPayments from "../../../models/salonPaymnetsModel.js";

export const salonPayments = async(paymentData) =>{
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
    paymentExpiryDate: paymentData.paymentExpiryDate,
    isQueuing: paymentData.isQueuing,
    isAppointments: paymentData.isAppointments,
    products: paymentData.products, // This will be an array of products
  });
  
  // Save the new payment document directly
  await newPayment.save();
}


export const getSalonPaymentsBySalonId = async(salonId) => {
  const salonpayments = await SalonPayments.find({salonId})

  return salonpayments
}


export const checkSalonPaymentExpiryDate = async() => {

   // Get today's date in Unix timestamp format
   const today = Math.floor(Date.now() / 1000);

// Fetch all salon payments
    const salonPayments = await SalonPayments.find();

    for (const payment of salonPayments) {
      const paymentExpiryDate = parseInt(payment.paymentExpiryDate, 10);

      if (paymentExpiryDate <= today) {
        // Move the payment to SalonPaymentHistoryModel
        await SalonPaymentHistoryModel.create({
          salonId: payment.salonId,
          adminEmail: payment.adminEmail,
          customerName: payment.customerName,
          customerEmail: payment.customerEmail,
          amount: payment.amount,
          currency: payment.currency,
          paymentIntentId: payment.paymentIntentId,
          status: payment.status,
          paymentType: payment.paymentType,
          purchaseDate: payment.purchaseDate,
          paymentExpiryDate: payment.paymentExpiryDate,
          isQueuing: payment.isQueuing,
          isAppointments: payment.isAppointments,
          products: payment.products,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        });

        // Delete the payment from SalonPayments
        await SalonPayments.deleteOne({ _id: payment._id });
      }
    }

}