import BarberDayOff from "../../../models/barberDayOffModel.js"

export const updateBarberDayOff = async(salonId, barberId) => {
    const barber = await BarberDayOff.findOne({ salonId, barberId })

    return barber
}

export const createBarberDayOff = async(salonId, barberId, barberDayOffs) => {
  // Find the document for the given salonId and barberId or create a new one if not exists
  const barberDayOff = await BarberDayOff({
    salonId,
    barberId,
    barberOffDays: barberDayOffs,
  }
); 
const savedRecord = await barberDayOff.save();
return savedRecord;
}

export const getBarberDayOffs = async(salonId, barberId) => {
    const record = await BarberDayOff.findOne({
        salonId, barberId
    })
    return record;
}

export const matchBarberOffDays = async(salonId, barberId, day) =>{
  // Find a record where the day matches the appointmentDays array
  const record = await BarberDayOff.findOne({
      salonId,
      barberId,
      barberOffDays: { $in: [day] }, 
      });
  return record;
}

