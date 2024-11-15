import mongoose from "mongoose"

const barberRatingSchema = new mongoose.Schema({
    salonId: {
        type: Number
    },
    barberId: {
        type: Number
    },
    ratings: [{
        rating: {
            type: Number,
            min: 0, // Assuming ratings should be non-negative
            max: 5, // Assuming ratings should be on a scale of 0 to 5
        },
        email: {
            type: String
        }
    }]

}, { timestamps: true })

const BarberRating = mongoose.model("BarberRating", barberRatingSchema)

export default BarberRating;