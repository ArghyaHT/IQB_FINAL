import { getAppointmentsByCustomerEmail } from "../../../services/mobile/appointmentHistoryService.js";

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