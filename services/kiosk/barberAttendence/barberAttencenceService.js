import BarberAttendance from '../../../models/barberAttendenceModel.js';

export const findBarberAttendence = async (salonId, barberId) => {
    const barberAttendence = await BarberAttendance.findOne({ salonId, barberId })

    return barberAttendence;
}

export const savedNewBarberAttendence = async (salonId, barberId, adjustedDayOfWeek, adjustedDate, adjustedTime) => {
    // Find existing attendance record
    let existingAttendance = await BarberAttendance.findOne({ salonId, barberId });

    if (!existingAttendance) {
        // If no attendance record exists, create a new one and save it
        const newAttendanceRecord = new BarberAttendance({
            salonId,
            barberId,
            attendance: [{
                day: adjustedDayOfWeek,
                date: adjustedDate,
                signInTime: adjustedTime,
                signOutTime: ""
            }]
        });
        await newAttendanceRecord.save();
        return newAttendanceRecord;
    }

}

export const saveOldBarberAttendence = async (salonId, barberId, adjustedDayOfWeek, adjustedDate, adjustedTime)  => {
   // Find existing attendance record
   let existingAttendance = await BarberAttendance.findOne({ salonId, barberId });

   if(existingAttendance){
     // If attendance record exists, push the new attendance data into the existing array and save it
     existingAttendance.attendance.push({
        day: adjustedDayOfWeek,
        date: adjustedDate,
        signInTime: adjustedTime,
        signOutTime: ""
    });
    await existingAttendance.save();
    return existingAttendance;
   }
}


export const getBarberAttendence = async (salonId, barberId) => {
    const getAttendence = await BarberAttendance.findOne({ salonId, barberId });

    return getAttendence;
}
