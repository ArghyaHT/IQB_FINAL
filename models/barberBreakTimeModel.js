import mongoose from "mongoose";

const barberbreakTimeSchema = new mongoose.Schema({
    salonId:{
        type: Number
    },
    barberId: {
        type: Number
    },
    breakTimes:[
        {
            day:{
                type: String
            },
            timeSlot: [
                {
                    startTime: {
                        type: String,
                    },
                    endTime: {
                        type: String,
                    }
                }
            ]      
        }
    ] 
},{timestamps:true})


const BarberBreakTime = mongoose.model('BarberBreakTimes', barberbreakTimeSchema);

export default BarberBreakTime;