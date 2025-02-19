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


//SALON SERVED REPORT
export const getDailySalonAppointmentServedReport = async (salonId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: from.toDate(), $lte: to.toDate() },
        "appointmentList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(queue.appointmentDate).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklySalonServedReport = async (salonId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week


    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: from.toDate(), $lte: to.toDate() },
        "appointmentList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    let weeklyData;

    if (week === 0) {
        // If week value is 0, show present month's weeks
        weeklyData = groupByWeeks(dailyData, startOfMonth, endOfMonth);
    } else {
        // Otherwise, show data for the last 'n' weeks based on a 7-day interval
        const weeksAgo = today.clone().subtract(week, "weeks");
        const startOfLastNWeeks = weeksAgo.clone().startOf("day");  // Start of the current day
        const endOfLastNWeeks = today.clone().endOf("day");  // End of today

        // Fetch served queue data for the last 'n' weeks based on the last 7-day periods
        const lastNWeeksAppointmentHistory = await AppointmentHistory.find({
            salonId: salonId,
            "appointmentList.appointmentDate": { $gte: from.toDate(), $lte: to.toDate() },
            "appointmentList.status": "served"
        });

        // Process and group data by day for the last 'n' weeks
        let lastNWeeksData = {};
        lastNWeeksAppointmentHistory.forEach(entry => {
            entry.appointmentList.forEach(appointment => {
                if (appointment.status === "served") {
                    const dateKey = moment(appointment.appointmentDate).utc().format("YYYY-MM-DD");
                    lastNWeeksData[dateKey] = (lastNWeeksData[dateKey] || 0) + 1;
                }
            });
        });

        // Now, group daily data of last 'n' weeks into weekly data by 7-day intervals
        weeklyData = groupByWeeks(lastNWeeksData, startOfLastNWeeks, endOfLastNWeeks);
    }

    // Remove the entry where the weekStart is the same as weekEnd (single-day entry)
    weeklyData = weeklyData.filter(week => week.weekStart !== week.weekEnd);

    // Convert the weekly data into an array
    return weeklyData;
};

export const getMonthlySalonServedReport = async (salonId, months) => {
    const today = moment().utc();
    let startOfMonth, endOfMonth, dateFormat = "YYYY-MM"; // Group by month

    if (months === 0) {
        // Case 1: Show data for the entire current year
        startOfMonth = today.clone().startOf("year"); // Start of the year
        endOfMonth = today.clone().endOf("year"); // End of the year
    } else {
        // Case 2: Show data for the last 'n' months
        const monthsAgo = today.clone().subtract(months - 1, "months"); // Subtract n months
        startOfMonth = monthsAgo.clone().startOf("month"); // Start of that specific month
        endOfMonth = today.clone().endOf("month"); // End of the current month
    }

    // Fetch served queue data for the entire date range (month or last n months)
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: from.toDate(), $lte: to.toDate() },
        "appointmentList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(appointment.appointmentDate).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};


//SALON CANCELLED REPORT
export const getDailySalonCancelledReport = async (salonId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: from.toDate(), $lte: to.toDate() },
        "appointmentList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "cancelled") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklySalonCancelledReport = async (salonId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    // Fetch served queue data for the entire month
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "appointmentList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "cancelled") {
                const dateKey = moment(appointment.appointmentDate).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    let weeklyData;

    if (week === 0) {
        // If week value is 0, show present month's weeks
        weeklyData = groupByWeeks(dailyData, startOfMonth, endOfMonth);
    } else {
        // Otherwise, show data for the last 'n' weeks based on a 7-day interval
        const weeksAgo = today.clone().subtract(week, "weeks");
        const startOfLastNWeeks = weeksAgo.clone().startOf("day");  // Start of the current day
        const endOfLastNWeeks = today.clone().endOf("day");  // End of today

        // Fetch served queue data for the last 'n' weeks based on the last 7-day periods
        const lastNWeeksQueueHistory = await JoinedQueueHistory.find({
            salonId: salonId,
            "queueList.dateJoinedQ": { $gte: startOfLastNWeeks.toDate(), $lte: endOfLastNWeeks.toDate() },
            "queueList.status": "cancelled"
        });

        // Process and group data by day for the last 'n' weeks
        let lastNWeeksData = {};
        lastNWeeksQueueHistory.forEach(entry => {
            entry.queueList.forEach(queue => {
                if (queue.status === "served") {
                    const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                    lastNWeeksData[dateKey] = (lastNWeeksData[dateKey] || 0) + 1;
                }
            });
        });

        // Now, group daily data of last 'n' weeks into weekly data by 7-day intervals
        weeklyData = groupByWeeks(lastNWeeksData, startOfLastNWeeks, endOfLastNWeeks);
    }

    // Remove the entry where the weekStart is the same as weekEnd (single-day entry)
    weeklyData = weeklyData.filter(week => week.weekStart !== week.weekEnd);

    console.log(weeklyData)
    // Convert the weekly data into an array
    return weeklyData;
};

export const getMonthlySalonCancelledReport = async (salonId, months) => {
    const today = moment().utc();
    let startOfMonth, endOfMonth, dateFormat = "YYYY-MM"; // Group by month

    if (months === 0) {
        // Case 1: Show data for the entire current year
        startOfMonth = today.clone().startOf("year"); // Start of the year
        endOfMonth = today.clone().endOf("year"); // End of the year
    } else {
        // Case 2: Show data for the last 'n' months
        const monthsAgo = today.clone().subtract(months - 1, "months"); // Subtract n months
        startOfMonth = monthsAgo.clone().startOf("month"); // Start of that specific month
        endOfMonth = today.clone().endOf("month"); // End of the current month
    }

    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "queueList.status": "cancelled"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};



//BARBER SERVED REPORT
export const getDailyBarberServedReport = async (salonId, barberEmail, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", from.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", to.toDate()] },
                                { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                { $eq: ["$$queue.status", "served"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklyBarberServedReport = async (salonId,barberEmail, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startOfMonth.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endOfMonth.toDate()] },
                                { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                { $eq: ["$$queue.status", "served"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    let weeklyData;

    if (week === 0) {
        // If week value is 0, show present month's weeks
        weeklyData = groupByWeeks(dailyData, startOfMonth, endOfMonth);
    } else {
        // Otherwise, show data for the last 'n' weeks based on a 7-day interval
        const weeksAgo = today.clone().subtract(week, "weeks");
        const startOfLastNWeeks = weeksAgo.clone().startOf("day");  // Start of the current day
        const endOfLastNWeeks = today.clone().endOf("day");  // End of today

        // Fetch served queue data for the last 'n' weeks based on the last 7-day periods
        const lastNWeeksQueueHistory = await JoinedQueueHistory.aggregate([
            { $match: { salonId: salonId } },  // Match salonId
            {
                $project: {
                    queueList: {
                        $filter: {
                            input: "$queueList",
                            as: "queue",
                            cond: {
                                $and: [
                                    { $gte: ["$$queue.dateJoinedQ", startOfLastNWeeks.toDate()] },
                                    { $lte: ["$$queue.dateJoinedQ", endOfLastNWeeks.toDate()] },
                                    { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                    { $eq: ["$$queue.status", "served"] }
                                ]
                            }
                        }
                    },
                    salonId: 1,  // Keep salonId in the result
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        // Process and group data by day for the last 'n' weeks
        let lastNWeeksData = {};
        lastNWeeksQueueHistory.forEach(entry => {
            entry.queueList.forEach(queue => {
                if (queue.status === "served") {
                    const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                    lastNWeeksData[dateKey] = (lastNWeeksData[dateKey] || 0) + 1;
                }
            });
        });

        // Now, group daily data of last 'n' weeks into weekly data by 7-day intervals
        weeklyData = groupByWeeks(lastNWeeksData, startOfLastNWeeks, endOfLastNWeeks);
    }

    // Remove the entry where the weekStart is the same as weekEnd (single-day entry)
    weeklyData = weeklyData.filter(week => week.weekStart !== week.weekEnd);

    // Convert the weekly data into an array
    return weeklyData;
};

export const getMonthlyBarberServedReport = async (salonId, barberEmail, months) => {
    const today = moment().utc();
    let startOfMonth, endOfMonth, dateFormat = "YYYY-MM"; // Group by month

    if (months === 0) {
        // Case 1: Show data for the entire current year
        startOfMonth = today.clone().startOf("year"); // Start of the year
        endOfMonth = today.clone().endOf("year"); // End of the year
    } else {
        // Case 2: Show data for the last 'n' months
        const monthsAgo = today.clone().subtract(months - 1, "months"); // Subtract n months
        startOfMonth = monthsAgo.clone().startOf("month"); // Start of that specific month
        endOfMonth = today.clone().endOf("month"); // End of the current month
    }

    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startOfMonth.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endOfMonth.toDate()] },
                                { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                { $eq: ["$$queue.status", "served"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};



//BARBER CANCELLED REPORT
export const getDailyBarberCancelledReport = async (salonId, barberId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", from.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", to.toDate()] },
                                { $eq: ["$$queue.barberId", barberId] },
                                { $eq: ["$$queue.status", "cancelled"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklyBarberCancelledReport = async (salonId, barberId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startOfMonth.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endOfMonth.toDate()] },
                                { $eq: ["$$queue.barberId", barberId] },
                                { $eq: ["$$queue.status", "cancelled"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    let weeklyData;

    if (week === 0) {
        // If week value is 0, show present month's weeks
        weeklyData = groupByWeeks(dailyData, startOfMonth, endOfMonth);
    } else {
        // Otherwise, show data for the last 'n' weeks based on a 7-day interval
        const weeksAgo = today.clone().subtract(week, "weeks");
        const startOfLastNWeeks = weeksAgo.clone().startOf("day");  // Start of the current day
        const endOfLastNWeeks = today.clone().endOf("day");  // End of today

        // Fetch served queue data for the last 'n' weeks based on the last 7-day periods
        const lastNWeeksQueueHistory = await JoinedQueueHistory.aggregate([
            { $match: { salonId: salonId } },  // Match salonId
            {
                $project: {
                    queueList: {
                        $filter: {
                            input: "$queueList",
                            as: "queue",
                            cond: {
                                $and: [
                                    { $gte: ["$$queue.dateJoinedQ", startOfLastNWeeks.toDate()] },
                                    { $lte: ["$$queue.dateJoinedQ", endOfLastNWeeks.toDate()] },
                                    { $eq: ["$$queue.barberId", barberId] },
                                    { $eq: ["$$queue.status", "cancelled"] }
                                ]
                            }
                        }
                    },
                    salonId: 1,  // Keep salonId in the result
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        // Process and group data by day for the last 'n' weeks
        let lastNWeeksData = {};
        lastNWeeksQueueHistory.forEach(entry => {
            entry.queueList.forEach(queue => {
                if (queue.status === "cancelled") {
                    const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                    lastNWeeksData[dateKey] = (lastNWeeksData[dateKey] || 0) + 1;
                }
            });
        });

        // Now, group daily data of last 'n' weeks into weekly data by 7-day intervals
        weeklyData = groupByWeeks(lastNWeeksData, startOfLastNWeeks, endOfLastNWeeks);
    }

    // Remove the entry where the weekStart is the same as weekEnd (single-day entry)
    weeklyData = weeklyData.filter(week => week.weekStart !== week.weekEnd);

    // Convert the weekly data into an array
    return weeklyData;
};

export const getMonthlyBarberCancelledReport = async (salonId, barberId, months) => {
    const today = moment().utc();
    let startOfMonth, endOfMonth, dateFormat = "YYYY-MM"; // Group by month

    if (months === 0) {
        // Case 1: Show data for the entire current year
        startOfMonth = today.clone().startOf("year"); // Start of the year
        endOfMonth = today.clone().endOf("year"); // End of the year
    } else {
        // Case 2: Show data for the last 'n' months
        const monthsAgo = today.clone().subtract(months - 1, "months"); // Subtract n months
        startOfMonth = monthsAgo.clone().startOf("month"); // Start of that specific month
        endOfMonth = today.clone().endOf("month"); // End of the current month
    }

    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startOfMonth.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endOfMonth.toDate()] },
                                { $eq: ["$$queue.barberId", barberId] },
                                { $eq: ["$$queue.status", "cancelled"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};



//SALON SERVED REPORT BY DATE RANGE
export const getDailySalonServedReportByDateRange = async (salonId, from, to ) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startDate.toDate(), $lte: endDate.toDate() },
        "queueList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklySalonServedReportByDateRange = async (salonId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    // Fetch served queue data within the date range
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startDate.toDate(), $lte: endDate.toDate() },
        "queueList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Manually group data into weeks from the `from` date
    const weeklyData = [];
    let currentStart = startDate.clone();
    
    while (currentStart.isBefore(endDate)) {
        let currentEnd = currentStart.clone().add(6, "days"); // Move forward 6 days

        // Ensure the last week doesn't exceed the 'to' date
        if (currentEnd.isAfter(endDate)) {
            currentEnd = endDate.clone(); // Adjust the last week's end date
        }
    
        let totalQueue = 0;
    
        // Sum up queue counts within the week range
        Object.keys(dailyData).forEach(date => {
            let momentDate = moment.utc(date, "YYYY-MM-DD");
            if (momentDate.isBetween(currentStart, currentEnd, "day", "[]")) {
                totalQueue += dailyData[date];
            }
        });
    
        weeklyData.push({
            weekStart: currentStart,
            weekEnd: currentEnd,
            totalQueue: totalQueue
        });
    
        // Move to the next week
        currentStart = currentEnd.clone().add(1, "day");
    }
    

    return weeklyData;
};

export const getMonthlySalonServedReportByDateRange = async (salonId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month
    

    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "queueList.status": "served"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};


//SALON CANCELLED REPORT BY DATE RANGE
export const getDailySalonCancelledReportByDateRange = async (salonId, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startDate.toDate(), $lte: endDate.toDate() },
        "queueList.status": "cancelled"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklySalonCancelledReportByDateRange = async (salonId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    // Fetch served queue data within the date range
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startDate.toDate(), $lte: endDate.toDate() },
        "queueList.status": "cancelled"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Manually group data into weeks from the `from` date
    const weeklyData = [];
    let currentStart = startDate.clone();
    
    while (currentStart.isBefore(endDate)) {
        let currentEnd = currentStart.clone().add(6, "days"); // Move forward 6 days

        // Ensure the last week doesn't exceed the 'to' date
        if (currentEnd.isAfter(endDate)) {
            currentEnd = endDate.clone(); // Adjust the last week's end date
        }
    
        let totalQueue = 0;
    
        // Sum up queue counts within the week range
        Object.keys(dailyData).forEach(date => {
            let momentDate = moment.utc(date, "YYYY-MM-DD");
            if (momentDate.isBetween(currentStart, currentEnd, "day", "[]")) {
                totalQueue += dailyData[date];
            }
        });
    
        weeklyData.push({
            weekStart: currentStart,
            weekEnd: currentEnd,
            totalQueue: totalQueue
        });
    
        // Move to the next week
        currentStart = currentEnd.clone().add(1, "day");
    }
    

    return weeklyData;
};

export const getMonthlySalonCancelledReportByDateRange = async (salonId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month

    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "queueList.status": "cancelled"
    });

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};



//BARBER SERVED REPORT BY DATE RANGE
export const getDailyBarberServedReportByDateRange = async (salonId, barberEmail, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startDate.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endDate.toDate()] },
                                { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                { $eq: ["$$queue.status", "served"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklyBarberServedReportByDateRange = async (salonId, barberEmail, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startDate.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endDate.toDate()] },
                                { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                { $eq: ["$$queue.status", "served"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Manually group data into weeks from the `from` date
    const weeklyData = [];
    let currentStart = startDate.clone();
    
    while (currentStart.isBefore(endDate)) {
        let currentEnd = currentStart.clone().add(6, "days"); // Move forward 6 days

        // Ensure the last week doesn't exceed the 'to' date
        if (currentEnd.isAfter(endDate)) {
            currentEnd = endDate.clone(); // Adjust the last week's end date
        }
    
        let totalQueue = 0;
    
        // Sum up queue counts within the week range
        Object.keys(dailyData).forEach(date => {
            let momentDate = moment.utc(date, "YYYY-MM-DD");
            if (momentDate.isBetween(currentStart, currentEnd, "day", "[]")) {
                totalQueue += dailyData[date];
            }
        });
    
        weeklyData.push({
            weekStart: currentStart,
            weekEnd: currentEnd,
            totalQueue: totalQueue
        });
    
        // Move to the next week
        currentStart = currentEnd.clone().add(1, "day");
    }
    

    return weeklyData;
};

export const getMonthlyBarberServedReportByDateRange = async (salonId, barberEmail, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month


    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startOfMonth.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endOfMonth.toDate()] },
                                { $eq: ["$$queue.servedByBarberEmail", barberEmail] },
                                { $eq: ["$$queue.status", "served"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};



//BARBER CANCELLED REPORT
export const getDailyBarberCancelledReportByDateRange = async (salonId, barberId, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startDate.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endDate.toDate()] },
                                { $eq: ["$$queue.barberId", barberId] },
                                { $eq: ["$$queue.status", "cancelled"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklyBarberCancelledReportByDateRange = async (salonId, barberId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startDate.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endDate.toDate()] },
                                { $eq: ["$$queue.barberId", barberId] },
                                { $eq: ["$$queue.status", "cancelled"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Manually group data into weeks from the `from` date
    const weeklyData = [];
    let currentStart = startDate.clone();
    
    while (currentStart.isBefore(endDate)) {
        let currentEnd = currentStart.clone().add(6, "days"); // Move forward 6 days

        // Ensure the last week doesn't exceed the 'to' date
        if (currentEnd.isAfter(endDate)) {
            currentEnd = endDate.clone(); // Adjust the last week's end date
        }
    
        let totalQueue = 0;
    
        // Sum up queue counts within the week range
        Object.keys(dailyData).forEach(date => {
            let momentDate = moment.utc(date, "YYYY-MM-DD");
            if (momentDate.isBetween(currentStart, currentEnd, "day", "[]")) {
                totalQueue += dailyData[date];
            }
        });
    
        weeklyData.push({
            weekStart: currentStart,
            weekEnd: currentEnd,
            totalQueue: totalQueue
        });
    
        // Move to the next week
        currentStart = currentEnd.clone().add(1, "day");
    }
    

    return weeklyData;
};


export const getMonthlyBarberCancelledReportByDateRange = async (salonId, barberId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month


    // Fetch served queue data for the entire date range (month or last n months)
    const queueHistory = await JoinedQueueHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                queueList: {
                    $filter: {
                        input: "$queueList",
                        as: "queue",
                        cond: {
                            $and: [
                                { $gte: ["$$queue.dateJoinedQ", startOfMonth.toDate()] },
                                { $lte: ["$$queue.dateJoinedQ", endOfMonth.toDate()] },
                                { $eq: ["$$queue.barberId", barberId] },
                                { $eq: ["$$queue.status", "cancelled"] }
                            ]
                        }
                    }
                },
                salonId: 1,  // Keep salonId in the result
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // Process and group data by day
    let dailyData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM"); // Group by month
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
        });
    });

    // Group data by month
    let monthlyData;

    // Helper function to group by months
    const groupByMonths = (dailyData, startOfMonth, endOfMonth) => {
        const monthlyData = [];
        let currentMonth = startOfMonth.clone().startOf('month'); // Start of the first month in the range

        // Loop through each month in the range
        while (currentMonth.isBefore(endOfMonth) || currentMonth.isSame(endOfMonth, "month")) {
            const monthKey = currentMonth.format("YYYY-MM"); // Group by year and month
            const monthlyCount = dailyData[monthKey] || 0;

            // Add month data to the result
            monthlyData.push({ month: monthKey, count: monthlyCount });

            // Move to the next month
            currentMonth.add(1, 'month');
        }
        return monthlyData;
    };

    // Use the helper function to group data by month
    monthlyData = groupByMonths(dailyData, startOfMonth, endOfMonth);

    // Return the final monthly data
    return monthlyData;
};


export const fillMissingDates = (data, fromDate, toDate, reportType) => {
    const result = [];
    let currentDate = moment.utc(fromDate);
    const endDate = moment.utc(toDate);

    // Loop over the range based on the report type (daily, weekly, or monthly)
    while (currentDate.isSameOrBefore(endDate, reportType === "daily" ? "day" : reportType === "weekly" ? "week" : "month")) {
        let formattedDate;
        let key;

        if (reportType === "daily") {
            // Handle daily reports
            key = "date";
            formattedDate = currentDate.format("YYYY-MM-DD");
            currentDate.add(1, "day"); // Move to next day
        } else if (reportType === "weekly") {
            // Handle weekly reports
            key = "week";
            formattedDate = `${currentDate.isoWeekYear()}-${String(currentDate.isoWeek()).padStart(2, "0")}`;
            currentDate.add(1, "week"); // Move to next week
        } else if (reportType === "monthly") {
            // Handle monthly reports
            key = "month";
            formattedDate = currentDate.format("YYYY-MM"); // Ensure correct month format
            console.log("Checking for month:", formattedDate);
            currentDate.add(1, "month"); // Move to next month
        }

        // Check if the formatted date already exists in the provided data
        const existingEntry = data.find(entry => entry[key] === formattedDate);

        // Push the result with either the count from existing data or 0 if not found
        result.push({
            [key]: formattedDate,  // Dynamically assign key
            totalQueue: existingEntry ? existingEntry.count : 0
        });
    }

    return result;
};

const groupByWeeks = (dailyData, startDate, endDate) => {
    const weeklyData = [];
    let currentWeek = [];
    let totalQueue = 0;

    // Get the range of dates from startDate to endDate
    let currentDate = startDate.clone();

    // Loop through each day from startDate to endDate and group them into 7-day weeks
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
        const dateKey = currentDate.format("YYYY-MM-DD");
        const dailyCount = dailyData[dateKey] || 0;

        // Add the daily count to the current week
        totalQueue += dailyCount;
        currentWeek.push({ date: dateKey, count: dailyCount });

        // If we've collected 7 days, push the week data and reset
        if (currentWeek.length === 7) {
            const weekStart = currentWeek[0].date;
            const weekEnd = currentWeek[6].date;
            weeklyData.push({
                weekStart: weekStart,
                weekEnd: weekEnd,
                totalQueue: totalQueue
            });
            currentWeek = []; // Reset for the next week
            totalQueue = 0; // Reset the total count for the next week
        }

        // Move to the next day
        currentDate.add(1, "day");
    }

    // If there are remaining days (less than 7), treat them as their own week
    if (currentWeek.length > 0) {
        const weekStart = currentWeek[0].date;
        const weekEnd = currentWeek[currentWeek.length - 1].date;
        weeklyData.push({
            weekStart: weekStart,
            weekEnd: weekEnd,
            totalQueue: totalQueue
        });
    }

    return weeklyData;
};