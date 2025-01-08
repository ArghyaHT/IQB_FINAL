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
    currencyCode: {
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
    // isTrailEnabled: {
    //     type: Boolean,
    //     default: false
    // },
    // trailEndDate: {
    //     type: Date
    // },
    // isQueuing: {
    //     type: Boolean,
    //     default: false
    // },
    // isAppointments: {
    //     type: Boolean,
    //     default: false
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

    // productPayment: [
    //     {   
    //         salonId: Number,
    //         adminEmail: String,
    //         customerName: String,
    //         customerEmail: String,
    //         amount: Number,
    //         currency: String,
    //         paymentIntentId: String,
    //         status: String,
    //         paymentType: "Free" / "Paid",
    //         paymentExpiryDate: "current date + 14days / paid date time",

    //         products: [
    //           {
    //             name: String,
    //             quantity: Number,
    //             price: Number,
    //             currency: String,
    //           },
    //         ],
    //         createdAt: { type: Date, default: Date.now },
    //     }
    // ],

    productPayment: [
        {
            salonId: Number,
            adminEmail: String,
            customerName: String,
            customerEmail: String,
            amount: Number,
            currency: String,
            paymentIntentId: String,
            status: String,
            paymentType: {
                type: String,
                enum: ["Free", "Paid"],
                // default: "Free",
            },
            paymentExpiryDate: {
                type: Date,
                // default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            },
            products: [
                {
                    name: String,
                    quantity: Number,
                    price: Number,
                    currency: String,
                },
            ],
            createdAt: { type: Date, default: Date.now },
        },
    ],


    paymentHistory: [
        // {
        //     Jokhn payment expire hbe tokhon productPayment array theke delete kore armodhe put koredite hbe.
        // }
        {
            salonId: Number,
            adminEmail: String,
            customerName: String,
            customerEmail: String,
            amount: Number,
            currency: String,
            paymentIntentId: String,
            status: String,
            paymentType: {
                type: String,
                enum: ["Free", "Paid"],
                //   default: "Free",
            },
            paymentExpiryDate: {
                type: Date,
                //   default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            },
            isQueuing: {
                type: Boolean,
                default: false
            },
            isAppointments: {
                type: Boolean,
                default: false
            },
            products: [
                {
                    name: String,
                    quantity: Number,
                    price: Number,
                    currency: String,
                },
            ],
            createdAt: { type: Date, default: Date.now },
        },
    ]


}, { timestamps: true });


salonsSchema.index({ location: '2dsphere' });


const Salon = mongoose.model('Salon', salonsSchema);

export default Salon;

