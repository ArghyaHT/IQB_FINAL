import mongoose from "mongoose";

const barberDayoffSchema = new mongoose.Schema({

    salonId: {
        type: Number,
    },
    barberId: {
        type: Number,
    },
    barberOffDays: {
        type: [Date], // Directly store an array of strings
    }

},{timestamps:true})

const BarberDayOff = mongoose.model('BarberDayOff', barberDayoffSchema);

export default BarberDayOff;