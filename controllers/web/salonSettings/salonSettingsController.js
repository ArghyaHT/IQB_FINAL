import { findSalonSetingsBySalonId, saveNewSalonSettings } from "../../../services/web/salonSettings/salonSettingsService.js";


//DESC: GET SALON SETTINGS BY SALON ID ================
export const getSalonSettingsBySalonId = async (req, res, next) => {
    try {
        const { salonId } = req.body;
        // Find the existing SalonSettings document based on salonId
        let existingSalonSettings = await findSalonSetingsBySalonId(salonId)

        if (!existingSalonSettings) {
            return res.status(404).json({
                success: false,
                message: "Salon Settings not found"
            });
        }
        res.status(200).json({
            message: "Salon Settings Updated",
            response: existingSalonSettings
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: UPDATE SALON SETTINGS BY SALON ID ================
export const updateSalonSettings = async (req, res, next) => {
    try {
        const { salonId, appointmentSettings } = req.body;
        const { startTime, endTime, intervalInMinutes } = appointmentSettings;

        if(startTime === endTime){
           return res.status(400).json({
                success: true,
                message: "Start time and end time can't be same.",
            });
        }

        if(startTime > endTime){
           return res.status(400).json({
                success: true,
                message: "Start time cannot be later than end time.",
            });
        }

        if(intervalInMinutes === 0){
            return res.status(400).json({
                success: true,
                message: "Interval miniutes can't be 0.",
            });
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
                }

                // Save the updated SalonSettings to the database
                await existingSalonSettings.save();

                res.status(200).json({
                    success: true,
                    message: "Salon settings updated successfully",
                    response: existingSalonSettings
                });
            }
            else {
                const newSalonSettings = await saveNewSalonSettings(salonId, startTime, endTime, intervalInMinutes);

                res.status(200).json({
                    success: true,
                    message: "New salon Settings added",
                    response: newSalonSettings
                });
            }
        }

    } catch (error) {
        // //console.log(error);
        next(error);
    }
};