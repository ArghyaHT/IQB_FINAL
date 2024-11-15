import { getAdvertisements } from "../../services/mobile/salonSettingsService.js";

//DESC: GET ADVERTISEMENTS ====================
export const getAllAdvertisements = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    // Find SalonSettings by salonId and retrieve only the advertisements field
    const salonSettings = await getAdvertisements(salonId)

    // Sort advertisements array in descending order
    const sortedAdvertisements = salonSettings.advertisements.reverse();

    if (!salonSettings) {
      return res.status(201).json({ 
        success: false, 
        message: "Salon settings not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advertisement images retrieved successfully',
      response: sortedAdvertisements
    });
  } catch (error) {
      console.log(error);
      next(error);
  }
}