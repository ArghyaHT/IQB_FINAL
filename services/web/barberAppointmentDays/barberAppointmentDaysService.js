import BarberAppointmentDays from "../../../models/barberAppointmentDaysModel.js"

export const updateBarberAppointmentDays = async(salonId,barberId) => {
    const barber = await BarberAppointmentDays.findOne({ salonId, barberId })

    return barber
}

export const createBarberAppointmentDays = async(salonId, barberId, appointmentDays) => {
// Create a new record
const newRecord = new BarberAppointmentDays({
    salonId,
    barberId,
    appointmentDays,
});

// Save the record in the database
const savedRecord = await newRecord.save();
return savedRecord;
}

export const matchAppointmentDays = async(salonId, barberId, day) =>{
    // Find a record where the day matches the appointmentDays array
    const record = await BarberAppointmentDays.findOne({
        salonId,
        barberId,
        appointmentDays: { $in: [day] }, 
        });
    return record;
}

export const barberAppointmentDays = async(salonId, barberId) => {
    const record = await BarberAppointmentDays.findOne({
        salonId, barberId
    })
    return record;
}

