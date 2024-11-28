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
    }
   }]
},{ timestamps: true })

const Notification = mongoose.model("Notification",notificationSchema)

export default Notification;