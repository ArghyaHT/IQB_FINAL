import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
salonId: {
    type: Number
},
appointmentList:[{
    barberId:{
        type: Number
    },
    serviceId:{
        type: String
    },
    appointmentNotes:{
        type: String
    },
    appointmentDate:{
        type: Date
    },
    startTime:{
        type: String
    },
    endTime:{
        type: String
    },
    timeSlots:{
        type: String
    },
    customerEmail:{
        type: String
    },
    customerName:{
        type: String
    },
    customerType:{
        type: String
    },
    methodUsed:{
        type: String
    }
}]
},{timestamps:true})

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;