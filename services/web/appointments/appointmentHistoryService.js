import AppointmentHistory from "../../../models/appointmentHistoryModel.js";

export const addCancelAppointmentHistory = async (salonId, appointment) => {
   // Extract the first item from the appointmentList and add status
   const appointmentToPush = {
    ...appointment.appointmentList[0]._doc,
    status: "cancelled", // Add or override the status field
};

// Update the history entry in the database
const historyEntry = await AppointmentHistory.findOneAndUpdate(
    { salonId },
    {
        $push: { appointmentList: appointmentToPush }, // Push the new appointment
    },
    { upsert: true, new: true } // Create a new document if it doesn't exist
);

return historyEntry;
};



export const findOrCreateAppointmentHistory = async (salonId, appointment) => {
    // Extract the first item from the appointmentList and add status
    const appointmentToPush = {
     ...appointment.appointmentList[0]._doc,
     status: "served", // Add or override the status field
 };
 
 // Update the history entry in the database
 const historyEntry = await AppointmentHistory.findOneAndUpdate(
     { salonId },
     {
         $push: { appointmentList: appointmentToPush }, // Push the new appointment
     },
     { upsert: true, new: true } // Create a new document if it doesn't exist
 );
 
 return historyEntry;
 };