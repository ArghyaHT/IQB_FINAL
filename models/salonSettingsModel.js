import mongoose from "mongoose";

const salonSettingsSchema  = new mongoose.Schema({
    salonId:{
        type: Number
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
            type:String
        },
        appointmentEndTime:{
            type:String
        }, 
        intervalInMinutes:{
            type: Number
        }
    }
},{timestamps: true})

const SalonSettings = mongoose.model("SalonSettings", salonSettingsSchema)

export default SalonSettings;