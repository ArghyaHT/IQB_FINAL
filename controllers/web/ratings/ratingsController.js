import { findBarberRating, findSalonRating, saveBarberRating, saveSalonRating } from "../../../services/web/ratings/ratingsService.js";

//DESC: GIVE BARBER RATING =================
export const barberRating = async (req, res, next) => {
    try {
      const { salonId, barberId, rating, email } = req.body;
  
      // Validate if the required fields are present in the request body
      if (!salonId || !rating || !email || !barberId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters (salonId, rating, email, barberId).',
        });
      }
  
      // Find the SalonRating document based on salonId
      let barberRatingDoc = await findBarberRating(salonId, barberId);
  
      // If  document doesn't exist, create a new one
      if (!barberRatingDoc) {
        barberRatingDoc = await saveBarberRating(salonId, barberId, rating, email)
      } else {
        // BarberRating document exists, add the new rating to the ratings array
        barberRatingDoc.ratings.push({ rating, email });
      }
      // Save the updated SalonRating document
      await barberRatingDoc.save();
  
      return res.status(200).json({
        success: true,
        message: 'Rating added successfully.',
        response: barberRatingDoc,
      });
    }  catch (error) {
        //console.log(error);
        next(error);
    }
  };

//DESC: GIVE SALON RATING =================
  export const salonRating = async (req, res, next) => {
    try {
        const { salonId, rating, email } = req.body;

        // Validate if the required fields are present in the request body
        if (!salonId || !rating || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters (salonId, rating, email).',
            });
        }

        // Find the SalonRating document based on salonId
        let salonRatingDoc = await findSalonRating(salonId)

        // If SalonRating document doesn't exist, create a new one
        if (!salonRatingDoc) {
            salonRatingDoc = await saveSalonRating(salonId, rating, email)
        } else {
            // SalonRating document exists, add the new rating to the ratings array
            salonRatingDoc.ratings.push({ rating, email });
        }

        // Save the updated SalonRating document
        await salonRatingDoc.save();

        res.status(200).json({
            success: true,
            message: 'Rating added successfully.',
            response: salonRatingDoc,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};


