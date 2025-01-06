import { APPOINTMENTS_HISTORY_NOT_FOUND_ERROR, APPOINTMENTS_HISTORY_RETRIEVE_SUCCESS } from "../../../constants/mobile/AppointmentConstants.js";
import { ERROR_STATUS_CODE_201, SUCCESS_STATUS_CODE } from "../../../constants/mobile/StatusCodeConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getAppointmentsByCustomerEmail } from "../../../services/mobile/appointmentHistoryService.js";

export const getAppointmentHistorybyCustomerEmail = async (req, res, next) => {
    try {
        const { salonId, customerEmail } = req.body;

        const history = await getAppointmentsByCustomerEmail(salonId, customerEmail)

        if (!history) {
            return ErrorHandler(APPOINTMENTS_HISTORY_NOT_FOUND_ERROR, ERROR_STATUS_CODE_201, res)
        }
        // Return the found history
        return SuccessHandler(APPOINTMENTS_HISTORY_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: history });

    } catch (error) {
        next(error); // Pass the error to the next error handler
    }
}