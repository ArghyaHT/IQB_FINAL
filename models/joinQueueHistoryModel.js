import mongoose from "mongoose";

const joinqueueHistorySchema = new mongoose.Schema({
    // id:{
    //     type: Number,
    //     required: true
    // },
    salonId: {
        type: Number,
        default: 0
    },

    queueList: [{
        position: {
            type: Number,
        },
        customerName: {
            type: String,
            default:""
            // required: true
        },
        customerEmail: {
            type: String
        },
        mobileCountryCode:{
            type: Number
        },
        mobileNumber:{
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
            type: Date,
            default:""
        },
        timeJoinedQ: {
            type: String,
             default:""
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
        customerEWT: {
            type: Number
        },
        updatedByBarberEmail: {
            type: String,
            default: ""
        },
        updatedByBarberName: {
            type: String,
            default: ""
        },
        isAdmin:{
            type: Boolean,
            default: false
        },
        status:{
            type: String
        },
        localLineId: {
            type: Number
        },

    }]

}, { timestamps: true })

const JoinedQueueHistory = mongoose.model("JoinQueueHistory", joinqueueHistorySchema)

export default JoinedQueueHistory;

