import moment from "moment";
import { findBarberAttendence, saveOldBarberAttendence, savedNewBarberAttendence } from "../../services/kiosk/barberAttendence/barberAttencenceService.js";
import { getSalonTimeZone } from "../../services/kiosk/salon/salonServices.js";

export const barberLogInTime = async (salonId, barberId, updatedAt) => {

    const originalDateTime = moment(updatedAt).local();
    const date = originalDateTime.format('YYYY-MM-DD');
    const dayOfWeek = originalDateTime.format('dddd');
    const time = originalDateTime.format('HH:mm:ss');
    
    const timeZone = await getSalonTimeZone(salonId);
    const timeZoneData = timeZone.timeZone;
    
    const timeZoneParts = timeZoneData.split('+');
    const offset = timeZoneParts[1];
    const [offsetHours, offsetMinutes] = offset.split(':').map(Number);
    
    // Adjust the original date and time based on the offset
    const adjustedDateTime = originalDateTime.clone().add(offsetHours, 'hours').add(offsetMinutes, 'minutes');
    
    // Get the adjusted date and time
    const adjustedDate = adjustedDateTime.format('YYYY-MM-DD');
    const adjustedTime = adjustedDateTime.format('HH:mm:ss');
    
    // Get the day of the week for the adjusted date
    const adjustedDayOfWeek = adjustedDateTime.format('dddd');
    console.log(adjustedDayOfWeek, adjustedDate, adjustedTime)

    // Find today's attendance record for the barber
    let attendanceRecord = await findBarberAttendence(salonId, barberId);
    if(!attendanceRecord){
        attendanceRecord = await savedNewBarberAttendence(salonId, barberId, adjustedDayOfWeek, adjustedDate, adjustedTime)
    }
    else{
        const todayAttendance = attendanceRecord.attendance.find(entry => entry.date === adjustedDate);
       
        if (todayAttendance) {
            // Update the sign-out time
            todayAttendance.signInTime = adjustedTime;
            await attendanceRecord.save(); // Save the updated record
            return { success: true, message: "SignIn time updated" };
    }else{
        attendanceRecord = await saveOldBarberAttendence(salonId, barberId, adjustedDayOfWeek, adjustedDate, adjustedTime);
    }
      
}

};

export const barberLogOutTime = async (salonId, barberId, updatedAt, salonTimeZone) => {

    // Convert updatedAt to salon's timezone
    // const date = salonTime.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
    const originalDateTime = moment(updatedAt).local();
    const date = originalDateTime.format('YYYY-MM-DD');
    const dayOfWeek = originalDateTime.format('dddd');
    const time = originalDateTime.format('HH:mm:ss');
    
    const timeZone = await getSalonTimeZone(salonId);
    const timeZoneData = timeZone.timeZone;
    
    const timeZoneParts = timeZoneData.split('+');
    const offset = timeZoneParts[1];
    const [offsetHours, offsetMinutes] = offset.split(':').map(Number);
    
    // Adjust the original date and time based on the offset
    const adjustedDateTime = originalDateTime.clone().add(offsetHours, 'hours').add(offsetMinutes, 'minutes');
    
    // Get the adjusted date and time
    const adjustedDate = adjustedDateTime.format('YYYY-MM-DD');
    const adjustedTime = adjustedDateTime.format('HH:mm:ss');
    
    // Find today's attendance record for the barber
    let attendanceRecord = await findBarberAttendence(salonId, barberId);

    if (attendanceRecord) {
        // Find today's attendance object in the array
        const todayAttendance = attendanceRecord.attendance.find(record => record.date === adjustedDate);

        if (todayAttendance) {
            // Update the sign-out time
            todayAttendance.signOutTime = adjustedTime;
            await attendanceRecord.save(); // Save the updated record
            return { success: true, message: "SignOut time updated" };
        } else {
            return { success: false, message: "Today's attendance record not found" };
        }
    } else {
        return { success: false, message: "Attendance record not found" };
    }
};

