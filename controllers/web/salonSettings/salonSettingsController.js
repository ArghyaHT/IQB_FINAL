import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { APPOINTMENT_ADVANCE_DAYS_ERROR, INTERVAL_MINUTES__ERROR, SALON_DAYOFFS_ERROR, SALON_SETTINGS_ADD_SUCCESS, SALON_SETTINGS_EMPTY_ERROR, SALON_SETTINGS_ENDTIME_EMPTY_ERROR, SALON_SETTINGS_INTERVAL_MINS_EMPTY_ERROR, SALON_SETTINGS_NOT_FOUND_ERROR, SALON_SETTINGS_STARTTIME_EMPTY_ERROR, SALON_SETTINGS_UPDATE_SUCCESS, START_END_TIME_EQUAL_ERROR, START_END_TIME_LATER_ERROR } from "../../../constants/web/SalonSettingsConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { findSalonSetingsBySalonId, saveNewSalonSettings } from "../../../services/web/salonSettings/salonSettingsService.js";


//DESC: GET SALON SETTINGS BY SALON ID ================
export const getSalonSettingsBySalonId = async (req, res, next) => {
    try {
        const { salonId } = req.body;
        // Find the existing SalonSettings document based on salonId
        let existingSalonSettings = await findSalonSetingsBySalonId(salonId)

        if (!existingSalonSettings) {
            return ErrorHandler(SALON_SETTINGS_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }
        return SuccessHandler(SALON_SETTINGS_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, {response: existingSalonSettings})

    } catch (error) {
        next(error);
    }
}

//DESC: UPDATE SALON SETTINGS BY SALON ID ================
export const updateSalonSettings = async (req, res, next) => {
    try {
        const { salonId, appointmentSettings, salonOffDays, appointmentAdvanceDays } = req.body;
        const { startTime, endTime, intervalInMinutes } = appointmentSettings;

        // if(!startTime && !endTime && !intervalInMinutes){
        // return ErrorHandler(SALON_SETTINGS_EMPTY_ERROR, ERROR_STATUS_CODE, res)

        // }

        if(!startTime){
            return ErrorHandler(SALON_SETTINGS_STARTTIME_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    
        }

        if(!endTime){
            return ErrorHandler(SALON_SETTINGS_ENDTIME_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    
        }

        if(!intervalInMinutes){
            return ErrorHandler(SALON_SETTINGS_INTERVAL_MINS_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    
        }
        

        // if(!salonOffDays){
        //     return ErrorHandler(SALON_DAYOFFS_ERROR, ERROR_STATUS_CODE, res)

        // }

        if(!appointmentAdvanceDays){
            return ErrorHandler(APPOINTMENT_ADVANCE_DAYS_ERROR, ERROR_STATUS_CODE, res)

        }
        
        if(startTime === endTime){
        return ErrorHandler(START_END_TIME_EQUAL_ERROR, ERROR_STATUS_CODE, res)
        }

        if(startTime > endTime){
        return ErrorHandler(START_END_TIME_LATER_ERROR, ERROR_STATUS_CODE, res)
        }

        if(intervalInMinutes === 0){
            return ErrorHandler(INTERVAL_MINUTES__ERROR, ERROR_STATUS_CODE, res)
        }
        
        if (salonId && appointmentSettings) {
            // Find the existing SalonSettings document based on salonId
            let existingSalonSettings = await findSalonSetingsBySalonId(salonId)

            if (existingSalonSettings) {
                // Update the appointment settings if provided in the request
                if (startTime && endTime && intervalInMinutes) {
                    existingSalonSettings.appointmentSettings.appointmentStartTime = startTime;
                    existingSalonSettings.appointmentSettings.appointmentEndTime = endTime;
                    existingSalonSettings.appointmentSettings.intervalInMinutes = intervalInMinutes;
                    existingSalonSettings.salonOffDays = salonOffDays;
                    existingSalonSettings.appointmentAdvanceDays = appointmentAdvanceDays
                }

                // Save the updated SalonSettings to the database
                await existingSalonSettings.save();

                return SuccessHandler(SALON_SETTINGS_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, {response: existingSalonSettings})

            }
            else {
                const newSalonSettings = await saveNewSalonSettings(salonId, startTime, endTime, intervalInMinutes, salonOffDays, appointmentAdvanceDays);

                return SuccessHandler(SALON_SETTINGS_ADD_SUCCESS, SUCCESS_STATUS_CODE, res, {response: newSalonSettings})

            }
        }

    } catch (error) {
        next(error);
    }
};
