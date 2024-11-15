import SalonRating from "../../models/salonRatingModel.js";

//GET AVERAGE SALONRATING RATING
export const getAverageSalonRating = async(salonId) => {
    const numsalonId = Number(salonId)
 // Aggregate to calculate the average rating
  const result = await SalonRating.aggregate([
    {
        $match: {
            salonId: numsalonId,
        },
    },
    {
        $unwind: "$ratings",
    },
    {
        $group: {
            _id: null,
            averageRating: {
                $avg: "$ratings.rating",
            },
        },
    },
    {
        $project: {
            _id: 0, // Exclude the _id field from the result
            averageRating: {
                $round: ["$averageRating", 1], // Round the average rating to 1 decimal place
            },
        },
    },
]);

// Extract the average rating from the result
const averageRating = result.length > 0 ? result[0].averageRating : 0;

return averageRating;
}
