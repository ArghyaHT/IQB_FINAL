import BarberReservation from "../../../models/barberReservationModel.js";

export const addBarberReservations = async (salonId, barberId, date, startTime, endTime) => {
    let barberReservations = await BarberReservation.findOne({ salonId, barberId });


    if (!barberReservations) {
        // If no record exists, create a new one
        barberReservations = new BarberReservation({
            salonId,
            barberId,
            reservations: [{ date, startTime, endTime }] // Store multiple times
        });
    } else {
        // If the day does not exist, push a new day with the times
        barberReservations.reservations.push({ date, startTime, endTime });
    }

    // Save the updated or new record
    await barberReservations.save();

    return barberReservations
}


export const getBarberReservations = async (salonId, barberId, date) => {

            // Convert date to a proper format for matching
            const formattedDate = new Date(date).toISOString().split("T")[0]; // Extract YYYY-MM-DD

            // Find reservations where the given date exists
            const barberReservations = await BarberReservation.findOne({
                salonId,
                barberId,
                "reservations.date": new Date(formattedDate)
            });
    
            if (!barberReservations) {
                return [];
            }
    
            // Extract reservations for the given date
            const reservationForDay = barberReservations.reservations.find(
                (reservation) => reservation.date.toISOString().split("T")[0] === formattedDate
            );
    
            return reservationForDay ? [{ startTime: reservationForDay.startTime, endTime: reservationForDay.endTime }] : [];

}