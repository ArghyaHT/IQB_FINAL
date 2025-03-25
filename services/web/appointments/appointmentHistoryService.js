import moment from "moment";
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

export const getWeeklySalonAppointmentServedReport = async (salonId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week


    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
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
            "appointmentList.appointmentDate": { $gte: startOfLastNWeeks.toDate(), $lte: endOfLastNWeeks.toDate() },
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

export const getMonthlySalonAppointmentServedReport = async (salonId, months) => {
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
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
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
export const getDailySalonAppointmentCancelledReport = async (salonId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: from.toDate(), $lte: to.toDate() },
        "appointmentList.status": "cancelled"
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

export const getWeeklySalonAppointmentCancelledReport = async (salonId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    // Fetch served queue data for the entire month
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "appointmentList.status": "cancelled"
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
        const lastNWeeksAppointmentHistory = await AppointmentHistory.find({
            salonId: salonId,
            "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
            "appointmentList.status": "cancelled"
        });

        // Process and group data by day for the last 'n' weeks
        let lastNWeeksData = {};
        lastNWeeksAppointmentHistory.forEach(entry => {
            entry.appointmentList.forEach(appointment => {
                if (appointment.status === "cancelled") {
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

    console.log(weeklyData)
    // Convert the weekly data into an array
    return weeklyData;
};

export const getMonthlySalonAppointmentCancelledReport = async (salonId, months) => {
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
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "appointmentList.status": "cancelled"
    });

    // Process and group data by day
    let dailyData = {};
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "cancelled") {
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



//BARBER SERVED REPORT
export const getDailyBarberAppointmentServedReport = async (salonId, barberId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", from.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", to.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
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

export const getWeeklyBarberAppointmentServedReport = async (salonId, barberId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
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
        const lastNWeeksQueueHistory = await AppointmentHistory.aggregate([
            { $match: { salonId: salonId } },  // Match salonId
            {
                $project: {
                    queueList: {
                        $filter: {
                            input: "$appointmentList",
                            as: "appointment",
                            cond: {
                                $and: [
                                    { $gte: ["$$appointment.appointmentDate", startOfLastNWeeks.toDate()] },
                                    { $lte: ["$$appointment.appointmentDate", endOfLastNWeeks.toDate()] },
                                    { $eq: ["$$appointment.barberId", barberId] },
                                    { $eq: ["$$appointment.status", "served"] }
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

export const getMonthlyBarberAppointmentServedReport = async (salonId, barberId, months) => {
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
    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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



//BARBER CANCELLED REPORT
export const getDailyBarberAppointmentCancelledReport = async (salonId, barberId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", from.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", to.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "cancelled"] }
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

export const getWeeklyBarberAppointmentCancelledReport = async (salonId, barberId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "cancelled"] }
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
        const lastNWeeksAppointmentHistory = await AppointmentHistory.aggregate([
            { $match: { salonId: salonId } },  // Match salonId
            {
                $project: {
                    appointmentList: {
                        $filter: {
                            input: "$appointmentList",
                            as: "appointment",
                            cond: {
                                $and: [
                                    { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                    { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                    { $eq: ["$$appointment.barberId", barberId] },
                                    { $eq: ["$$appointment.status", "cancelled"] }
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
        lastNWeeksAppointmentHistory.forEach(entry => {
            entry.appointmentList.forEach(appointment => {
                if (appointment.status === "cancelled") {
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

export const getMonthlyBarberAppointmentCancelledReport = async (salonId, barberId, months) => {
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

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "cancelled"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
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
export const getDailySalonAppointmentServedReportByDateRange = async (salonId, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startDate.toDate(), $lte: endDate.toDate() },
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

    // Convert the daily data into an array
    let result = Object.keys(dailyData).map(date => ({
        date,
        count: dailyData[date]
    }));

    return fillMissingDates(result, from, to, 'daily');
};

export const getWeeklySalonAppointmentServedReportByDateRange = async (salonId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startDate.toDate(), $lte: endDate.toDate() },
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

export const getMonthlySalonAppointmentServedReportByDateRange = async (salonId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month


    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
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
export const getDailySalonAppointmentCancelledReportByDateRange = async (salonId, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startDate.toDate(), $lte: endDate.toDate() },
        "appointmentList.status": "cancelled"
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

export const getWeeklySalonAppointmentCancelledReportByDateRange = async (salonId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    // Fetch served queue data from the database
    const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startDate.toDate(), $lte: endDate.toDate() },
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

export const getMonthlySalonAppointmentCancelledReportByDateRange = async (salonId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month

      // Fetch served queue data from the database
      const appointmentHistory = await AppointmentHistory.find({
        salonId: salonId,
        "appointmentList.appointmentDate": { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        "appointmentList.status": "cancelled"
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
export const getDailyBarberServedAppointmentReportByDateRange = async (salonId, barberId, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startDate.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endDate.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
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

export const getWeeklyBarberServedAppointmentReportByDateRange = async (salonId, barberId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startDate.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endDate.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
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

export const getMonthlyBarberAppointmentServedReportByDateRange = async (salonId, barberId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month


    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
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
export const getDailyBarberAppointmentCancelledReportByDateRange = async (salonId, barberId, from, to) => {
    let startDate = moment.utc(from).startOf("day");
    let endDate = moment.utc(to).endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startDate.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endDate.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "cancelled"] }
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

export const getWeeklyBarberAppointmentCancelledReportByDateRange = async (salonId, barberId, from, to) => {
    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day"); // Ensures exact date
    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startDate.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endDate.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "cancelled"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "cancelled") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
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


export const getMonthlyBarberAppointmentCancelledReportByDateRange = async (salonId, barberId, from, to) => {
    const startOfMonth = moment.utc(from, "YYYY-MM-DD").startOf("month"); // Start of the month
    const endOfMonth = moment.utc(to, "YYYY-MM-DD").endOf("month"); // End of the month


    const appointmentHistory = await AppointmentHistory.aggregate([
        { $match: { salonId: salonId } },  // Match salonId
        {
            $project: {
                appointmentList: {
                    $filter: {
                        input: "$appointmentList",
                        as: "appointment",
                        cond: {
                            $and: [
                                { $gte: ["$$appointment.appointmentDate", startOfMonth.toDate()] },
                                { $lte: ["$$appointment.appointmentDate", endOfMonth.toDate()] },
                                { $eq: ["$$appointment.barberId", barberId] },
                                { $eq: ["$$appointment.status", "served"] }
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
    appointmentHistory.forEach(entry => {
        entry.appointmentList.forEach(appointment => {
            if (appointment.status === "served") {
                const dateKey = moment(appointment.appointmentDate).utc().format(dateFormat);
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


export const getTotalAppointmentCount = async (salonId) => {
    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        { $count: "totalCount" }
    ]);

    return result.length > 0 ? result[0].totalCount : 0;
};

export const getServedAppointmentCountlast7Days = async (salonId) => {
    const today = new Date();
    
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7); // Set to 7 days ago

    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        { $match: { 
            "appointmentList.appointmentDate": { $gte: last7Days },
            "appointmentList.status": "served" } }, // Filter only served appointments
        { $count: "servedCount" }
    ]);

    return result.length > 0 ? result[0].servedCount : 0;
};


export const getAppointmentCountForLastWeek = async (salonId) => {
    const today = new Date();
today.setHours(0, 0, 0, 0); // Midnight of today

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(today.getDate() - 7); // Start from 7 days before today
sevenDaysAgo.setHours(0, 0, 0, 0); // Midnight of that day

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1); // Move to yesterday
yesterday.setHours(23, 59, 59, 999); // End of yesterday

const result = await AppointmentHistory.aggregate([
    { $match: { salonId } },
    { $unwind: "$appointmentList" },
    {
        $match: {
            "appointmentList.appointmentDate": {
                $gte: sevenDaysAgo, // Start from 7 days ago (midnight)
                $lt: today // Exclude today (midnight start of today)
            }
        }
    },
    { $count: "totalCount" }
]);


    return result.length > 0 ? result[0].totalCount : 0;
};


export const getAppointmentCountForLast2Week = async (salonId) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);

    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.appointmentDate": { $gte: sevenDaysAgo } // Assuming 'servedAt' stores the date
            }
        },
        { $count: "totalCount" }
    ]);

    return result.length > 0 ? result[0].totalCount : 0;
};


export const getLastWeekAppointmentCountsEachDay = async (salonId) => {
    const today = moment().utc().startOf("day"); 
    const sevenDaysAgo = moment().utc().subtract(7, "days").startOf("day"); 

    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.appointmentDate": { 
                    $gte: sevenDaysAgo.toDate(), 
                    $lt: today.toDate() // Exclude today
                }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$appointmentList.appointmentDate" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // Ensure all 7 days are included
    const last7DaysCounts = [];
    for (let i = 6; i >= 0; i--) {  
        const currentDay = moment().utc().subtract(i + 1, "days").format("YYYY-MM-DD"); // Excludes today
        last7DaysCounts.push({
            date: currentDay,
            count: result.find(r => r._id === currentDay)?.count || 0 // Assign count if exists
        });
    }

    return last7DaysCounts;
};




export const getBarberTotalAppointmentCount = async (salonId, barberId) => {
    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        { $match: { "appointmentList.barberId": barberId } }, // Match barberId inside appointmentList
        { $count: "totalCount" }
    ]);

    return result.length > 0 ? result[0].totalCount : 0;
}


export const getBarberServedAppointmentCountLast7Days = async (salonId, barberId) => {
    const today = new Date();
    
const last7Days = new Date(today);
last7Days.setDate(today.getDate() - 7); // Set to 7 days ago
    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        { $match: {  "appointmentList.appointmentDate": { $gte: last7Days }, "appointmentList.barberId": barberId, "appointmentList.status": "served" } }, // Match barberId & served status
        { $count: "servedCount" }
    ]);

    return result.length > 0 ? result[0].servedCount : 0;
};

export const getBarberAppointmentCountForLastWeek = async (salonId, barberId) => {
    const today = new Date();
today.setHours(0, 0, 0, 0); // Midnight of today

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(today.getDate() - 7); // Start from 7 days before today
sevenDaysAgo.setHours(0, 0, 0, 0); // Midnight of that day

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1); // Move to yesterday
yesterday.setHours(23, 59, 59, 999); // End of yesterday

const result = await AppointmentHistory.aggregate([
    { $match: { salonId } },
    { $unwind: "$appointmentList" },
    {
        $match: {
            "appointmentList.barberId": barberId,
            "appointmentList.appointmentDate": {
                $gte: sevenDaysAgo, // Start from 7 days ago (midnight)
                $lt: today // Exclude today (midnight start of today)
            }
        }
    },
    { $count: "totalCount" }
]);


    return result.length > 0 ? result[0].totalCount : 0;
};


export const getBarberAppointmentCountForLast2Week = async (salonId, barberId) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);

    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.barberId": barberId,
                "appointmentList.appointmentDate": { $gte: sevenDaysAgo } // Assuming 'servedAt' stores the date
            }
        },
        { $count: "totalCount" }
    ]);

    return result.length > 0 ? result[0].totalCount : 0;
};


export const getLastWeekBarberAppointmentCountsEachDay = async (salonId, barberId) => {
    const today = new Date();
    
    // Correctly set startDate to exactly 6 days ago at midnight
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0); 

    // Correctly set endDate to today at 23:59:59
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const result = await AppointmentHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.barberId": barberId, // Match barberId
            }
        },
        {
            $addFields: {
                formattedDate: {
                    $dateToString: { format: "%Y-%m-%d", date: "$appointmentList.appointmentDate" }
                }
            }
        },
        {
            $match: {
                formattedDate: { 
                    $gte: startDate.toISOString().split("T")[0], 
                    $lte: endDate.toISOString().split("T")[0] 
                }
            }
        },
        {
            $group: {
                _id: "$formattedDate",
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // Ensure all 7 days are included with 0 count if no appointments exist
    const last7DaysCounts = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0); // Ensure no time component issues
        const formattedDate = date.toISOString().split("T")[0];

        const dayData = result.find(r => r._id === formattedDate);
        last7DaysCounts.push({ date: formattedDate, count: dayData ? dayData.count : 0 });
    }

    return last7DaysCounts;
};
