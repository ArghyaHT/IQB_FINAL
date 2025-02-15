import JoinedQueueHistory from "../../../models/joinQueueHistoryModel.js"

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

export const getSalonServedQlist = async (salonId, reportType) => {
    // const from = new Date(fromDate);
    // from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
    // const to = new Date(toDate);
    // to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

    const today = new Date();
    let from = new Date(today);
    let to = new Date(today);

    if (reportType === "daily") {
        from.setUTCDate(today.getUTCDate() - 30); // Get last 30 days
        from.setUTCHours(0, 0, 0, 0);
        to.setUTCHours(23, 59, 59, 999);
    } else if (reportType === "weekly") {
        from.setUTCDate(today.getUTCDate() - 7 * 12); // Get last 12 weeks
        from.setUTCHours(0, 0, 0, 0);
        to.setUTCHours(23, 59, 59, 999);
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
            $match: {
                'queueList.status': "served",
            }
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

//Reports cancelled q list
export const getSalonCancelledQlist = async (salonId, fromDate, toDate, reportType) => {
    const from = new Date(fromDate);
    from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
    const to = new Date(toDate);
    to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

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
            $match: {
                'queueList.status': "cancelled",
            }
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
    const salonQueueListHistory = await JoinedQueueHistory.findOne({ salonId })

    if (!salonQueueListHistory || !salonQueueListHistory.queueList || salonQueueListHistory.queueList.length === 0) {
        return [];
    }

    return salonQueueListHistory.queueList
}

export const getQueueHistoryByBarber = async (salonId, barberId) => {
    const barberQueuelisthistory = await JoinedQueueHistory.findOne({ salonId });


    if (barberQueuelisthistory) {
        const filteredQueueList = barberQueuelisthistory.queueList.filter(item => item.barberId === barberId);

        return filteredQueueList
    }

}

export const getTotalSalonQlist = async (salonId, reportType) => {
    const today = new Date();
    let from = new Date(today);
    let to = new Date(today);

    if (reportType === "daily") {
        from.setUTCDate(today.getUTCDate() - 7); // Get last 7 days
        from.setUTCHours(0, 0, 0, 0);
        to.setUTCHours(23, 59, 59, 999);
    } else if (reportType === "weekly") {
        from.setUTCDate(today.getUTCDate() - 7 * 12); // Get last 12 weeks
        from.setUTCHours(0, 0, 0, 0);
        to.setUTCHours(23, 59, 59, 999);
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
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
        let formattedDate;
        let key; // Dynamic key name
        if (reportType === "daily") {
            key = "date";
            formattedDate = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

            currentDate.setDate(currentDate.getDate() + 1); // Move to next day
        } else if (reportType === "weekly") {
            key = "week";
            const year = currentDate.getUTCFullYear();
            const weekNumber = getWeekNumber(currentDate);
            formattedDate = `${year}-${String(weekNumber).padStart(2, '0')}`; // YYYY-WW
            currentDate.setDate(currentDate.getDate() + 7); // Move to next week
        } else if (reportType === "monthly") {
            key = "month";
            formattedDate = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}`;
            
            // Stop if the generated month exceeds today's month
            if (
                currentDate.getUTCFullYear() > toDate.getUTCFullYear() || 
                (currentDate.getUTCFullYear() === toDate.getUTCFullYear() && currentDate.getUTCMonth() > toDate.getUTCMonth())
            ) {
                break;
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        const existingEntry = data.find(entry => entry.date === formattedDate);

        result.push({
            [key]: formattedDate, // Dynamically assign key
            totalQueue: existingEntry ? existingEntry.count : 0
        });
    }

    return result;
};

// Helper function to get week number of the year
const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const pastDays = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((pastDays + firstDayOfYear.getUTCDay() + 1) / 7);
};
