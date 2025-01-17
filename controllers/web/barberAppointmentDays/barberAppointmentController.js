import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { barberAppointmentDays, createBarberAppointmentDays, updateBarberAppointmentDays } from "../../../services/web/barberAppointmentDays/barberAppointmentDaysService.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { APPOINTMENT_DAYS_ARRAY_ERROR, BARBER_APPOINTMENT_DAYS_ADD_SUCCESS, BARBER_APPOINTMENT_DAYS_ARRAY_ERROR, BARBER_APPOINTMENT_DAYS_UPDATE_SUCCESS, BARBER_APPOINTMENT_RETRIEVE_SUCCESS, BARBER_DISABLED_APPOINTMENT_DATES_RETRIEVE_SUCCESS } from "../../../constants/web/BarberAppointmentConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { findSalonSetingsBySalonId } from "../../../services/web/salonSettings/salonSettingsService.js";
import { getBarberDayOffs } from "../../../services/web/barberDayOff/barberDayOffService.js";


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
        const { salonId, barberId } = req.body;

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
            Sunday: 0
        };

        // Map the available days to their numeric values
        // Get the days of the week that are missing in the appointmentDays array
        const missingDays = Object.keys(daysOfWeek)  // Get the days of the week
            .filter(day => !appointmentDays.includes(day))  // Filter the days not in appointmentDays
            .map(day => daysOfWeek[day]);
        // Convert the Mongoose document to a plain object
        const plainBarberData = barberData.toObject ? barberData.toObject() : barberData;

        // Modify the barberData object with the mapped appointmentDays
        const updatedBarberData = {
            ...plainBarberData,
            appointmentDays: missingDays // Replace the original days with their numeric values
        };

        // Return the full response with the modified appointmentDays
        return SuccessHandler(BARBER_APPOINTMENT_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
            response: updatedBarberData
        });

    } catch (error) {
        next(error);
    }
};


export const getBarberMissingAppointmentDates = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;


        const getSalonSettings = await findSalonSetingsBySalonId(salonId)

        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

        // Number of days to advance
        const appointmentAdvanceDays = getSalonSettings.appointmentAdvanceDays;

        // Generate the list of dates
        const dates = Array.from({ length: appointmentAdvanceDays }, (_, index) => {
            const date = new Date(tomorrow); // Clone the starting date
            date.setDate(tomorrow.getDate() + index); // Add the index to calculate subsequent days
            return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        });

        const barber = await barberAppointmentDays(salonId, barberId)

        const appointmentDays = barber.appointmentDays;

        // Function to convert a date string (YYYY-MM-DD) to the weekday name
        const getDayName = (dateString) => {
            const date = new Date(dateString); // Convert the date string to a Date object
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return daysOfWeek[date.getDay()]; // Returns the weekday name (e.g., "Monday")
        };

        // Filter the dates based on available appointment weekdays
        let availableDates = dates.filter(date => {
            const dayName = getDayName(date); // Get the weekday name of the date
            return appointmentDays.includes(dayName); // Check if it's one of the available appointment days
        });

        const barberDayOff = await getBarberDayOffs(salonId, barberId)

        if(barberDayOff){
            const daysOffs = barberDayOff.barberOffDays;

            const daysOffsFormatted = daysOffs.map(day => new Date(day).toISOString().split("T")[0]);
    
            availableDates = availableDates.filter(date => !daysOffsFormatted.includes(date));
    
            const disbaledDates = dates.filter(date => !availableDates.includes(date))
    
            // Return the full response with the modified appointmentDays
            return SuccessHandler(BARBER_DISABLED_APPOINTMENT_DATES_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
                response: disbaledDates
            });
        }
        else{
            const disbaledDates = dates.filter(date => !availableDates.includes(date))
    
            // Return the full response with the modified appointmentDays
            return SuccessHandler(BARBER_DISABLED_APPOINTMENT_DATES_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
                response: disbaledDates
            });
        }
        
    } catch (error) {
        next(error);
    }
};