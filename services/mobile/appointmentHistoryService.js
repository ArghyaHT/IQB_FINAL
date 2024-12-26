import AppointmentHistory from "../../models/appointmentHistoryModel.js";

export const getAppointmentsByCustomerEmail = async(salonId, customerEmail) => {


    console.log(salonId, customerEmail)

    const getCustomerBookingHistory = await AppointmentHistory.findOne(
        { salonId, "appointmentList.customerEmail": customerEmail },
        { "appointmentList.$": 1 } // This will return only the matching appointments
      );

      console.log(getCustomerBookingHistory)

      return getCustomerBookingHistory
}