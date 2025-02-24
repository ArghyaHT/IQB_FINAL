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
        default: 0
    },
    salonName: {
        type: String,
        default: ""
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
        default: [{}]
    },
    salonType: {
        type: String
    },
    salonDesc: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
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
        type: String,
        default: "£"
    },
    isoCurrencyCode: {
        type: String
    },
    postCode: {
        type: String,
        // required: true
    },
    contactTel: {
        type: Number,
    },

    mobileCountryCode: {
        type: Number
    },

    webLink: {
        type: String,
        default: ""
    },
    fbLink: {
        type: String,
        default: ""

    },
    twitterLink: {
        type: String,
        default: ""
    },
    instraLink: {
        type: String,
        default: ""
    },

    tiktokLink: {
        type: String,
        default: ""
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
            default: 0
            // required: true,
        },
        serviceCode: {
            type: String,
            //required: true
        },
        serviceName: {
            type: String,
            default: ""
            // required: true,
        },
        serviceIcon: {
            public_id: {
                type: String
            },
            url: {
                type: String,
                default: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720532593/depositphotos_247872612-stock-illustration-no-image-available-icon-vector_fhytrg.jpg"

            }
        },
        serviceDesc: {
            type: String,
            default: ""
        },
        servicePrice: {
            type: Number,
            default: 0
            // required: true
        },
        serviceEWT: {
            type: Number,
            default: 0
        },
        vipService: {
            type: Boolean,
            default: false
        }
    }],

    isLicensed: {
        type: Boolean,
        default: false
    },
    isQueuing: {
        type: Boolean,
        default: false
    },
    isAppointments: {
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
    mobileBookingAvailability: {
        type: Boolean,
        default: false
    },
    kioskAvailability: {
        type: Boolean,
        default: false
    },
    isQueuing: {
        type: Boolean,
        default: false
    },
    // queueingExpiryDate: {
    //     type: String,
    //     default:""
    // },
    isAppointments: {
        type: Boolean,
        default: false
    },
    // appointmentExpiryDate: {
    //     type: String,
    //     default: ""
    // },

    // isQueueingTrailEnabled:{
    //     type: String,
    //     default: "initial"
    // },
    // isAppointmentTrailEnabled:{
    //     type: String,
    //     default: "intial"
    // },
    // isTrailEnabled: {
    //     type: Boolean,
    //     default: false
    // },

    // queueingPaymentType:{
    //     type: String
    // },
    // appointmentPaymentType:{
    //     type: String
    // },

    // paymentType:{
    //     type: String
    // },

    // queueTrailExpiryDate: {
    //     type: String,
    //     default: ""
    // },

    // appointmentTrailExpiryDate: {
    //     type: String,
    //     default: ""
    // },
    // trailExpiryDate: {
    //     type: String,
    //     default: ""
    // },
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

    // subscriptions: [
    //     Queue: {
    //         trial: enum["initial", "free", "paid"],
    //         planValidity: any value,
    //         expirydate: "",
    //         bought: ""
    //     },
    //     Appointment:{
    //         trial: enum["initial", "free", "paid"],
    //         planValidity: any value,
    //         expirydate: "",
    //         bought: ""
    //     },
    // ]

    subscriptions: {
        type: [{
            name: {  // Changed from `type` to `name`
                type: String,
                enum: ["Queue", "Appointment"], // Allowed values
                required: true
            },
            trial: {
                type: String,
                enum: ["Initial", "Free", "Paid"],
                default: "Initial"
            },
            planValidity: {
                type: Number,
                default: 0
            },
            expirydate: {
                type: String,
                default: ""
            },
            paymentIntentId: {
                type: String,
                default: ""
            },
            bought: {
                type: String,
                default: ""
            }
        }],
        default: [
            { name: "Queue", trial: "Initial", planValidity: 0, expirydate: "", paymentIntentId: "",bought: "" },
            { name: "Appointment", trial: "Initial", planValidity: 0, expirydate: "", paymentIntentId: "", bought: "" }
        ]
    }


}, { timestamps: true });


salonsSchema.index({ location: '2dsphere' });


const Salon = mongoose.model('Salon', salonsSchema);

export default Salon;

