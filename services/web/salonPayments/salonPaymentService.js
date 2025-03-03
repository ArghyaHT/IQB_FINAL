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


// Function to check and process expired salon payments
export const checkSalonPaymentExpiryDate = async () => {
    try {
        const today = Math.floor(Date.now() / 1000); // Current timestamp (Unix time)

        while (true) {
            // Find an expired payment and mark it as processing atomically
            const payment = await SalonPayments.findOneAndUpdate(
                { 
                    paymentExpiryDate: { $lte: today.toString() },  // Convert `today` to string if needed
                    isProcessing: { $ne: true }  // Only process if not already marked
                },
                { $set: { isProcessing: true } },  // Mark as processing
                { new: true } 
            );

            if (!payment) break; // No expired payments left

            console.log(`Processing Payment ID: ${payment._id}`);

            // Check if the payment is already moved to history
            const existingHistory = await SalonPaymentsHistory.findOne({
                salonId: payment.salonId,
                invoiceNumber: payment.invoiceNumber
            });

            if (existingHistory) {
                console.log(`Skipping duplicate history entry for Payment ID: ${payment._id}`);
                continue;
            }

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
                purchaseDate: Number(payment.purchaseDate),
                paymentExpiryDate: Number(payment.paymentExpiryDate), // Convert to number
                products: payment.products,
            });

            console.log(`Moved to History: ${payment._id}`);

            // Delete from active payments
            await SalonPayments.deleteOne({ _id: payment._id });
            console.log(`Deleted from SalonPayments: ${payment._id}`);
        }
    } catch (error) {
        console.error("Error checking salon payment expiry:", error);
    }
};