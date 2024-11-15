import moment from "moment";

//Function to generate TimeSlots of IntervalMins
export const generateTimeSlots = async(start, end, intervalInMinutes) => {
    const timeSlots = [];
    let currentTime = moment(start);

    while (currentTime < end) {
        const timeInterval = currentTime.format('HH:mm');
        timeSlots.push({ timeInterval, disabled: false });
        currentTime.add(intervalInMinutes, 'minutes');
    }

    return timeSlots;
}

