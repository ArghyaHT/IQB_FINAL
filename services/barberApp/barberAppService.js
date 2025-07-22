import moment from "moment";
import Appointment from "../../models/appointmentsModel.js";
import Barber from "../../models/barberRegisterModel.js";

export const findBarberByEmailIsVerifiedAndRole = async (email) => {
   const barber = await Barber.findOne({ email, role: 'Barber'}).exec()
   return barber;
}


export const findBarberByMobileIsVerifiedAndRole = async (mobileCountryCode, mobileNumber) => {
   const barber = await Barber.findOne({ mobileCountryCode, mobileNumber, role: 'Barber' }).exec()
   return barber;
}


export const createBarberByApp = async (email, hashedPassword, barberId, verificationCode) => {
   const user = new Barber({
      email,
      password: hashedPassword,
      barberId: barberId,
      role: "Barber",
      verificationCode: verificationCode

    })
    
   await user.save();

   return user;
}


export const getBarberUpcomingAppointments = async (salonId, barberId) => {

    const defaultImage = "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg"

    const getbarberBookingBySalonId = await Appointment.findOne({ salonId });

    if (!getbarberBookingBySalonId) {
        return [];
    }

    const filteredAppointments = await Promise.all(
        getbarberBookingBySalonId.appointmentList
            .filter(item => item.barberId === barberId)
            .map(async (appointment) => {
                const formatTo12Hour = (time) => moment(time, "HH:mm").format("h:mm A");

                const barber = await Barber.findOne({ barberId: appointment.barberId });
                const barberProfile = barber?.profile || defaultImage;

                return {
                    ...appointment.toObject(),
                    startTime: formatTo12Hour(appointment.startTime),
                    endTime: formatTo12Hour(appointment.endTime),
                    timeSlots: `${formatTo12Hour(appointment.startTime)} - ${formatTo12Hour(appointment.endTime)}`,
                  //   barberProfile: barberProfile,
                  //   barbername: barber.name
                };
            })
    );

    return filteredAppointments;
}