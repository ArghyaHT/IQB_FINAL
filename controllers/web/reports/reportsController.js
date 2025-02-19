import moment from "moment";
import { getDailyBarberCancelledReport, getDailyBarberCancelledReportByDateRange, getDailyBarberServedReport, getDailyBarberServedReportByDateRange, getDailySalonCancelledReport, getDailySalonCancelledReportByDateRange, getDailySalonServedReport, getDailySalonServedReportByDateRange, getMonthlyBarberCancelledReport, getMonthlyBarberCancelledReportByDateRange, getMonthlyBarberServedReport, getMonthlyBarberServedReportByDateRange, getMonthlySalonCancelledReport, getMonthlySalonCancelledReportByDateRange, getMonthlySalonServedReport, getMonthlySalonServedReportByDateRange, getSalonCancelledQlist, getSalonServedQlist, getTotalSalonQlist, getWeeklyBarberCancelledReport, getWeeklyBarberCancelledReportByDateRange, getWeeklyBarberServedReport, getWeeklyBarberServedReportByDateRange, getWeeklySalonCancelledReport, getWeeklySalonCancelledReportByDateRange, getWeeklySalonServedReport, getWeeklySalonServedReportByDateRange } from "../../../services/web/queue/joinQueueHistoryService.js";


export const salonServedReport = async (req, res, next) => {
    try {
        const { salonId, from, to, days, barberId, barberEmail, month, week, reportType, reportValue } = req.body;


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


        if (from && to) {
            if (barberEmail) {
                if (reportValue === "queueserved") {

                    if (reportType === "daily") {

                        // Convert 'from' and 'to' to Date objects
                        const fromDate = new Date(from);
                        const toDate = new Date(to);

                        // Calculate the difference in days
                        const timeDiff = toDate - fromDate;
                        const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                        // Validate date range (should not exceed 20 days)
                        if (dayDiff > 20) {
                            return res.status(400).json({
                                success: false,
                                message: "Date range should not exceed 20 days."
                            });
                        }
                        const getSalonServedReport = await getDailyBarberServedReportByDateRange(salonId, barberEmail, from, to);

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

                        const startDate = moment.utc(from, "YYYY-MM-DD").startOf("month");
                        const endDate = moment.utc(to, "YYYY-MM-DD").endOf("month");
                    
                        // Calculate the total number of months in the range
                        const totalMonths = endDate.diff(startDate, "months") + 1; // +1 to include the last month
                    
                        // If the range exceeds 24 months, return an error response
                        if (totalMonths > 24) {
                            return res.status(400).json({
                                success: false,
                                message: "Date range exceeds the allowed limit of 24 months. Please select a shorter range."
                            });
                        }
                        const getSalonServedReport = await getMonthlyBarberServedReportByDateRange(salonId, barberEmail, from, to);

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

                        const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                        const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                        // Calculate the number of weeks in the range
                        const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                        // If the range exceeds 20 weeks, return an error response
                        if (totalWeeks > 20) {
                            return res.status(400).json({
                                success: false,
                                message: "Date range exceeds the allowed limit of 20 weeks. Please select a shorter range."
                            });
                        }

                        const getSalonServedReport = await getWeeklyBarberServedReportByDateRange(salonId, barberEmail, from, to);

                        return res.status(200).json({
                            success: true,
                            message: "Report retrieved successfully.",
                            response: getSalonServedReport.map(item => {
                                // Format the week range (e.g., "Jan 1 - Jan 7")
                                const weekStart = moment(item.weekStart).format("MMM D");
                                const weekEnd = moment(item.weekEnd).format("MMM D");

                                return {
                                    week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                    TotalQueue: item.totalQueue
                                };
                            })
                        });
                    }
                }
            }

            if (barberId) {
                if (reportType === "daily") {

                    // Convert 'from' and 'to' to Date objects
                    const fromDate = new Date(from);
                    const toDate = new Date(to);

                    // Calculate the difference in days
                    const timeDiff = toDate - fromDate;
                    const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                    // Validate date range (should not exceed 20 days)
                    if (dayDiff > 20) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range should not exceed 20 days."
                        });
                    }

                    const getSalonCancelledReport = await getDailyBarberCancelledReportByDateRange(salonId, barberId, from, to);

                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonCancelledReport.map(item => ({
                            date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                            TotalQueue: item.totalQueue
                        }))
                    });

                }
                if (reportType === "monthly") {

                    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("month");
                    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("month");
                
                    // Calculate the total number of months in the range
                    const totalMonths = endDate.diff(startDate, "months") + 1; // +1 to include the last month
                
                    // If the range exceeds 24 months, return an error response
                    if (totalMonths > 24) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range exceeds the allowed limit of 24 months. Please select a shorter range."
                        });
                    }
                    const getSalonCancelledReport = await getMonthlyBarberCancelledReportByDateRange(salonId, barberId, from, to);

                    // Log the entire report data to inspect its structure and values                
                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonCancelledReport.map(item => {
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

                    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                    // Calculate the number of weeks in the range
                    const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                    // If the range exceeds 20 weeks, return an error response
                    if (totalWeeks > 20) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range exceeds the allowed limit of 20 weeks. Please select a shorter range."
                        });
                    }

                    const getSalonCancelledReport = await getWeeklyBarberCancelledReportByDateRange(salonId, barberId, from, to);

                    return res.status(200).json({
                        success: true,
                        message: "Report retrieved successfully.",
                        response: getSalonCancelledReport.map(item => {
                            // Format the week range (e.g., "Jan 1 - Jan 7")
                            const weekStart = moment(item.weekStart).format("MMM D");
                            const weekEnd = moment(item.weekEnd).format("MMM D");

                            return {
                                week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                TotalQueue: item.totalQueue
                            };
                        })
                    });
                }
            }

            if (reportValue === "queueserved") {
                if (reportType === "daily") {

                    // Convert 'from' and 'to' to Date objects
                    const fromDate = new Date(from);
                    const toDate = new Date(to);

                    // Calculate the difference in days
                    const timeDiff = toDate - fromDate;
                    const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                    // Validate date range (should not exceed 20 days)
                    if (dayDiff > 20) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range should not exceed 20 days."
                        });
                    }
                    const getSalonServedReport = await getDailySalonServedReportByDateRange(salonId, from, to);

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

                    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("month");
                    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("month");
                
                    // Calculate the total number of months in the range
                    const totalMonths = endDate.diff(startDate, "months") + 1; // +1 to include the last month
                
                    // If the range exceeds 24 months, return an error response
                    if (totalMonths > 24) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range exceeds the allowed limit of 24 months. Please select a shorter range."
                        });
                    }
                    const getSalonServedReport = await getMonthlySalonServedReportByDateRange(salonId, from, to);

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

                    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                    // Calculate the number of weeks in the range
                    const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                    // If the range exceeds 20 weeks, return an error response
                    if (totalWeeks > 20) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range exceeds the allowed limit of 20 weeks. Please select a shorter range."
                        });
                    }

                    const getSalonServedReport = await getWeeklySalonServedReportByDateRange(salonId, from, to);

                    return res.status(200).json({
                        success: true,
                        message: "Report retrieved successfully.",
                        response: getSalonServedReport.map(item => {
                            // Format the week range (e.g., "Jan 1 - Jan 7")
                            const weekStart = moment(item.weekStart).format("MMM D");
                            const weekEnd = moment(item.weekEnd).format("MMM D");

                            return {
                                week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                TotalQueue: item.totalQueue
                            };
                        })
                    });
                }

            }
            else {
                if (reportType === "daily") {
                    const getSalonCancelledReport = await getDailySalonCancelledReportByDateRange(salonId, from, to);

                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonCancelledReport.map(item => ({
                            date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                            TotalQueue: item.totalQueue
                        }))
                    });

                }
                if (reportType === "monthly") {

                    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("month");
                    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("month");
                
                    // Calculate the total number of months in the range
                    const totalMonths = endDate.diff(startDate, "months") + 1; // +1 to include the last month
                
                    // If the range exceeds 24 months, return an error response
                    if (totalMonths > 24) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range exceeds the allowed limit of 24 months. Please select a shorter range."
                        });
                    }
                    const getSalonCancelledReport = await getMonthlySalonCancelledReportByDateRange(salonId, from, to);

                    // Log the entire report data to inspect its structure and values                
                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonCancelledReport.map(item => {
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

                    const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                    const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                    // Calculate the number of weeks in the range
                    const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                    // If the range exceeds 20 weeks, return an error response
                    if (totalWeeks > 20) {
                        return res.status(400).json({
                            success: false,
                            message: "Date range exceeds the allowed limit of 20 weeks. Please select a shorter range."
                        });
                    }

                    const getSalonCancelledReport = await getWeeklySalonCancelledReportByDateRange(salonId, from, to);

                    return res.status(200).json({
                        success: true,
                        message: "Report retrieved successfully.",
                        response: getSalonCancelledReport.map(item => {
                            // Format the week range (e.g., "Jan 1 - Jan 7")
                            const weekStart = moment(item.weekStart).format("MMM D");
                            const weekEnd = moment(item.weekEnd).format("MMM D");

                            return {
                                week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                TotalQueue: item.totalQueue
                            };
                        })
                    });
                }

            }
        }

        else if (barberEmail) {
            if (reportValue === "queueserved") {

                if (reportType === "daily") {
                    const getSalonServedReport = await getDailyBarberServedReport(salonId, barberEmail, days);

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
                    const getSalonServedReport = await getMonthlyBarberServedReport(salonId, barberEmail, month);

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

                    const getSalonServedReport = await getWeeklyBarberServedReport(salonId, barberEmail, week);

                    return res.status(200).json({
                        success: true,
                        message: "Report retrieved successfully.",
                        response: getSalonServedReport.map(item => {
                            // Format the week range (e.g., "Jan 1 - Jan 7")
                            const weekStart = moment(item.weekStart).format("MMM D");
                            const weekEnd = moment(item.weekEnd).format("MMM D");

                            return {
                                week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                TotalQueue: item.totalQueue
                            };
                        })
                    });
                }
            }
        }

        else if (barberId) {
            if (reportType === "daily") {
                const getSalonCancelledReport = await getDailyBarberCancelledReport(salonId, barberId, days);

                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonCancelledReport.map(item => ({
                        date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                        TotalQueue: item.totalQueue
                    }))
                });

            }
            if (reportType === "monthly") {
                const getSalonCancelledReport = await getMonthlyBarberCancelledReport(salonId, barberId, month);

                console.log(getSalonCancelledReport)
                // Log the entire report data to inspect its structure and values                
                return res.status(200).json({
                    success: true,
                    message: 'Report retrieved successfully.',
                    response: getSalonCancelledReport.map(item => {
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

                const getSalonCancelledReport = await getWeeklyBarberCancelledReport(salonId, barberId, week);

                return res.status(200).json({
                    success: true,
                    message: "Report retrieved successfully.",
                    response: getSalonCancelledReport.map(item => {
                        // Format the week range (e.g., "Jan 1 - Jan 7")
                        const weekStart = moment(item.weekStart).format("MMM D");
                        const weekEnd = moment(item.weekEnd).format("MMM D");

                        return {
                            week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                            TotalQueue: item.totalQueue
                        };
                    })
                });
            }
        }
        else {
            if (reportValue === "queueserved") {
                if (reportType === "daily") {
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
                            // Format the week range (e.g., "Jan 1 - Jan 7")
                            const weekStart = moment(item.weekStart).format("MMM D");
                            const weekEnd = moment(item.weekEnd).format("MMM D");

                            return {
                                week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                TotalQueue: item.totalQueue
                            };
                        })
                    });
                }

            }
            else {
                if (reportType === "daily") {
                    const getSalonCancelledReport = await getDailySalonCancelledReport(salonId, days);

                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonCancelledReport.map(item => ({
                            date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                            TotalQueue: item.totalQueue
                        }))
                    });

                }
                if (reportType === "monthly") {
                    const getSalonCancelledReport = await getMonthlySalonCancelledReport(salonId, month);

                    // Log the entire report data to inspect its structure and values                
                    return res.status(200).json({
                        success: true,
                        message: 'Report retrieved successfully.',
                        response: getSalonCancelledReport.map(item => {
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

                    const getSalonCancelledReport = await getWeeklySalonCancelledReport(salonId, week);

                    return res.status(200).json({
                        success: true,
                        message: "Report retrieved successfully.",
                        response: getSalonCancelledReport.map(item => {
                            // Format the week range (e.g., "Jan 1 - Jan 7")
                            const weekStart = moment(item.weekStart).format("MMM D");
                            const weekEnd = moment(item.weekEnd).format("MMM D");

                            return {
                                week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                TotalQueue: item.totalQueue
                            };
                        })
                    });
                }
            }
        }

    } catch (error) {
        next(error);
    }
}

export const dashboardReports = async (req, res, next) => {
    try {

        const { salonId, reportType } = req.body;

        const getSalonQueueReport = await getTotalSalonQlist(salonId, reportType);

        if (reportType === "daily") {
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

        if (reportType === "monthly") {
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
export const salonCancelledReport = async (req, res, next) => {
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