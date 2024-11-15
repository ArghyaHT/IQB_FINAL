import mongoose from "mongoose";

const salonRatingSchema = new mongoose.Schema({
    salonId: {
        type: Number
    },
    ratings: [{
        rating: {
            type: Number,
            min: 0, // Assuming ratings should be non-negative
            max: 5, // Assuming ratings should be on a scale of 0 to 5
        },
        email:{
            type: String
        }
    }]
   
},{timestamps: true})

const SalonRating =  mongoose.model("SalonRating", salonRatingSchema)

export default SalonRating;
