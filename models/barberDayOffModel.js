import mongoose from "mongoose";

const barberDayoffSchema = new mongoose.Schema({

    salonId: {
        type: Number,
    },
    barberId: {
        type: Number,
    },
    dayoff: [{
        fromDate: {
            type: Date,
        },
        toDate: {
            type: Date,
        }
    }]

},{timestamps:true})

const BarberDayOff = mongoose.model('BarberDayOff', barberDayoffSchema);

export default BarberDayOff;