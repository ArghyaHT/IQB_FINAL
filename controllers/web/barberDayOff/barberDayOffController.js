import { ERROR_STATUS_CODE } from "../../../constants/kiosk/StatusCodeConstants.js"
import { BARBER_DAYOFFS_ADDED_SUCCESS, BARBER_DAYOFFS_ARRAY_ERROR, BARBER_DAYOFFS_RETRIEVE_SUCCESS, BARBER_DAYOFFS_UPDATE_SUCCESS } from "../../../constants/web/BarberConstants.js"
import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js"
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js"
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js"
import { createBarberDayOff, getBarberDayOffs, updateBarberDayOff } from "../../../services/web/barberDayOff/barberDayOffService.js"

export const addBarberDayOff = async (req, res, next) => {
    try {
        const { salonId, barberId, barberDayOffs  } = req.body

        console.log(barberDayOffs)

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

            console.log(addRecord)
            return SuccessHandler(BARBER_DAYOFFS_ADDED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: addRecord })
        }
    }
    catch (error) {
        next(error);
    }
}


export const getBarberOffDays = async (req, res, next) => {
    try {
        const{salonId, barberId} = req.body;

        const barberOffDays = await getBarberDayOffs(salonId, barberId)

        return SuccessHandler(BARBER_DAYOFFS_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barberOffDays })

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
  
      // Define the mapping for the days of the week
      const daysOfWeek = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 0
      };
  
      // Map the barber's off days to their numeric values
      const offDayNumbers = barberOffDays.map(day => daysOfWeek[day]);
  
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
  

