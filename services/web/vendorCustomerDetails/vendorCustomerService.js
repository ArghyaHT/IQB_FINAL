import VendorCustomerPayments from "../../../models/vendorCustomerModel.js"

export const vendorCustomerPayment = async(paymentData) => {
    const newPayment = new VendorCustomerPayments({

        salonId: paymentData.salonId,
        salonName: paymentData.salonName,
        vendorEmail: paymentData.vendorEmail,
        vendorAccountId: paymentData.vendorAccountId,
        purchaseDate: paymentData.purchaseDate,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        amount: paymentData.amount_total / 100, // Convert from cents
        isoCurrencyCode: paymentData.isoCurrencyCode,
        currency: paymentData.currency,
        paymentIntentId: paymentData.paymentIntentId,
        status: paymentData.status,
        products: paymentData.products,
        
    })

    await newPayment.save();

}