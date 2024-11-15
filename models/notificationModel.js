import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
   email:{
    type: String
   },
   sentNotifications:[{
    title:{
        type: String
    },
    body:{
        type: String
    }
   }]
},{ timestamps: true })

const Notification = mongoose.model("Notification",notificationSchema)

export default Notification;