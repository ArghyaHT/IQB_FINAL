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

 export const addCancelAppointmentHistoryByBarber = async (salonId, appointments) => {
      // Ensure appointments is an array and status is added to each appointment correctly
      const appointmentsToPush = appointments.map(appointment => {
        // Check if appointment is an object with the expected fields
        if (appointment && appointment._id) {
            return {
                ...appointment.toObject(), // Spread the existing appointment data
                status: "cancelled", // Add or update the status field
            };
        }
        return appointment; // Return the appointment as is if no _id is present (safety check)
    });

    // Update the history entry in the database
    const historyEntry = await AppointmentHistory.findOneAndUpdate(
        { salonId },
        {
            $push: { appointmentList: { $each: appointmentsToPush } }, // Push multiple appointments
        },
        { upsert: true, new: true } // Create a new document if it doesn't exist
    );

    return historyEntry;
};