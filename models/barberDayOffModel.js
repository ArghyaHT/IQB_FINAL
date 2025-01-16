import mongoose from "mongoose";

const barberDayoffSchema = new mongoose.Schema({

    salonId: {
        type: Number,
    },
    barberId: {
        type: Number,
    },
    barberOffDays: {
        type: [String], // Directly store an array of strings
        enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ],
    }


},{timestamps:true})

const BarberDayOff = mongoose.model('BarberDayOff', barberDayoffSchema);

export default BarberDayOff;