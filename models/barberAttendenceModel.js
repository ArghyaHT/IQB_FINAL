import mongoose from "mongoose";

const barberAttendenceSchema = new mongoose.Schema ({
    salonId: {
        type: Number,
        default: 0
    },
    barberId: {
        type: Number,
        default: 0

    },
    attendance: [{
        day: {
            type: String,
            default: ""
        },
        date: {
            type: String,
            default: ""
           
        },
        signInTime: {
            type: String,
            default: ""
        },
        signOutTime: {
            type: String,
            default: ""
        }
    }]
}, { timestamps: true })

const BarberAttendance = mongoose.model("BarberAttendance", barberAttendenceSchema);

export default BarberAttendance;