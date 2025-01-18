import mongoose from "mongoose";
import crypto from "crypto"

const adminSchema = new mongoose.Schema({
    salonId: {
        type: Number,
        default: 0
    },
    registeredSalons: [{
        type: Number
    }],
    name: {
        type: String,
        default: ""
    },
    email: {
        type: String,
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        // required:true
    },
    password: {
        type: String,
    },
    role: {
        type: String
    },
    AuthType: {
        type: String,
        default: "local"
    },
    gender: {
        type: String,
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

    dateOfBirth: {
        type: Date,
        default: ""
    },
    mobileNumber: {
        type: Number,
    },
    mobileCountryCode: {
        type: Number
    },

    mobileVerified: {
        type: Boolean,
        default: false
    },
    adminSellerId: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: false
    },


    vendorAccountDetails: {
        vendorEmail: {
            type: String,
        },
        vendorAccountId: {
            type: String,
        },
        vendorCountry: {
            type: String,
        },
        vendorCurrency: {
            type: String,
        },
        vendorCardPaymentStatus: {
            type: String,
        },
        vendorTransferStatus: {
            type: String,
        }
    },
    
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });
//Generating Password Reset Token
adminSchema.methods.getResetPasswordToken = function () {

    //generate token
    const resetToken = crypto.randomBytes(20).toString("hex")

    //Hashing and adding resetPasswordtoken to userSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    //We return this because when user click then this resetPasswordToken will form .so thast why 
    return resetToken
}
const Admin = mongoose.model('Admin', adminSchema);

export default Admin;