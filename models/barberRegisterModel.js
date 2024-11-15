import mongoose from "mongoose";
import crypto from "crypto";

const barberSchema = new mongoose.Schema({

    name: {
        type: String,
        // required:true
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
        type: String
    },
    role: {
        type: String
    },
    AuthType: {
        type: String,
        default: "local"
    },
    nickName: {
        type: String,
        // required: true,
    },
    gender: {
        type: String
    },

    mobileNumber: {
        type: Number,
        // required: true,
    },
    mobileVerified: {
        type: Boolean,
        default: false
    },
    dateOfBirth: {
        type: Date,
    },
    salonId: {
        type: Number,
        default: 0
    },
    barberId: {
        type: Number
    },
    barberCode: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    barberRatings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BarberRating'
    }],
    profile: [
        {
            public_id: {
                type: String
            },
            url: {
                type: String,
            }
        }
    ],
    isOnline: {
        type: Boolean,
        default: false
    },
    barberServices: [{
        serviceId: {
            type: Number
        },
        serviceCode: {
            type: String
        },
        serviceName: {
            type: String
        },
        serviceIcon: {
            public_id: {
                type: String
            },
            url: {
                type: String,
            }
        },
        servicePrice: {
            type: Number
        },
        vipService:{
            type: Boolean,
            default: false
        },
        barberServiceEWT: {
            type: Number
        }

    }],
    // total time waiting
    barberEWT: {
        type: Number,
        default: 0,
    },
    //populate this field with the count 
    queueCount: {
        type: Number,
        default: 0
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    barberExp: {
        type: Number,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true })


//Generating Password Reset Token
barberSchema.methods.getResetPasswordToken = function () {

    //generate token
    const resetToken = crypto.randomBytes(20).toString("hex")

    //Hashing and adding resetPasswordtoken to userSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    //We return this because when user click then this resetPasswordToken will form .so thast why 
    return resetToken
}
const Barber = mongoose.model('Barber', barberSchema);

export default Barber;