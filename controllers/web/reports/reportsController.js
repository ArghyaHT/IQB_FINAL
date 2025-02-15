import { getSalonCancelledQlist, getSalonServedQlist, getTotalSalonQlist } from "../../../services/web/queue/joinQueueHistoryService.js";


export const salonServedReport = async(req, res, next) => {
    try {
        const { salonId, from, to, reportType, reportValue } = req.body;

        if (!salonId || !reportType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: salonId, from, to, or reportType',
            });
        }

        if (!["daily", "weekly", "monthly"].includes(reportType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reportType. Allowed values: 'daily', 'weekly', 'monthly'."
            });
        }

        let fromDate = new Date(from);
        let toDate = new Date(to);

        // if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Invalid date format for from or to date',
        //     });
        // }

        if(reportValue === "queueserved"){

            const getSalonServedReport = await getSalonServedQlist(salonId, reportType);

            if(reportType === "daily"){
                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonServedReport.map(item => ({
                        date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                        totalQueue: item.totalQueue
                    }))
                });
            }

            if(reportType === "monthly"){
                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonServedReport.map(item => ({
                        month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                        totalQueue: item.totalQueue
                    }))
                });
            }


            if (reportType === "weekly") {
                const today = new Date();
            today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00
        
            return res.status(200).json({
                success: true,
                message: "Report retrieved successfully.",
                // response: getSalonQueueReport
                response: getSalonServedReport.map(item => {
                    // Extract year & week number
                    const [year, week] = item.week.split("-").map(Number);
                    const { startOfWeek, endOfWeek } = getWeekDateRange(year, week, today);
        
                    return {
                        week: `${startOfWeek} - ${endOfWeek}`,
                        totalQueue: item.totalQueue
                    };
                })
            });
        
            function getWeekDateRange(year, week, today) {
                const firstDayOfYear = new Date(Date.UTC(year, 0, 1)); // Jan 1st
                const firstDayOfWeek = new Date(firstDayOfYear);
                firstDayOfWeek.setUTCDate(firstDayOfYear.getUTCDate() + (week - 1) * 7); // Week start
        
                let lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setUTCDate(firstDayOfWeek.getUTCDate() + 6); // Normally end of week
        
                // 🔹 If last week exceeds today, limit it to today's date
                if (lastDayOfWeek > today) {
                    lastDayOfWeek = today;
                }
        
                return {
                    startOfWeek: firstDayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    endOfWeek: lastDayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                };
            }
        
            }
        }
        else{
            const getSalonCancelledReport = await getSalonCancelledQlist(salonId, reportType);

            if(reportType === "daily"){
                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonCancelledReport.map(item => ({
                        date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                        totalQueue: item.totalQueue
                    }))
                });
            }

            if(reportType === "monthly"){
                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonCancelledReport.map(item => ({
                        month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                        totalQueue: item.totalQueue
                    }))
                });
            }


            if (reportType === "weekly") {
                const today = new Date();
            today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00
        
            return res.status(200).json({
                success: true,
                message: "Report retrieved successfully.",
                // response: getSalonQueueReport
                response: getSalonCancelledReport.map(item => {
                    // Extract year & week number
                    const [year, week] = item.week.split("-").map(Number);
                    const { startOfWeek, endOfWeek } = getWeekDateRange(year, week, today);
        
                    return {
                        week: `${startOfWeek} - ${endOfWeek}`,
                        totalQueue: item.totalQueue
                    };
                })
            });
        
            function getWeekDateRange(year, week, today) {
                const firstDayOfYear = new Date(Date.UTC(year, 0, 1)); // Jan 1st
                const firstDayOfWeek = new Date(firstDayOfYear);
                firstDayOfWeek.setUTCDate(firstDayOfYear.getUTCDate() + (week - 1) * 7); // Week start
        
                let lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setUTCDate(firstDayOfWeek.getUTCDate() + 6); // Normally end of week
        
                // 🔹 If last week exceeds today, limit it to today's date
                if (lastDayOfWeek > today) {
                    lastDayOfWeek = today;
                }
        
                return {
                    startOfWeek: firstDayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    endOfWeek: lastDayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                };
            }
        
            }

            // return res.status(200).json({
            //     success: true,
            //     message: 'Report retrieved successfully.',
            //     response: getSalonCancelledReport,
            // });
        }   

    } catch (error) {
        next(error);
    }
}

export const dashboardReports = async(req, res, next) => {
    try{

        const { salonId, reportType } = req.body;

        const getSalonQueueReport = await getTotalSalonQlist(salonId, reportType);

        if(reportType === "daily") {
        return res.status(200).json({
            success: true,
            message: 'Report retrieved successfully.',
            response: getSalonQueueReport
            // response: getSalonQueueReport.map(item => ({
            //     date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
            //     totalQueue: item.totalQueue
            // }))
        });
    }

    if(reportType === "monthly") {
        return res.status(200).json({
            success: true,
            message: 'Report retrieved successfully.',
            response: getSalonQueueReport.map(item => ({
                month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                totalQueue: item.totalQueue
            }))
        });
    }

    if (reportType === "weekly") {
        const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00

    return res.status(200).json({
        success: true,
        message: "Report retrieved successfully.",
        // response: getSalonQueueReport
        response: getSalonQueueReport.map(item => {
            // Extract year & week number
            const [year, week] = item.week.split("-").map(Number);
            const { startOfWeek, endOfWeek } = getWeekDateRange(year, week, today);

            return {
                week: `${startOfWeek} - ${endOfWeek}`,
                totalQueue: item.totalQueue
            };
        })
    });

    function getWeekDateRange(year, week, today) {
        const firstDayOfYear = new Date(Date.UTC(year, 0, 1)); // Jan 1st
        const firstDayOfWeek = new Date(firstDayOfYear);
        firstDayOfWeek.setUTCDate(firstDayOfYear.getUTCDate() + (week - 1) * 7); // Week start

        let lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setUTCDate(firstDayOfWeek.getUTCDate() + 6); // Normally end of week

        // 🔹 If last week exceeds today, limit it to today's date
        if (lastDayOfWeek > today) {
            lastDayOfWeek = today;
        }

        return {
            startOfWeek: firstDayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            endOfWeek: lastDayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        };
    }

    }
    }
    catch (error) {
        next(error);
    }
}



//DESC:SALON CANCELLED REPORT ================
export const salonCancelledReport = async(req, res, next) => {
    try {
        const { salonId, from, to } = req.body; // Expect only salonId, from and to dates

        // Validate required fields
        if (!salonId || !from || !to) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: salonId, from, or to date',
            });
        }

        // Validate and parse dates
        let fromDate = new Date(from);
        let toDate = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format for from or to date',
            });
        }

        const getSaloncancelledReport = await getSalonCancelledQlist(salonId, fromDate, toDate);

        return res.status(200).json({
            success: true,
            message: 'Cancelled report retrieved successfully.',
            response: getSaloncancelledReport,
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
}