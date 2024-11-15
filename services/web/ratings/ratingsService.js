import BarberRating from "../../../models/barberRatingModel.js"
import SalonRating from "../../../models/salonRatingModel.js"

//FIND BARBER RATING BY SALON ID
export const findBarberRating = async(salonId, barberId) => {
    const barberRating = await BarberRating.findOne({ salonId, barberId });
    return barberRating
}

//SAVE BARBER RATING
export const saveBarberRating = async(salonId, barberId, rating, email) => {
    const barberRating = await new BarberRating({
        salonId,
        barberId,
        ratings: [{ rating, email }],
      });
      return barberRating;
}

//GET AVERAGE BARBER RATING
export const getAverageBarberRating = async(salonId, barberId) => {
    const numsalonId = Number(salonId)
    const numBarberId = Number(barberId)

    // Aggregate to calculate the average rating
    const result = await BarberRating.aggregate([
        {
            $match: {
                salonId: numsalonId,
                barberId: numBarberId
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


//FIND BARBER RATING BY SALON ID
export const findSalonRating = async(salonId) => {
    const salonRating = await SalonRating.findOne({ salonId });
    return salonRating
}

//SAVE BARBER RATING
export const saveSalonRating = async(salonId, rating, email) => {
    const salonRating = await new SalonRating({
        salonId,
        ratings: [{ rating, email }],
      });
      return salonRating;
}


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

