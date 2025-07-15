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
     salonLogo: {
        type: [{
            public_id: {
                type: String
            },
            url: {
                type: String,
                default: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1743597098/iqb_borderless_ivi965.jpg",
            }
        }],
        default: [{}]
    },


   }]
},{ timestamps: true })

const Notification = mongoose.model("Notification",notificationSchema)

export default Notification;