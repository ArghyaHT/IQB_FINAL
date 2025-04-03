import mongoose from "mongoose";

const clientLeadsSchema = new mongoose.Schema({

    name:{
        type:String
    },
    email:{
        type:String
    },
    mobileCountryCode:{
        type: Number
    },
    mobileNumber:{
        type: Number
    },
    message:{
        type: String
    }
   
},{timestamps:true})


const ClientLeads = mongoose.model('ClientLeads', clientLeadsSchema);

export default ClientLeads;