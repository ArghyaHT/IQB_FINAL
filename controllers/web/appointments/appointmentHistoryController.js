import { APPOINTMENTS_HISTORY_NOT_FOUND_ERROR, APPOINTMENTS_HISTORY_RETRIEVE_SUCCESS } from "../../../constants/mobile/AppointmentConstants.js";
import { ERROR_STATUS_CODE_201, SUCCESS_STATUS_CODE } from "../../../constants/mobile/StatusCodeConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getAppointmentsByCustomerEmail } from "../../../services/mobile/appointmentHistoryService.js";

export const getAppointmentHistorybyCustomerEmail = async (req, res, next) => {
    try {
        const { salonId, customerEmail } = req.body;

        // Query the AppointmentHistory collection and use $elemMatch to get only the matching appointments
        const history = await getAppointmentsByCustomerEmail(salonId, customerEmail)

        if (!history) {
            // return res.status(201).json({
            //     success: false,
            //     message: "Appointment history not found for the given customer."
            // });
            return ErrorHandler(APPOINTMENTS_HISTORY_NOT_FOUND_ERROR, ERROR_STATUS_CODE_201, res)

        }
        // Return the found history
        // res.status(200).json({
        //     success: false,
        //     message: "Appointment history retrieved successfully",
        //     response: history
        // });

        return SuccessHandler(APPOINTMENTS_HISTORY_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: history });

    } catch (error) {
        next(error); // Pass the error to the next error handler
    }
}