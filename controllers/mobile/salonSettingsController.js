import { getSalonSettings } from "../../services/mobile/salonSettingsService.js";

export const getSalonBusinessDays = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        // Fetch salon settings
        const salonSettings = await getSalonSettings(salonId);

        if (!salonSettings) {
            return res.status(404).json({ message: "Salon not found" });
        }

        // Define all days of the week
        const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Get off days from the salon settings
        const salonOffDays = salonSettings.salonOffDays || [];

        // Get business hours from salon settings
        const startTime = salonSettings.appointmentSettings.appointmentStartTime;
        const endTime = salonSettings.appointmentSettings.appointmentEndTime;

        // Construct the response with timings
        const businessDays = allDays.map(day => {
            if (salonOffDays.includes(day)) {
                return { day, "status": "closed" };
            }
            return { day, startTime, endTime };
        });

        return res.status(200).json({ success: true, message: "Business days retrieved successfully", response: businessDays });
    } catch (error) {
        next(error);
    }
};



export const getMaxAppointmentDays = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        // Fetch salon settings
        const salonSettings = await getSalonSettings(salonId);

        const appointmentAdvanceDays = salonSettings?.appointmentAdvanceDays ?? 14;


        return res.status(200).json({
            success: true,
            message: "Appointment advance days fetched successfully",
            response: {
                appointmentAdvanceDays

            }
        });

    }
    catch (error) {
        next(error);
    }
}