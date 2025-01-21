import mongoose from "mongoose";

const vendorCustomerSchema = new mongoose.Schema({
    salonId: {
        type: Number,
    },
    salonName: {
        type: String
    },
    vendorEmail: {
        type: String
    },
    vendorAccountId: {
        type: String
    },
    customerName: {
        type: String
    },
    customerEmail: {
        type: String
    },
    currency: {
        type: String
    },
    isoCurrencyCode: {
        type: String
    },
    purchaseDate: {
        type: Date
    },
    amount: {
        type: Number
    },
    paymentIntentId: {
        type: String
    },
    status: {
        type: String
    },
    product: [{
        name: {
            type: String
        },
        price: {
            type: Number
        },
        currency: {
            type: String
        },
        quantity: {
            type: Number
        }
    }]

}, { timestamps: true })

const VendorCustomerPayments = mongoose.model("VendorCustomerPayments", vendorCustomerSchema)

export default VendorCustomerPayments;
