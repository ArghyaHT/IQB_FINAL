import mongoose from "mongoose";

const salonQueueListSchema = new mongoose.Schema({
    salonId: {
        type: Number,
        required: true
    },

    queueList: [{
        position: {
            type: Number,
        },
        customerName: {
            type: String,
        },
        customerEmail: {
            type: String
        },
        mobileNumber:{
            type: Number
        },
        mobileCountryCode:{
            type: Number
        },    
        joinedQ: {
            type: Boolean
        },

        joinedQType: {
            type: String,
            enum: ['Single-Join', 'Group-Join', 'Auto-Join']
        },
        dateJoinedQ: {
            type: Date
        },
        timeJoinedQ: {
            type: String
        },
        timePositionChanged: {
            type: String
        },
        loggedIn: {
            type: Boolean
        },
        methodUsed: {
            type: String,
            enum: ['Walk-In', 'Admin', 'App']
        },
        barberName: {
            type: String
        },
        forceUpdate: {
            type: Boolean
        },
        qgCode: {
            type: String
        },
        qPosition: {
            type: Number
        },
        positionChangedMessageShown: {
            type: Boolean
        },
        logNo: {
            type: String
        },
        lineCreated: {
            type: String
        },
        barberId: {
            type: Number
        },
        services: [{
            serviceId: {
                type: Number
            },
            serviceName: {
                type: String
            },
            servicePrice:{
                type: Number
            },
            vipService: {
                type: Boolean
            }
        }],
        serviceEWT: {
            type: Number
        },
        serviceType:{
            type: String,
            default: "Regular"
        },
        customerEWT: {
            type: Number
        },
        status:{
            type: String
        },
        localLineId: {
            type: Number
        }
    }]

}, { timestamps: true })

const SalonQueueList = mongoose.model("SalonQueueList", salonQueueListSchema)

export default SalonQueueList;

