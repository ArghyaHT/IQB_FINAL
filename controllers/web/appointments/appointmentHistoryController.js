import { APPOINTMENTLIST_RANGE_ERROR, BARBER_APPOINTMENT_HISTORY_SUCCESS, SALON_APPOINTMENT_HISTORY_SUCCESS } from "../../../constants/web/AppointmentsConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { QUEUEHISTORY_MAX_DAYS } from "../../../constants/web/QueueConstants.js";
import { SALONID_EMPTY_ERROR } from "../../../constants/web/SalonConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getAppointmentsByCustomerEmail } from "../../../services/mobile/appointmentHistoryService.js";
import { getAppointmentHistoryByBarberIdToAndFrom, getAppointmentHistoryByCustomerEmail, getSalonAppointmentHistory } from "../../../services/web/appointments/appointmentHistoryService.js";

export const getAppointmentHistorybyCustomerEmail = async (req, res, next) => {
    try {
        const { salonId, customerEmail } = req.body;


        // Query the AppointmentHistory collection and use $elemMatch to get only the matching appointments
        const history = await getAppointmentsByCustomerEmail(salonId, customerEmail)

        if (!history) {
            return res.status(201).json({
                success: false,
                message: "Appointment history not found for the given customer."
            });
        }

        // Return the found history
        res.status(200).json({
            success: false,
            message: "Appointment history retrieved successfully",
            response: history
        });
    } catch (error) {
        next(error); // Pass the error to the next error handler
    }
}



export const getSalonAppointmentHistoryBySalonId = async (req, res, next) => {
    try {
        const { salonId, from, to, customerEmail, barberId } = req.body;

        if (!salonId) {
            return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)

        }
        
        if(customerEmail){
            // Calculate default from/to dates if not provided
            const now = new Date(); // ✅ define now first
            const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
            const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

            // Helper function to calculate total days (inclusive)
            function getTotalDays(startDate, endDate) {
                const utc1 = Date.UTC(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate()
                );
                const utc2 = Date.UTC(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate()
                );

                return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
            }

            const totalDays = getTotalDays(fromDate, toDate);

            if (to && from) {
                if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                    return ErrorHandler(APPOINTMENTLIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
                }
            }

            const salonAppointmentHistory = await getAppointmentHistoryByCustomerEmail(salonId, customerEmail, fromDate, toDate)

            salonAppointmentHistory.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

            return SuccessHandler(SALON_APPOINTMENT_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonAppointmentHistory })
        }

        if (barberId) {
            // Calculate default from/to dates if not provided
            const now = new Date(); // ✅ define now first
            const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
            const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

            // Helper function to calculate total days (inclusive)
            function getTotalDays(startDate, endDate) {
                const utc1 = Date.UTC(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate()
                );
                const utc2 = Date.UTC(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate()
                );

                return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
            }

            const totalDays = getTotalDays(fromDate, toDate);

            if (to && from) {
                if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                    return ErrorHandler(APPOINTMENTLIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
                }
            }

            const salonAppointmentHistory = await getAppointmentHistoryByBarberIdToAndFrom(salonId, barberId, fromDate, toDate)

            salonAppointmentHistory.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

            return SuccessHandler(SALON_APPOINTMENT_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonAppointmentHistory })

        }

        // Calculate default from/to dates if not provided
        const now = new Date(); // ✅ define now first
        const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

        // Helper function to calculate total days (inclusive)
        function getTotalDays(startDate, endDate) {
            const utc1 = Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
            );
            const utc2 = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
            );

            return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
        }

        const totalDays = getTotalDays(fromDate, toDate);

        if (to && from) {
            if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                return ErrorHandler(APPOINTMENTLIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
            }
        }

        const salonAppointmentHistory = await getSalonAppointmentHistory(salonId, fromDate, toDate)

        salonAppointmentHistory.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

        return SuccessHandler(SALON_APPOINTMENT_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonAppointmentHistory })

    }
    catch (error) {
        next(error);
    }

}


export const getAppointmentHistoryByBarberIdSalonId = async(req, res, next) => {
    try{
        const { salonId, from, to, barberId } = req.body;

        if (!salonId) {
            return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    
        }
    
        // Calculate default from/to dates if not provided
        const now = new Date(); // ✅ define now first
        const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));
    
        // Helper function to calculate total days (inclusive)
        function getTotalDays(startDate, endDate) {
            const utc1 = Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
            );
            const utc2 = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
            );
    
            return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
        }
    
        const totalDays = getTotalDays(fromDate, toDate);
    
        if (to && from) {
            if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                return ErrorHandler(APPOINTMENTLIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
            }
        }
    
        const salonAppointmentHistory = await getAppointmentHistoryByBarberIdToAndFrom(salonId, barberId, fromDate, toDate)
    
        salonAppointmentHistory.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    
        return SuccessHandler(BARBER_APPOINTMENT_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonAppointmentHistory })
    
    }
    catch (error) {
        next(error);
    }

 }
 

