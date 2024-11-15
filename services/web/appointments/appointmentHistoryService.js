import AppointmentHistory from "../../../models/appointmentHistoryModel.js";

export const findOrCreateAppointmentHistory = async(salonId, appointment ) => {
    const historyEntry = await AppointmentHistory.findOneAndUpdate(
        { salonId },
        {
            $push: {
                "appointmentList": {
                    ...appointment.appointmentList[0],
                    status: "served",
                },
            }
        },
        { upsert: true, new: true }
    );
    return historyEntry
}