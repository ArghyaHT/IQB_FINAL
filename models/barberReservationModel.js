import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    salonId:{
        type: Number
    },
    barberId: {
        type: Number
    },
    reservations:[
        {
            date:{
                type: Date
            },
            startTime:{
                type: String
            },
            endTime:{
                type: String
            },
        }
    ] 
},{timestamps:true})


const BarberReservation = mongoose.model('BarberReservation', reservationSchema);

export default BarberReservation;
