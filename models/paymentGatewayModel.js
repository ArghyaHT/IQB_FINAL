import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    salonId: {
        type: Number,
        default: 0
    },

},{ timestamps: true })

const SalonPayments = mongoose.model("SalonPayments", paymentSchema)

export default SalonPayments;