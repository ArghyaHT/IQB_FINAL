import moment from "moment";
import JoinedQueueHistory from "../../../models/joinQueueHistoryModel.js"
import { getBarberByBarberId } from "../barber/barberService.js";
import { findCustomerByEmail } from "../customer/customerService.js";

// FIND SALON IN HISTORY
export const findSalonQueueListHistory = async (salonId) => {
    const salon = await JoinedQueueHistory.findOne({ salonId });
    return salon;
}

//ADD SERVED Q TO HISTORY
export const addQueueHistory = async (salonId, element, updatedByBarberEmail, servedByBarberEmail, barberId, name, isAdmin) => {

    const newElement = {
        ...element.toObject(), // Convert Mongoose document to plain JavaScript object
        servedByBarberEmail: servedByBarberEmail,
        updatedByBarberEmail: updatedByBarberEmail,
        barberId: barberId,
        barberName: name,
        isAdmin: isAdmin
    };

    const newSalonHistory = new JoinedQueueHistory({
        salonId,
        queueList: [newElement],
    });
    await newSalonHistory.save();
}


export const addQueueHistoryWhenCanceled = async (salonId, canceledQueue, updatedByBarberEmail) => {

    const newElement = {
        ...canceledQueue.toObject(), // Convert Mongoose document to plain JavaScript object
        updatedByBarberEmail,
    };


    const salon = new JoinedQueueHistory({
        salonId,
        queueList: [newElement],
    });

    return salon;
}

//UPDATE THE STATUS FIELD IF SERVED
export const updateServed = async (salonId, _id) => {
    const updatedValue = await JoinedQueueHistory.updateOne(
        { salonId, 'queueList._id': _id },
        { $set: { 'queueList.$.status': 'served' } }
    );
    return updatedValue;
}

//UPDATE THE STATUS FIELD IF CANCELED
export const statusCancelQ = async (salonId, _id) => {
    const updatedValue = await JoinedQueueHistory.updateOne(
        { salonId, 'queueList._id': _id },
        { $set: { 'queueList.$.status': 'cancelled' } }
    );
    return updatedValue;
}

//GET Q HISTORY BY CUSTOMER EMAIL 
export const qhistoryByCustomer = async (salonId, customerEmail) => {
    const qHistory = await JoinedQueueHistory.aggregate([
        {
            $match: {
                salonId: salonId,
            },
        },
        {
            $unwind: "$queueList",
        },
        {
            $match: {
                'queueList.customerEmail': customerEmail,
            },
        },
    ]);
    return qHistory;
}

export const getSalonServedQlist = async (salonId, reportType, days, month) => {
    const today = moment().utc();
    let from = moment().utc();
    let to = moment().utc();
    let dateFormat;

    if (reportType === "daily") {
        from = today.clone().subtract(days - 1, "days").startOf("day");
        to = today.clone().endOf("day");
        dateFormat = "YYYY-MM-DD"; // Group by day
    } else if (reportType === "weekly") {
        // Get the first and last date of the month
        const startOfMonth = today.clone().startOf("month");
        const endOfMonth = today.clone().endOf("month");
        dateFormat = "YYYY-WW"; // Group by week

        // Fetch served queue data for the entire month
        from = startOfMonth;
        to = endOfMonth;

        console.log(from)
        console.log(to)

        // Fetch queue data for the whole month
        const queueHistory = await JoinedQueueHistory.find({
            salonId: salonId,
            "queueList.dateJoinedQ": { $gte: from.toDate(), $lte: to.toDate() },
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

        // Now, group daily data into weekly data
        const weeklyData = groupByWeeks(dailyData, startOfMonth, endOfMonth);

        // Convert the weekly data into an array
        return weeklyData;

    } else if (reportType === "monthly") {
        let from, to, dateFormat;
        const today = moment(); // Current date using moment.js

        if (month === 0) {
            // If month is 0, show all months of the current year
            from = today.clone().startOf("year");
            to = today.clone().endOf("year");
            dateFormat = "YYYY-MM"; // Group by month
        } else {
            // If a specific month (e.g., 3, 4) is provided, show data for that month
            from = today.clone().month(month - 1).startOf("month"); // month is 1-indexed, so subtract 1
            to = today.clone().month(month - 1).endOf("month");
            dateFormat = "YYYY-MM"; // Group by month
        }
    } else {
        throw new Error("Invalid report type. Must be 'daily', 'weekly', or 'monthly'.");
    }

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: from.toDate(), $lte: to.toDate() },
        "queueList.status": "served"
    });

    // Process and group data in JavaScript
    let groupedData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "served") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert grouped data into an array
    let result = Object.keys(groupedData).map(date => ({
        date,
        count: groupedData[date]
    }));

    return fillMissingDates(result, from, to, reportType);
};

//SALON SERVED REPORT
export const getDailySalonServedReport = async (salonId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: from.toDate(), $lte: to.toDate() },
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

export const getWeeklySalonServedReport = async (salonId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    // Fetch served queue data for the entire month
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
        const lastNWeeksQueueHistory = await JoinedQueueHistory.find({
            salonId: salonId,
            "queueList.dateJoinedQ": { $gte: startOfLastNWeeks.toDate(), $lte: endOfLastNWeeks.toDate() },
            "queueList.status": "served"
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


//SALON CANCELLED REPORT
export const getDailySalonCancelledReport = async (salonId, days) => {
    const today = moment().utc();
    let from = today.clone().subtract(days - 1, "days").startOf("day");
    let to = today.clone().endOf("day");
    let dateFormat = "YYYY-MM-DD"; // Group by day

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: from.toDate(), $lte: to.toDate() },
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

export const getWeeklySalonCancelledReport = async (salonId, week) => {
    const today = moment().utc();
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");
    let dateFormat = "YYYY-WW"; // Group by week

    // Fetch served queue data for the entire month
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

export const getWeeklyBarberServedReport = async (salonId, barberEmail, week) => {
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
export const getDailySalonServedReportByDateRange = async (salonId, from, to) => {
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










//Reports cancelled q list
export const getSalonCancelledQlist = async (salonId, reportType) => {
    // const from = new Date(fromDate);
    // from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
    // const to = new Date(toDate);
    // to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

    const today = moment().utc();
    let from = moment().utc();
    let to = moment().utc();
    let dateFormat;

    if (reportType === "daily") {
        from = today.clone().subtract(days - 1, "days").startOf("day");
        to = today.clone().endOf("day");
        dateFormat = "YYYY-MM-DD"; // Group by day
    } else if (reportType === "weekly") {
        from = today.clone().startOf("month");
        to = today.clone().endOf("day");
        dateFormat = "YYYY-[W]WW"; // Group by week
    } else if (reportType === "monthly") {
        from = today.clone().startOf("year");
        to = today.clone().endOf("year");
        dateFormat = "YYYY-MM"; // Group by month
    } else {
        throw new Error("Invalid report type. Must be 'daily', 'weekly', or 'monthly'.");
    }

    // Fetch served queue data from the database
    const queueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: from.toDate(), $lte: to.toDate() },
        "queueList.status": "cancelled"
    });

    // Process and group data in JavaScript
    let groupedData = {};
    queueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            if (queue.status === "cancelled") {
                const dateKey = moment(queue.dateJoinedQ).utc().format(dateFormat);
                groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
            }
        });
    });

    // Convert grouped data into an array
    let result = Object.keys(groupedData).map(date => ({
        date,
        count: groupedData[date]
    }));

    return fillMissingDates(result, from, to, reportType);
};

export const getBarberServedQlist = async (salonId, barberId, fromDate, toDate) => {
    // Parse the input dates, they should be in ISO format.
    const from = new Date(fromDate);
    from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
    const to = new Date(toDate);
    to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

    const qHistory = await JoinedQueueHistory.aggregate([
        {
            $match: {
                salonId: salonId,
                'queueList.dateJoinedQ': {
                    $gte: from, // Compare in UTC
                    $lte: to    // Compare in UTC
                },
                'queueList.barberId': barberId // Add barberId check
            }
        },
        {
            $unwind: "$queueList"
        },
        {
            $match: {
                'queueList.status': "served",
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: { format: "%Y-%m-%d", date: "$queueList.dateJoinedQ" } // Group by day
                    }
                },
                count: { $sum: 1 } // Count the number of served customers per day
            }
        },
        {
            $sort: { "_id.date": 1 } // Sort by date ascending
        }
    ]);

    // Fill in missing dates with count 0 (optional)
    const result = await fillMissingDates(qHistory, from, to);

    return result;
};

export const getSalonQueueHistory = async (salonId) => {
    const defaultProfileImage = [
        {
            url: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg",
        },
    ];

    const salonQueueListHistory = await JoinedQueueHistory.findOne({ salonId });

    if (!salonQueueListHistory || !salonQueueListHistory.queueList || salonQueueListHistory.queueList.length === 0) {
        return [];
    }

    const modifyQueueHistorylist = await Promise.all(
        salonQueueListHistory.queueList.map(async (queue) => {
            const barber = await getBarberByBarberId(queue.barberId);
            const customer = await findCustomerByEmail(queue.customerEmail);

            return {
                ...queue.toObject(), // Spread the existing queue properties
                barberProfile: barber?.profile || defaultProfileImage,
                customerProfile: customer?.profile || defaultProfileImage,
            };
        })
    );

    // Return the modified list instead of the original one
    return modifyQueueHistorylist;
}

export const getQueueHistoryByBarber = async (salonId, barberId) => {
    const defaultProfileImage = [{ url: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg" }];

    const barberQueueHistory = await JoinedQueueHistory.findOne({ salonId }).lean();

    if (!barberQueueHistory) return [];

    const filteredQueueList = await Promise.all(
        barberQueueHistory.queueList
            .filter(item => item.barberId === barberId)
            .map(async queue => {
                const barber = await getBarberByBarberId(queue.barberId);
                const customer = await findCustomerByEmail(queue.customerEmail);

                return {
                    ...queue,
                    barberProfile: barber?.profile?.length > 0 ? barber.profile : defaultProfileImage,
                    customerProfile: customer?.profile || defaultProfileImage
                };
            })
    );

    return filteredQueueList;
};

export const getTotalSalonQlist = async (salonId, reportType) => {
    const today = new Date();
    let from = new Date(today);
    let to = new Date(today);

    if (reportType === "daily") {
        from.setUTCDate(today.getUTCDate() - 7); // Get last 30 days
        from.setUTCHours(0, 0, 0, 0);
        to.setUTCHours(23, 59, 59, 999);
    } else if (reportType === "weekly") {
        from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); // First day of the month
        to.setUTCHours(23, 59, 59, 999); // Last second of today
    } else if (reportType === "monthly") {
        const currentYear = today.getUTCFullYear();
        const currentMonth = today.getUTCMonth(); // 0-based (Jan = 0, Feb = 1, ...)

        from = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0)); // Start from Jan 1st, 00:00 UTC
        to = new Date(Date.UTC(currentYear, currentMonth, today.getUTCDate(), 23, 59, 59, 999)); // End at today's date
    }


    // Determine the date format based on report type
    let dateFormat;
    if (reportType === "daily") {
        dateFormat = "%Y-%m-%d"; // Group by day
    } else if (reportType === "weekly") {
        dateFormat = "%Y-%U"; // Group by week number (Year-Week)
    } else if (reportType === "monthly") {
        dateFormat = "%Y-%m"; // Group by month (Year-Month)
    } else {
        throw new Error("Invalid report type. Must be 'daily', 'weekly', or 'monthly'.");
    }

    const qHistory = await JoinedQueueHistory.aggregate([
        {
            $match: {
                salonId: salonId,
                'queueList.dateJoinedQ': {
                    $gte: from,
                    $lte: to
                }
            }
        },
        {
            $unwind: "$queueList"
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: dateFormat, date: "$queueList.dateJoinedQ" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                count: 1
            }
        },
        {
            $sort: { date: 1 }
        }
    ]);

    return fillMissingDates(qHistory, from, to, reportType);
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


// Grouping function (same as before)
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


export const totalQueueCountsForLast30Days = async (salonId) => {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    // Count queue entries for the last 30 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { $match: { "queueList.dateJoinedQ": { $gte: last30Days } } },
        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};

export const totalQueueServedCountsForLast30Days = async (salonId) => {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    // Count queue entries for the last 30 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { $match: { "queueList.dateJoinedQ": { $gte: last30Days },
    "queueList.status": "served"  } },
        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};



export const totalQueueCountsForLast60Days = async (salonId) => {
    const today = new Date();
    const last60Days = new Date();
    last60Days.setDate(today.getDate() - 60);

    // Count queue entries for the last 30 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { $match: { "queueList.dateJoinedQ": { $gte: last60Days } } },
        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};


export const getTotalQueueCount = async (salonId) => {
    const result = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { $count: "totalCount" }
    ]);

    return result.length > 0 ? result[0].totalCount : 0;
};

export const getServedQueueCount = async (salonId) => {
    const result = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { $match: { "queueList.status": "served" } }, // Filter only served queues
        { $count: "servedCount" }
    ]);

    return result.length > 0 ? result[0].servedCount : 0;
};


export const totalQueueCountsForLast7Days = async (salonId) => {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);

    // Count queue entries for the last 7 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { $match: { "queueList.dateJoinedQ": { $gte: last7Days } } },
        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};


export const getLast7DaysQueueCount = async (salonId) => {
    const yesterday = moment().utc().startOf("day"); // Start of yesterday (00:00:00 UTC)
    const sevenDaysAgo = moment().utc().subtract(6, "days").startOf("day"); // Start of 7 days ago (00:00:00 UTC)

    // Fetch all queue data from 7 days ago to the end of yesterday
    const last7DaysQueueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.dateJoinedQ": { $gte: sevenDaysAgo.toDate(), $lt: yesterday.toDate() },
    });

    // Process and group data by day
    let last7DaysData = {};

    last7DaysQueueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
            last7DaysData[dateKey] = (last7DaysData[dateKey] || 0) + 1;
        });
    });

    // Ensure all days in the range are represented, even if count is 0
    let result = [];
    for (let i = 6; i >= 0; i--) {  // Loop backwards from 6 to 0
        const currentDay = moment().utc().subtract(i + 1, "days").format("YYYY-MM-DD"); // Subtracting i + 1 to exclude today
        result.push({
            date: currentDay,
            count: last7DaysData[currentDay] || 0
        });
    }

    return result;
};


export const totalBarberQueueCountsForLast30Days = async (salonId, barberId) => {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    // Count queue entries for the last 30 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        {
            $match: {
                $and: [
                    { "queueList.dateJoinedQ": { $gte: last30Days } },
                    { "queueList.barberId": barberId }
                ]
            }
        },
        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};

export const totalBarberQueueCountsForLast60Days = async (salonId, barberId) => {
    const today = new Date();
    const last60Days = new Date();
    last60Days.setDate(today.getDate() - 60);

    // Count queue entries for the last 30 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        {
            $match: {
                $and: [
                    { "queueList.dateJoinedQ": { $gte: last60Days } },
                    { "queueList.barberId": barberId }
                ]
            }
        },
        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};


export const getTotalBarberQueueCount = async (salonId, barberId) => {
    const result = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        { 
            $match: 
                { "queueList.barberId": barberId }
          },
        { $count: "totalCount" }
    ]);

    return result.length > 0 ? result[0].totalCount : 0;
};


export const getBarberServedQueueCount = async (salonId, barberId) => {
    const result = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        {
            $match: {
                $and: [
                    { "queueList.status": "served" },
                    { "queueList.barberId": barberId }
                ]
            }
        },
        { $count: "servedCount" }
    ]);

    return result.length > 0 ? result[0].servedCount : 0;
};


export const totalbarberQueueCountsForLast7Days = async (salonId, barberId) => {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);

    // Count queue entries for the last 7 days
    const totalCount = await JoinedQueueHistory.aggregate([
        { $match: { salonId } },
        { $unwind: "$queueList" },
        {
            $match: {
                $and: [
                    { "queueList.dateJoinedQ": { $gte: last7Days } },
                    { "queueList.barberId": barberId }
                ]
            }
        },        { $count: "totalCount" }
    ]);

    return { totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0 };
};

export const getBarberLast7DaysQueueCount = async (salonId, barberId) => {
    const yesterday = moment().utc().startOf("day"); // Start of yesterday (00:00:00 UTC)
    const sevenDaysAgo = moment().utc().subtract(6, "days").startOf("day"); // Start of 7 days ago (00:00:00 UTC)

    // Fetch all queue data from 7 days ago to the end of yesterday
    const last7DaysQueueHistory = await JoinedQueueHistory.find({
        salonId: salonId,
        "queueList.barberId": barberId,
        "queueList.dateJoinedQ": { $gte: sevenDaysAgo.toDate(), $lt: yesterday.toDate() },
    });

    // Process and group data by day
    let last7DaysData = {};

    last7DaysQueueHistory.forEach(entry => {
        entry.queueList.forEach(queue => {
            const dateKey = moment(queue.dateJoinedQ).utc().format("YYYY-MM-DD");
            last7DaysData[dateKey] = (last7DaysData[dateKey] || 0) + 1;
        });
    });

    // Ensure all days in the range are represented, even if count is 0
    let result = [];
    for (let i = 6; i >= 0; i--) {  // Loop backwards from 6 to 0
        const currentDay = moment().utc().subtract(i + 1, "days").format("YYYY-MM-DD"); // Subtracting i + 1 to exclude today
        result.push({
            date: currentDay,
            count: last7DaysData[currentDay] || 0
        });
    }

    return result;
};




