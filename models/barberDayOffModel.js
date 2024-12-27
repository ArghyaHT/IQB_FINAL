import mongoose from "mongoose";

const barberDayoffSchema = new mongoose.Schema({

    salonId: {
        type: Number,
    },
    barberId: {
        type: Number,
    },
    dayoff: [{
        date:{
            type: Date
        },
        isApproved:{
            type: Boolean,
        },
        reason:{
            type: String,
        }
    }]

},{timestamps:true})

const BarberDayOff = mongoose.model('BarberDayOff', barberDayoffSchema);

export default BarberDayOff;