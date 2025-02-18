import moment from "moment";
import { getDailySalonServedReport, getMonthlySalonServedReport, getSalonCancelledQlist, getSalonServedQlist, getTotalSalonQlist, getWeeklySalonServedReport } from "../../../services/web/queue/joinQueueHistoryService.js";


export const salonServedReport = async(req, res, next) => {
    try {
        const { salonId, from, to, days, month, week, reportType, reportValue } = req.body;

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

        if(reportValue === "queueserved"){
                if(reportType === "daily"){
                    const getSalonServedReport = await getDailySalonServedReport(salonId, days);

                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonServedReport.map(item => ({
                            date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                            TotalQueue: item.totalQueue
                        }))
                    });

            }
            if (reportType === "monthly") {
                const getSalonServedReport = await getMonthlySalonServedReport(salonId, month);
            
                // Log the entire report data to inspect its structure and values                
                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonServedReport.map(item => {
                        return {
                            month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                            TotalQueue: item.count // Use item.count instead of item.totalQueue
                        };
                    })
                });
            }
            if (reportType === "weekly") {
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00
            
                const getSalonServedReport = await getWeeklySalonServedReport(salonId, week);
            
                return res.status(200).json({
                    success: true,
                    message: "Report retrieved successfully.",
                    response: getSalonServedReport.map(item => {
                        // Check if item.week is an array
                        if (Array.isArray(item.week) && item.week.length > 0) {
                            // Get the start and end date of the week based on the first and last day of the week
                            const startOfWeek = moment(item.week[0].date).format("MMM D");
                            const endOfWeek = moment(item.week[item.week.length - 1].date).format("MMM D");
                
                            console.log("Start of Week:", startOfWeek);
                            console.log("End of Week:", endOfWeek);
                
                            return {
                                week: `${startOfWeek} - ${endOfWeek}`,
                                totalQueue: item.totalQueue
                            };
                        } else {
                            console.error("Invalid week format:", item.week);
                            return {
                                week: "Invalid Week Format",
                                TotalQueue: item.totalQueue
                            };
                        }
                    })
                });
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
                // Get the first day of the year
                const firstDayOfYear = new Date(Date.UTC(year, 0, 1)); // Jan 1st
                const firstDayOfWeek = new Date(firstDayOfYear);
                
                // Adjust to the first Monday of the year if Jan 1st isn't a Monday
                const dayOfWeek = firstDayOfYear.getUTCDay(); 
                const daysToAdd = (dayOfWeek <= 1 ? 1 - dayOfWeek : 8 - dayOfWeek); // Ensure we get Monday
                firstDayOfWeek.setUTCDate(firstDayOfYear.getUTCDate() + daysToAdd);
            
                // Now, get the start of the week based on the given 'week' number
                const startOfWeek = new Date(firstDayOfWeek);
                startOfWeek.setUTCDate(firstDayOfWeek.getUTCDate() + (week - 1) * 7); // Adjust to the correct week
            
                // Get the last day of the week (6 days after the start of the week)
                let endOfWeek = new Date(startOfWeek);
                endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
            
                // 🔹 Find the last day of the month (this ensures we do not go beyond the month)
                const lastDayOfMonth = new Date(Date.UTC(year, startOfWeek.getUTCMonth() + 1, 0, 23, 59, 59, 999)); // End of the month
            
                // Ensure the end of the week does not exceed the last day of the month
                if (endOfWeek > lastDayOfMonth) {
                    endOfWeek = lastDayOfMonth;
                }
            
                return {
                    startOfWeek: startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    endOfWeek: endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                };
            }
        
            }

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
            // response: getSalonQueueReport
            response: getSalonQueueReport.map(item => ({
                date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                totalQueue: item.totalQueue
            }))
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