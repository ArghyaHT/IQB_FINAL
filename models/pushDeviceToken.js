import mongoose from "mongoose";

const pushDeviceTokenSchema = new mongoose.Schema({
    salonId:{
        type: Number,
    },
    name:{
        type: String,
    },
    email: {
        type: String,
    },
    deviceToken:{
        type:String
    },

    deviceType: {
        type: String,
        enum: ['android', 'ios'], // Allowed values
    }
    
},{ timestamps: true })

const PushDevices = mongoose.model('PushDevices', pushDeviceTokenSchema);

export default PushDevices;