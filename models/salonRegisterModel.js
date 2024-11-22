import mongoose from "mongoose";

const coordinatesSchema = new mongoose.Schema({
    longitude: {
        type: Number,
    },
    latitude: {
        type: Number,
    },
});


const salonsSchema = new mongoose.Schema({
    salonId: {
        type: Number,
    },
    salonName: {
        type: String,
        // required: true,
    },
    adminEmail: {
        type: String,
    },
    salonCode: {
        type: String,
    },
    salonLogo: {
        type: [{
          public_id: {
            type: String
          },
          url: {
            type: String,
            default: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720532593/depositphotos_247872612-stock-illustration-no-image-available-icon-vector_fhytrg.jpg"
          }
        }],
        default: []
      },
    salonType: {
        type: String
    },
    salonDesc: {
        type:String,
        default: ""
    },
    address: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required: true
    },
    country: {
        type: String,
        // required: true
    },
    timeZone: {
        type: String
    },
    currency: {
        type: String
    },
    postCode: {
        type: String,
        // required: true
    },
    contactTel: {
        type: Number,
        // required: true
    },

    mobileCountryCode:{
        type: Number
    },

    webLink: {
        type: String,
        // required: true
    },
    fbLink: {
        type: String,

    },
    twitterLink: {
        type: String,
    },
    instraLink: {
        type: String,
    },
    tiktokLink: {
        type: String
    },
    salonEmail: {
        type: String
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            // required: true,
        },
        coordinates: {
            type: coordinatesSchema,
            // required: true,
            index: '2dsphere'
        }

    },
    salonRatings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalonRating'
    }],
    services: [{
        serviceId: {
            type: Number,
            // required: true,
        },
        serviceCode: {
            type: String,
            //required: true
        },
        serviceName: {
            type: String,
            // required: true,
        },
        serviceIcon: {
            public_id: {
                type: String
            },
            url: {
                type: String,
            }
        },
        serviceDesc: {
            type: String,
            // required: true,
        },
        servicePrice: {
            type: Number,
            // required: true
        },
        serviceEWT: {
            type: Number
        },
        vipService:{
            type:Boolean,
            default: false
        }
    }],

    isLicensed: {
        type: Boolean,
        default: false
    },
    moduleAvailability: {
        type: String,
        enum: ["Queuing", "Appointment", "Both"],
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    mobileBookingAvailability:{
        type:Boolean,
        default: false
    },
    gallery: [
        {
            public_id: {
                type: String
            },
            url: {
                type: String,
            }
        }
    ],

}, { timestamps: true });


salonsSchema.index({ location: '2dsphere' });


const Salon = mongoose.model('Salon', salonsSchema);

export default Salon;

