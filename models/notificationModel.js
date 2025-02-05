import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
   email:{
    type: String
   },
   sentNotifications:[{
    title:{
        type: String,
         default:""
    },
    body:{
        type: String,
         default:""
    },
    time:{
        type: Date
    },
    type:{
        type: String,
        enum: ['Queueing','Appointment', 'Promotional']
    },
    isSeen:{
        type: Boolean,
        default: false
    },

   }]
},{ timestamps: true })

const Notification = mongoose.model("Notification",notificationSchema)

export default Notification;