import moment from "moment";
import AppointmentHistory from "../../models/appointmentHistoryModel.js";
import Barber from "../../models/barberRegisterModel.js";

export const getAppointmentsByCustomerEmail = async (salonId, customerEmail) => {

    const defaultImage = "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg"


    const getCustomerBookingBySalonId = await AppointmentHistory.findOne({ salonId });

    if (!getCustomerBookingBySalonId) {
        return [];
    }
    const filteredAppointments = await Promise.all(
        getCustomerBookingBySalonId.appointmentList
            .filter(item => item.customerEmail === customerEmail)
            .map(async appointment => {
                const formatTo12Hour = (time) => moment(time, "HH:mm").format("h:mm A");

                // Example async logic (e.g., fetching barber)
                const barber = await Barber.findOne({ barberId: appointment.barberId });
                const barberProfile = barber?.profile || defaultImage;

                return {
                    ...appointment.toObject(),
                    startTime: formatTo12Hour(appointment.startTime),
                    endTime: formatTo12Hour(appointment.endTime),
                    timeSlots: `${formatTo12Hour(appointment.startTime)} - ${formatTo12Hour(appointment.endTime)}`,
                    barberProfile: barberProfile,
                    barbername: barber.name
                };
            })
    );

    return filteredAppointments;
}