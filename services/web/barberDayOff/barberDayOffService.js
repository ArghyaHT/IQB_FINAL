import BarberDayOff from "../../../models/barberDayOffModel.js"

export const addBarberForDayOff = async(salonId, barberId) => {
      // Create a new document in the BarberDayOff collection
      const barber = await BarberDayOff.create({
        salonId: salonId,
        barberId: barberId,
    });

    return barber;
}

export const createBarberDayOff = async(salonId, barberId, date, reason) => {
  // Find the document for the given salonId and barberId or create a new one if not exists
  const barberDayOff = await BarberDayOff.findOneAndUpdate(
    { salonId, barberId }, // Filter by salonId and barberId
    {
        $push: { 
            dayoff: { 
                date:date, 
                isApproved: false, 
                reason:reason 
            }
        } // Add the new dayoff entry to the dayoff array
    },
    { 
        new: true, // Return the updated document
        upsert: true // Create a new document if none matches
    }
);

return barberDayOff;
}


export const approveBarberDayOff = async(salonId,barberId, date) => {
    const barber = await BarberDayOff.findOneAndUpdate(
        { salonId, barberId, "dayoff.date": date }, // Match the document and specific date
        { $set: { "dayoff.$.isApproved": true } }, // Update the specific dayoff entry
        { new: true }
    );

return barber
}

export const getAllBarberDayoffRequests = async(salonId) => {

            // Fetch all records with matching salonId
            const barberDayOffRequests = await BarberDayOff.find({ salonId });

            // Filter dayoff entries where isApproved is false
            const filteredRequests = barberDayOffRequests.map((barber) => ({
                salonId: barber.salonId,
                barberId: barber.barberId,
                dayoffRequests: barber.dayoff.filter((dayoff) => !dayoff.isApproved),
            })).filter((barber) => barber.dayoffRequests.length > 0); // Exclude barbers with no pending day-offs
    
            return filteredRequests;
}