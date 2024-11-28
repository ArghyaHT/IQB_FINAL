import mongoose from "mongoose";

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    countryCode: {
        type: String,
    },
    currency: {
        type: String,
        default: "£"

    },
    timeZones: [
        {
            zoneName: {
                type: String,
            },
            gmtOffset: {
                type: Number,
            },
            gmtOffsetName: {
                type: String,
            },
            abbreviation:{
                type: String
            }, 
            tzName:{
                type: String
            }
        }
    ]
});

const Country = mongoose.model('Country', countrySchema);

export default Country;