import mongoose from "mongoose"
import crypto from "crypto"

const customerSchema = new mongoose.Schema({

    salonId: {
        type: Number,
        default: 0
    },
    connectedSalon: [{
        type: Number
    }],
    favoriteSalons: [{
        type: Number
    }],
    customerId: {
        type: Number
    },
    email: {
        type: String,
    },
    emailVerified:{
        type: Boolean,
        default: false
    },
    password: {
        type: String
    },
    AuthType: {
        type: String,
        default: "local"
    },
    name: {
        type: String,
        default: ""
    },
    userName: {
        type: String,
        // required: true
    },
    gender: {
        type: String,
        default:"Male"
    },

    dateOfBirth: {
        type: Date,
    },
    mobileCountryCode:{
        type: Number,
    },
    mobileNumber: {
        type: Number,
        // required: true,
    },
    mobileVerified:{
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        // required:true
    },
    profile: {
        type: [{
            public_id: {
                type: String
            },
            url: {
                type: String,
                default: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg"
            }
        }],
        default: [{}]  // Ensure default value is an array with an object
    },
    fcmToken: {
        type: String
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true })
customerSchema.methods.getResetPasswordToken = function () {

    //generate token
    const resetToken = crypto.randomBytes(20).toString("hex")

    //Hashing and adding resetPasswordtoken to userSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    console.log('Reset Token:', resetToken);
    //We return this because when user click then this resetPasswordToken will form .so thast why 
    return resetToken

}
const Customer = mongoose.model('Customer', customerSchema);

export default Customer;