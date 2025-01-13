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

        return SuccessHandler(BARBER_APPOINTMENT_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getbarberAppointmentDays })

    }
    catch (error) {
        next(error);
    }
}

export const getBarberAppointmentDayNumbers = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        // Get the barber's available appointment days
        const barberData = await barberAppointmentDays(salonId, barberId);

        // Extract appointmentDays from the response
        const appointmentDays = barberData.appointmentDays || [];

        // Define the mapping for the days of the week
        const daysOfWeek = {
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
            Sunday: 7
        };

        // Map the available days to their numeric values
        const mappedAppointmentDays = appointmentDays.map(day => daysOfWeek[day]);

        // Convert the Mongoose document to a plain object
        const plainBarberData = barberData.toObject ? barberData.toObject() : barberData;

        // Modify the barberData object with the mapped appointmentDays
        const updatedBarberData = {
            ...plainBarberData,
            appointmentDays: mappedAppointmentDays // Replace the original days with their numeric values
        };

        // Return the full response with the modified appointmentDays
        return SuccessHandler(BARBER_APPOINTMENT_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { 
            response: updatedBarberData
        });

    } catch (error) {
        next(error);
    }
};