import mongoose from "mongoose";

const productPaymentSchema = new mongoose.Schema({
  salonId: Number,
  invoiceNumber: String,
  adminEmail: String,
  customerName: String,
  customerEmail: String,
  amount: Number,
  currency: String,
  paymentIntentId: String,
  status: String,
  paymentType: {
    type: String,
    enum: ["Free", "Paid"],
    // default: "Free",
  },
  purchaseDate: {
    type: String,
    //   default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  },
  paymentExpiryDate: {
    type: String,
    // default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  },
  isQueuing: {
    type: Boolean,
    default: false,
  },
  isAppointments: {
    type: Boolean,
    default: false,
  },
  products: [
    {
      name: String,
      quantity: Number,
      price: Number,
      currency: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const SalonPayments = mongoose.model("SalonPayments", productPaymentSchema);


export default SalonPayments;
