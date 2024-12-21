import { ERROR_STATUS_CODE_201, SUCCESS_STATUS_CODE } from "../../constants/mobile/StatusCodeConstants.js";
import { ADVERT_IMAGES_SUCCESS, ADVERT_NOT_FOUND } from "../../constants/web/DashboardConstants.js";
import { ErrorHandler } from "../../middlewares/ErrorHandler.js";
import { getAdvertisements } from "../../services/mobile/salonSettingsService.js";

//DESC: GET ADVERTISEMENTS ====================
export const getAllAdvertisements = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    // Find SalonSettings by salonId and retrieve only the advertisements field
    const salonSettings = await getAdvertisements(salonId)

    if (!salonSettings) {
      // return res.status(201).json({ 
      //   success: false, 
      //   message: "Salon settings not found" 
      // });
      return ErrorHandler(ADVERT_NOT_FOUND, ERROR_STATUS_CODE_201, res)

    }

    // Sort advertisements array in descending order
    const sortedAdvertisements = salonSettings.advertisements.reverse();

    // res.status(200).json({
    //   success: true,
    //   message: 'Advertisement images retrieved successfully',
    //   response: sortedAdvertisements
    // });

    return SuccessHandler(ADVERT_IMAGES_SUCCESS, SUCCESS_STATUS_CODE, res, { response: sortedAdvertisements })

  } catch (error) {
    next(error);
  }
}