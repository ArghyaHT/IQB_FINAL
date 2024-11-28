import mongoose from "mongoose";

const salonSettingsSchema  = new mongoose.Schema({
    salonId:{
        type: Number,
        default:0
    },
    advertisements: [
        {
            public_id: {
                type: String
            },
            url: {
                type: String,
            }
        }
    ],
    appointmentSettings:{
        appointmentStartTime:{
            type:String,
             default:""
        },
        appointmentEndTime:{
            type:String,
             default:""
        }, 
        intervalInMinutes:{
            type: Number,
             default:0
        }
    }
},{timestamps: true})

const SalonSettings = mongoose.model("SalonSettings", salonSettingsSchema)

export default SalonSettings;