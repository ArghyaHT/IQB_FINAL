import mongoose from "mongoose";

const userTokenSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    type:{
        type:String
    },
    webFcmToken : {
        type:String
    },
    androidFcmToken : {
        type:String
    },
    iosFcmToken:{
        type: String
    }
    
    
})

const UserTokenTable = mongoose.model('UserTokenTable', userTokenSchema);

export default UserTokenTable;