import { ERROR_STATUS_CODE } from "../../../constants/kiosk/StatusCodeConstants.js"
import { BARBER_DAYOFFS_ADDED_SUCCESS, BARBER_DAYOFFS_ARRAY_ERROR, BARBER_DAYOFFS_RETRIEVE_SUCCESS, BARBER_DAYOFFS_UPDATE_SUCCESS, EMPTY_BARBER_OFFDAYS_SUCCESS } from "../../../constants/web/BarberConstants.js"
import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js"
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js"
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js"
import { createBarberDayOff, getBarberDayOffs, updateBarberDayOff } from "../../../services/web/barberDayOff/barberDayOffService.js"

export const addBarberDayOff = async (req, res, next) => {
  try {
    const { salonId, barberId, barberDayOffs } = req.body

    if (!Array.isArray(barberDayOffs)) {
      return ErrorHandler(BARBER_DAYOFFS_ARRAY_ERROR, ERROR_STATUS_CODE, res)
    }

    const existingRecord = await updateBarberDayOff(salonId, barberId);

    if (existingRecord) {
      // Update the existing record
      existingRecord.barberOffDays = barberDayOffs;
      await existingRecord.save();
      return SuccessHandler(BARBER_DAYOFFS_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: existingRecord })
    }
    else {
      const addRecord = await createBarberDayOff(salonId, barberId, barberDayOffs)

      return SuccessHandler(BARBER_DAYOFFS_ADDED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: addRecord })
    }
  }
  catch (error) {
    next(error);
  }
}


export const getBarberOffDays = async (req, res, next) => {
  try {
    const { salonId, barberId } = req.body;

    const barberOffDays = await getBarberDayOffs(salonId, barberId)

    // Check if barberOffDays is empty or not available
    if (!barberOffDays || !barberOffDays.barberOffDays || barberOffDays.barberOffDays.length === 0) {
      return SuccessHandler(
        EMPTY_BARBER_OFFDAYS_SUCCESS,
        SUCCESS_STATUS_CODE,
        res,
        { response: [] } // Return an empty array in the response
      );
    }

    // Extract and format the barberOffDays to only include the dates in YYYY-MM-DD format
    const barberOffDaysFormatted = barberOffDays.barberOffDays.map(day =>
      new Date(day).toISOString().split("T")[0]
    );

    return SuccessHandler(BARBER_DAYOFFS_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barberOffDaysFormatted })

  }
  catch (error) {
    next(error);
  }
}

export const getBarberDayOffNumbers = async (req, res, next) => {
  try {
    const { salonId, barberId } = req.body;

    // Get the barber's off days
    const barberData = await getBarberDayOffs(salonId, barberId);

    // Extract barberOffDays from the response
    const barberOffDays = barberData.barberOffDays || [];

    // Convert the dates to day numbers (0 = Sunday, 6 = Saturday)
    const offDayNumbers = barberOffDays.map(dateString => {
      const date = new Date(dateString); // Convert the date string to a Date object
      return date.getUTCDay(); // Get the day of the week as a number (0-6)
    });

    // Convert the Mongoose document to a plain object
    const plainBarberData = barberData.toObject ? barberData.toObject() : barberData;

    // Modify the barberData object with the numeric off days
    const updatedBarberData = {
      ...plainBarberData,
      barberOffDays: offDayNumbers // Replace the original days with their numeric values
    };

    // Return the response with the barber's off days
    return SuccessHandler(BARBER_DAYOFFS_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
      response: updatedBarberData
    });
  } catch (error) {
    next(error);
  }
};


