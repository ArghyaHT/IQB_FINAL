import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { barberAppointmentDays, createBarberAppointmentDays, updateBarberAppointmentDays } from "../../../services/web/barberAppointmentDays/barberAppointmentDaysService.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { APPOINTMENT_DAYS_ARRAY_ERROR, BARBER_APPOINTMENT_DAYS_ADD_SUCCESS, BARBER_APPOINTMENT_DAYS_UPDATE_SUCCESS, BARBER_APPOINTMENT_RETRIEVE_SUCCESS } from "../../../constants/web/BarberAppointmentConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";


export const addBarberAppointmentDays = async (req, res, next) => {
    try {
        const { salonId, barberId, appointmentDays } = req.body;

        if (!Array.isArray(appointmentDays)) {
            return ErrorHandler(APPOINTMENT_DAYS_ARRAY_ERROR, ERROR_STATUS_CODE, res)

        }
        // Check if a record for this barber and salon already exists
        const existingRecord = await updateBarberAppointmentDays(salonId, barberId);

        if (existingRecord) {
            // Update the existing record
            existingRecord.appointmentDays = appointmentDays;
            await existingRecord.save();
            return SuccessHandler(BARBER_APPOINTMENT_DAYS_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: existingRecord })
        }
        else {
            const addRecord = await createBarberAppointmentDays(salonId, barberId, appointmentDays)
            return SuccessHandler(BARBER_APPOINTMENT_DAYS_ADD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: addRecord })
        }
    }
    catch (error) {
        next(error);
    }
}


export const getBarberAppointmentDays = async (req, res, next) => {
    try {
        const{salonId, barberId} = req.body;

        const getbarberAppointmentDays = await barberAppointmentDays(salonId, barberId)

        console.log(getbarberAppointmentDays)
        return SuccessHandler(BARBER_APPOINTMENT_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getbarberAppointmentDays })

    }
    catch (error) {
        next(error);
    }
}