import mongoose from "mongoose";

const barberAppointmentDaysSchema = new mongoose.Schema({
    salonId: {
        type: Number,
    },
    barberId: {
        type: Number,
    },
    appointmentDays: {
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
},{timestamps:true});

const BarberAppointmentDays = mongoose.model('BarberAppointmentDays', barberAppointmentDaysSchema);

export default BarberAppointmentDays;