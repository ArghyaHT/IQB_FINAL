import BarberBreakTime from "../../../models/barberBreakTimeModel.js";

export const addBarberBreakTimes = async (salonId, barberId, day, times) => {
    // Check if a record already exists for the given salonId and barberId
    let barberBreak = await BarberBreakTime.findOne({ salonId, barberId });

    if (!barberBreak) {
        // If no record exists, create a new one
        barberBreak = new BarberBreakTime({
            salonId,
            barberId,
            breakTimes: [{ day, timeSlot }] // Store multiple times
        });
    } else {
        // Check if the given day already exists in breakTimes
        const existingDay = barberBreak.breakTimes.find(b => b.day === day);

        if (existingDay) {
            // Remove all existing times
            existingDay.timeSlot = [];

            // Push only the new times
            existingDay.timeSlot.push(...times);
        } else {
            // If the day does not exist, push a new day with the times
            barberBreak.breakTimes.push({ day, timeSlot });
        }
    }

    // Save the updated or new record
    await barberBreak.save();

    return barberBreak;
}


export const getBarberBreakTimes = async (salonId, barberId, day) => {

    // Find the barber break times by salonId and barberId
    const barberBreakTimes = await BarberBreakTime.findOne({ salonId, barberId });

    if (!barberBreakTimes) {
        return null; // No break times found
    }

    // Find break times for the given day
    const breakForDay = barberBreakTimes.breakTimes.find(breakEntry => breakEntry.day === day);

    return breakForDay ? breakForDay.times : [];

}