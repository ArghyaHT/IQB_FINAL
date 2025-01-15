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