import mongoose from "mongoose";


const paymentSchema = new mongoose.Schema({
    salonId:{
        type: Number
    },
    payments:[{
        startDate:{
            type: Date,
        },
        endDate:{
            type:Date
        },
        isQueuingPaid:{
            type: Boolean,
            default: false
        },
        isAppointmentsPaid:{
            type: Boolean,
            default: false
        },
        payment:{
            type: Number
        }
    }]
},{timestamps:true})

const Payments = mongoose.model('Payments', paymentSchema);

export default Payments;