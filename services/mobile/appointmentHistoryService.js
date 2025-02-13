import moment from "moment";
import AppointmentHistory from "../../models/appointmentHistoryModel.js";

export const getAppointmentsByCustomerEmail = async(salonId, customerEmail) => {

    const getCustomerBookingBySalonId = await AppointmentHistory.findOne({ salonId });

    if (!getCustomerBookingBySalonId) {
        return [];
    }

    const filteredAppointments = getCustomerBookingBySalonId.appointmentList
        .filter(item => item.customerEmail === customerEmail)
        .map(appointment => {
            // Convert time to 12-hour AM/PM format using moment.js
            const formatTo12Hour = (time) => moment(time, "HH:mm").format("h:mm A");

            return {
                ...appointment.toObject(),
                startTime: formatTo12Hour(appointment.startTime),
                endTime: formatTo12Hour(appointment.endTime),
                timeSlots: `${formatTo12Hour(appointment.startTime)} - ${formatTo12Hour(appointment.endTime)}`
            };
        });

    return filteredAppointments;
}