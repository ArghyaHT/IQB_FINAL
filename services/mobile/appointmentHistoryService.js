import AppointmentHistory from "../../models/appointmentHistoryModel.js";

export const getAppointmentsByCustomerEmail = async(salonId, customerEmail) => {

    const getCustomerBookingBySalonId = await AppointmentHistory.findOne({salonId}) 

    if (!getCustomerBookingBySalonId) {
        return []; // Return null if no record is found
    }

    const filteredAppointmentList = getCustomerBookingBySalonId.appointmentList.filter(item => item.customerEmail === customerEmail);
    
     return filteredAppointmentList
}