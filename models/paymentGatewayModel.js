import mongoose from "mongoose";

// const paymentSchema = new mongoose.Schema({
//     salonEmail: {
//         type: String,
//         default: ""
//     },
//     amount: {
//         type: Number,
//         default: 0
//     },
//     currency: {
//         type: String,
//         default: ""
//     },
//     paymentIntentId: {
//         type: String,
//         default: ""
//     },
//     status: {
//         type: String,
//         default: ""
//     },
//     products: [
//         {
//             name: {
//                 type: String,
//                 default: ""
//             },
//             // quantity: Number,
//             price:{
//                 type: Number,
//                 default: 0
//             },
//             currency:{
//                 type: String,
//                 default: ""
//             }, 
//             paymentDate:{
//                 type: Date,

//             }, 
//             paymentExpiry:{
//                 type: Date,

//             }        
//         },
//     ],
// }, { timestamps: true })
// Define the Payment schema and model
const PaymentSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    amount: Number,
    currency: String,
    paymentIntentId: String,
    status: String,
    products: [
      {
        name: String,
        quantity: Number,
        price: Number,
        currency: String,
      },
    ],
    createdAt: { type: Date, default: Date.now },
});

const SalonPayments = mongoose.model("SalonPayments", PaymentSchema)

export default SalonPayments;