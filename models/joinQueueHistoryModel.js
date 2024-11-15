import mongoose from "mongoose"

const joinqueueHistorySchema = new mongoose.Schema({ 
    salonId: {
        type: Number,
    },

    queueList: [{
        position: {
            type: Number,
        },
        customerName: {
            type: String,
            // required: true
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
        isAdmin: {
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

export default JoinedQueueHistory

