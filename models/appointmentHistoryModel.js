import mongoose from "mongoose";

const appointmentHistorySchema = new mongoose.Schema({
salonId: {
    type: Number
},
appointmentList:[{
    barberId:{
        type: Number
    },
    services: [{
        serviceId: {
            type: Number
        },
        serviceName: {
            type: String
        },
        servicePrice:{
            type: Number
        },
        barberServiceEWT: {
            type: Number
        }
    }],
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
    },
    status:{
        type:String
    }
}]
},{timestamps:true})

const AppointmentHistory = mongoose.model('AppointmentHistory', appointmentHistorySchema);

export default AppointmentHistory