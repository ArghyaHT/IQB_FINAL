import moment from "moment";
import { getDailyBarberCancelledReport, getServedQueueCount, getDailyBarberCancelledReportByDateRange, getDailyBarberServedReport, getDailyBarberServedReportByDateRange, getDailySalonCancelledReport, getDailySalonCancelledReportByDateRange, getDailySalonServedReport, getDailySalonServedReportByDateRange, getMonthlyBarberCancelledReport, getMonthlyBarberCancelledReportByDateRange, getMonthlyBarberServedReport, getMonthlyBarberServedReportByDateRange, getMonthlySalonCancelledReport, getMonthlySalonCancelledReportByDateRange, getMonthlySalonServedReport, getMonthlySalonServedReportByDateRange, getTotalSalonQlist, getWeeklyBarberCancelledReport, getWeeklyBarberCancelledReportByDateRange, getWeeklyBarberServedReport, getWeeklyBarberServedReportByDateRange, getWeeklySalonCancelledReport, getWeeklySalonCancelledReportByDateRange, getWeeklySalonServedReport, getWeeklySalonServedReportByDateRange, totalQueueCountsForLast30Days, totalQueueCountsForLast60Days, getTotalQueueCount, getlast6weeksQueueCount } from "../../../services/web/queue/joinQueueHistoryService.js";
import { getAppointmentCountForLast2Week, getAppointmentCountForLastWeek, getDailyBarberAppointmentCancelledReport, getDailyBarberAppointmentCancelledReportByDateRange, getDailyBarberAppointmentServedReport, getDailyBarberServedAppointmentReportByDateRange, getDailySalonAppointmentCancelledReport, getDailySalonAppointmentCancelledReportByDateRange, getDailySalonAppointmentServedReport, getDailySalonAppointmentServedReportByDateRange, getLastWeekAppointmentCountsEachDay, getMonthlyBarberAppointmentCancelledReport, getMonthlyBarberAppointmentCancelledReportByDateRange, getMonthlyBarberAppointmentServedReport, getMonthlyBarberAppointmentServedReportByDateRange, getMonthlySalonAppointmentCancelledReport, getMonthlySalonAppointmentCancelledReportByDateRange, getMonthlySalonAppointmentServedReport, getMonthlySalonAppointmentServedReportByDateRange, getServedAppointmentCount, getTotalAppointmentCount, getWeeklyBarberAppointmentCancelledReport, getWeeklyBarberAppointmentCancelledReportByDateRange, getWeeklyBarberAppointmentServedReport, getWeeklyBarberServedAppointmentReportByDateRange, getWeeklySalonAppointmentCancelledReport, getWeeklySalonAppointmentCancelledReportByDateRange, getWeeklySalonAppointmentServedReport, getWeeklySalonAppointmentServedReportByDateRange } from "../../../services/web/appointments/appointmentHistoryService.js";


export const salonServedReport = async (req, res, next) => {
    try {
        const { salonId, from, to, days, barberId, barberEmail, month, week, reportType, reportValue } = req.body;


        if (!salonId || !reportType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: salonId, from, to, or reportType',
            });
        }

        if (!["daily", "weekly", "monthly", "range"].includes(reportType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reportType. Allowed values: 'daily', 'weekly', 'monthly', 'range'."
            });
        }


        if (from && to) {
            if (barberEmail) {
                if (reportValue === "queueserved") {

                    if (reportType === "range") {

                        // Convert 'from' and 'to' to Date objects
                        const fromDate = new Date(from);
                        const toDate = new Date(to);

                        // Calculate the difference in days
                        const timeDiff = toDate - fromDate;
                        const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                        // Validate date range (should not exceed 20 days)
                        if (dayDiff < 20) {
                            const getSalonServedReport = await getDailyBarberServedReportByDateRange(salonId, barberEmail, from, to);

                            return res.status(200).json({
                                success: true,
                                message: 'Report retrieved successfully.',
                                response: getSalonServedReport.map(item => ({
                                    range: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                                    TotalQueue: item.totalQueue
                                }))
                            });
                        }
                        else {
                            const today = new Date();
                            today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00

                            const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                            const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                            // Calculate the number of weeks in the range
                            const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                            if (totalWeeks < 20) {
                                const getSalonServedReport = await getWeeklyBarberServedReportByDateRange(salonId, barberEmail, from, to);

                                return res.status(200).json({
                                    success: true,
                                    message: "Report retrieved successfully.",
                                    response: getSalonServedReport.map(item => {
                                        // Format the week range (e.g., "Jan 1 - Jan 7")
                                        const weekStart = moment(item.weekStart).format("MMM D");
                                        const weekEnd = moment(item.weekEnd).format("MMM D");

                                        return {
                                            range: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                            TotalQueue: item.totalQueue
                                        };
                                    })
                                });
                            }
                            else {
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
                                            range: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                                            TotalQueue: item.count // Use item.count instead of item.totalQueue
                                        };
                                    })
                                });
                            }
                        }
                    }
                }
            }

            if (barberId) {
                if (reportType === "range") {

                    // Convert 'from' and 'to' to Date objects
                    const fromDate = new Date(from);
                    const toDate = new Date(to);

                    // Calculate the difference in days
                    const timeDiff = toDate - fromDate;
                    const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                    if (dayDiff < 20) {
                        const getSalonCancelledReport = await getDailyBarberCancelledReportByDateRange(salonId, barberId, from, to);

                        return res.status(200).json({
                            success: true,
                            message: 'Report retrieved successfully.',
                            response: getSalonCancelledReport.map(item => ({
                                range: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                                TotalQueue: item.totalQueue
                            }))
                        });
                    }
                    else {
                        const today = new Date();
                        today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00

                        const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                        const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                        // Calculate the number of weeks in the range
                        const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                        if (totalWeeks < 20) {
                            const getSalonCancelledReport = await getWeeklyBarberCancelledReportByDateRange(salonId, barberId, from, to);

                            return res.status(200).json({
                                success: true,
                                message: "Report retrieved successfully.",
                                response: getSalonCancelledReport.map(item => {
                                    // Format the week range (e.g., "Jan 1 - Jan 7")
                                    const weekStart = moment(item.weekStart).format("MMM D");
                                    const weekEnd = moment(item.weekEnd).format("MMM D");

                                    return {
                                        range: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                        TotalQueue: item.totalQueue
                                    };
                                })
                            });
                        }

                        else {

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
                                        range: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                                        TotalQueue: item.count // Use item.count instead of item.totalQueue
                                    };
                                })
                            });
                        }
                    }


                }
            }

            if (reportValue === "queueserved") {

                if (reportType === "range") {
                    // Convert 'from' and 'to' to Date objects
                    const fromDate = new Date(from);
                    const toDate = new Date(to);

                    // Calculate the difference in days
                    const timeDiff = toDate - fromDate;
                    const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                    if (dayDiff < 20) {
                        const getSalonServedReport = await getDailySalonServedReportByDateRange(salonId, from, to);

                        return res.status(200).json({
                            success: true,
                            message: 'Report retrieved successfully.',
                            response: getSalonServedReport.map(item => ({
                                range: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                                TotalQueue: item.totalQueue
                            }))
                        });
                    }
                    else {
                        const today = new Date();
                        today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00

                        const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                        const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                        // Calculate the number of weeks in the range
                        const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                        if (totalWeeks < 20) {
                            const getSalonServedReport = await getWeeklySalonServedReportByDateRange(salonId, from, to);

                            return res.status(200).json({
                                success: true,
                                message: "Report retrieved successfully.",
                                response: getSalonServedReport.map(item => {
                                    // Format the week range (e.g., "Jan 1 - Jan 7")
                                    const weekStart = moment(item.weekStart).format("MMM D");
                                    const weekEnd = moment(item.weekEnd).format("MMM D");

                                    return {
                                        range: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                        TotalQueue: item.totalQueue
                                    };
                                })
                            });
                        }
                        else {
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
                                        range: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                                        TotalQueue: item.count // Use item.count instead of item.totalQueue
                                    };
                                })
                            });
                        }
                    }
                }

            }
            else {
                if (reportType === "range") {

                    // Convert 'from' and 'to' to Date objects
                    const fromDate = new Date(from);
                    const toDate = new Date(to);

                    // Calculate the difference in days
                    const timeDiff = toDate - fromDate;
                    const dayDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                    if (dayDiff < 20) {
                        const getSalonCancelledReport = await getDailySalonCancelledReportByDateRange(salonId, from, to);

                        return res.status(200).json({
                            success: true,
                            message: 'Report retrieved successfully.',
                            response: getSalonCancelledReport.map(item => ({
                                range: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                                TotalQueue: item.totalQueue
                            }))
                        });
                    }

                    else {
                        const today = new Date();
                        today.setUTCHours(0, 0, 0, 0); // Ensure today's time is 00:00

                        const startDate = moment.utc(from, "YYYY-MM-DD").startOf("day");
                        const endDate = moment.utc(to, "YYYY-MM-DD").endOf("day");

                        // Calculate the number of weeks in the range
                        const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);

                        if (totalWeeks < 20) {
                            const getSalonCancelledReport = await getWeeklySalonCancelledReportByDateRange(salonId, from, to);

                            return res.status(200).json({
                                success: true,
                                message: "Report retrieved successfully.",
                                response: getSalonCancelledReport.map(item => {
                                    // Format the week range (e.g., "Jan 1 - Jan 7")
                                    const weekStart = moment(item.weekStart).format("MMM D");
                                    const weekEnd = moment(item.weekEnd).format("MMM D");

                                    return {
                                        range: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                                        TotalQueue: item.totalQueue
                                    };
                                })
                            });
                        }
                        else {

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
                                        range: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }), // Format to "Jan 2025"
                                        TotalQueue: item.count // Use item.count instead of item.totalQueue
                                    };
                                })
                            });
                        }
                    }
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

export const salonAppointmentReport = async (req, res, next) => {
    try {
        const { salonId, from, to, days, barberId, month, week, reportType, reportValue } = req.body;


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
            if (barberId) {
                if (reportValue === "appointmentserved") {
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
                        const getSalonServedReport = await getDailyBarberServedAppointmentReportByDateRange(salonId, barberId, from, to);

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
                        const getSalonServedReport = await getMonthlyBarberAppointmentServedReportByDateRange(salonId, barberId, from, to);

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

                        const getSalonServedReport = await getWeeklyBarberServedAppointmentReportByDateRange(salonId, barberId, from, to);

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

                        const getSalonCancelledReport = await getDailyBarberAppointmentCancelledReportByDateRange(salonId, barberId, from, to);

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
                        const getSalonCancelledReport = await getMonthlyBarberAppointmentCancelledReportByDateRange(salonId, barberId, from, to);

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

                        const getSalonCancelledReport = await getWeeklyBarberAppointmentCancelledReportByDateRange(salonId, barberId, from, to);

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

            if (reportValue === "appointmentserved") {
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
                    const getSalonServedReport = await getDailySalonAppointmentServedReportByDateRange(salonId, from, to);

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
                    const getSalonServedReport = await getMonthlySalonAppointmentServedReportByDateRange(salonId, from, to);

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

                    const getSalonServedReport = await getWeeklySalonAppointmentServedReportByDateRange(salonId, from, to);

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
                    const getSalonCancelledReport = await getDailySalonAppointmentCancelledReportByDateRange(salonId, from, to);

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
                    const getSalonCancelledReport = await getMonthlySalonAppointmentCancelledReportByDateRange(salonId, from, to);

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

                    const getSalonCancelledReport = await getWeeklySalonAppointmentCancelledReportByDateRange(salonId, from, to);

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
        else if (barberId) {
            if (reportValue === "appointmentserved") {
                if (reportType === "daily") {
                    const getSalonServedReport = await getDailyBarberAppointmentServedReport(salonId, barberId, days);

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
                    const getSalonServedReport = await getMonthlyBarberAppointmentServedReport(salonId, barberId, month);

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

                    const getSalonServedReport = await getWeeklyBarberAppointmentServedReport(salonId, barberId, week);

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
                    const getSalonCancelledReport = await getDailyBarberAppointmentCancelledReport(salonId, barberId, days);

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
                    const getSalonCancelledReport = await getMonthlyBarberAppointmentCancelledReport(salonId, barberId, month);

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

                    const getSalonCancelledReport = await getWeeklyBarberAppointmentCancelledReport(salonId, barberId, week);

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
        else {
            if (reportValue === "appointmentserved") {
                if (reportType === "daily") {
                    const getSalonServedReport = await getDailySalonAppointmentServedReport(salonId, days);

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
                    const getSalonServedReport = await getMonthlySalonAppointmentServedReport(salonId, month);

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

                    const getSalonServedReport = await getWeeklySalonAppointmentServedReport(salonId, week);

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
                    const getSalonCancelledReport = await getDailySalonAppointmentCancelledReport(salonId, days);

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
                    const getSalonCancelledReport = await getMonthlySalonAppointmentCancelledReport(salonId, month);

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

                    const getSalonCancelledReport = await getWeeklySalonAppointmentCancelledReport(salonId, week);

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


export const queueTrend = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        // Fetch counts
        const totalqueue30Days = await totalQueueCountsForLast30Days(salonId);
        const totalqueue60Days = await totalQueueCountsForLast60Days(salonId);

        console.log("Last 30 days:", totalqueue30Days.totalCount);
        console.log("Last 60 days:", totalqueue60Days.totalCount);

        // Extract counts
        const last30DaysCount = totalqueue30Days.totalCount;
        const prev30DaysCount = totalqueue60Days.totalCount - last30DaysCount; // Previous 30 days

        let percentageChange = 0;
        let trend = "No Change";

        if (prev30DaysCount > 0) {
            percentageChange = ((last30DaysCount - prev30DaysCount) / prev30DaysCount) * 100;
            trend = percentageChange > 0 ? "Rise" : "Fall";
        } else if (last30DaysCount > 0) {
            percentageChange = 100; // If there were no queues in the previous 30 days, but now there are
            trend = "Rise";
        }

        res.json({
            last30DaysCount,
            prev30DaysCount,
            percentageChange: `${percentageChange.toFixed(2)}%`,
            trend
        });

    } catch (error) {
        next(error);
    }
};


export const newdashboardReports = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        // **Queue Dashboard Logic**
        const totalqueue30Days = await totalQueueCountsForLast30Days(salonId);
        const totalqueue60Days = await totalQueueCountsForLast60Days(salonId);

        const totalQueueCount = await getTotalQueueCount(salonId);
        const servedQueueCount = await getServedQueueCount(salonId);
        const cancelledQueueCount = totalQueueCount - servedQueueCount;

        // Calculate percentages
        const servedPercentage = totalQueueCount > 0 ? ((servedQueueCount / totalQueueCount) * 100).toFixed(2) : "0.00";
        const cancelledPercentage = totalQueueCount > 0 ? ((cancelledQueueCount / totalQueueCount) * 100).toFixed(2) : "0.00";

        // Extract counts
        const last30DaysCount = totalqueue30Days.totalCount;
        const prev30DaysCount = totalqueue60Days.totalCount - last30DaysCount; // Previous 30 days count

        let percentageChange = 0;
        let trend = "No Change";

        if (prev30DaysCount > 0) {
            percentageChange = ((last30DaysCount - prev30DaysCount) / prev30DaysCount) * 100;
            trend = percentageChange > 0 ? "Rise" : percentageChange < 0 ? "Fall" : "No Change";
        } else if (last30DaysCount > 0) {
            percentageChange = 100; // If there were no queues in the previous 30 days, but now there are
            trend = "Rise";
        }

        const last6weeksQueueCount = await getlast6weeksQueueCount(salonId)


        // **Appointment Dashboard Logic**
        const totalAppointmentCount = await getTotalAppointmentCount(salonId);
        const servedAppointmentCount = await getServedAppointmentCount(salonId);
        const cancelledAppointmentCount = totalAppointmentCount - servedAppointmentCount;

        const getlastWeekAppointmentCount = await getAppointmentCountForLastWeek(salonId);
        const getlast2WeeksAppointmentCount = await getAppointmentCountForLast2Week(salonId);

        // Calculate Appointment Percentage Change
        const previousWeekCount = getlast2WeeksAppointmentCount - getlastWeekAppointmentCount;
        let appointmentPercentageChange = 0;
        let appointmentTrend = "No Change";

        if (previousWeekCount > 0) {
            appointmentPercentageChange = ((getlastWeekAppointmentCount - previousWeekCount) / previousWeekCount) * 100;
        } else if (previousWeekCount === 0 && getlastWeekAppointmentCount > 0) {
            appointmentPercentageChange = 100; // 100% increase if no appointments in the previous week
        }

        appointmentTrend = appointmentPercentageChange > 0 ? "Rise" : appointmentPercentageChange < 0 ? "Fall" : "No Change";

        const last7daysCount = await getLastWeekAppointmentCountsEachDay(salonId);


        return res.status(200).json({
            success: true,
            response: {
                queue: {
                    totalQueueHistoryCount: totalQueueCount,
                    servedHistoryPercentage: Number(servedPercentage),
                    cancelledHistoryPercentage: Number(cancelledPercentage),
                    last30DaysCount,
                    prev30DaysCount,
                    percentageChangelast30Days: Number(Math.abs(percentageChange).toFixed(2)),
                    queueTrend: trend,
                    last6weeksQueueCount: last6weeksQueueCount.map(item => {
                        // Format the week range (e.g., "Jan 1 - Jan 7")
                        const weekStart = moment(item.weekStart).format("MMM D");
                        const weekEnd = moment(item.weekEnd).format("MMM D");

                        return {
                            week: `${weekStart} - ${weekEnd}`,  // Example: "Jan 1 - Jan 7"
                            TotalQueue: item.totalQueue
                        };
                    })
                },
                appointment: {
                    totalAppointmentHistoryCount: totalAppointmentCount,
                    servedAppointmenthistoryCount: servedAppointmentCount,
                    cancelledAppointmentHistoryCount: cancelledAppointmentCount,
                    lastWeekCount: getlastWeekAppointmentCount,
                    prevWeekCount: previousWeekCount,
                    percentageChangeLastWeek: Number(Math.abs(appointmentPercentageChange).toFixed(2)),
                    appointmentTrend,
                    last7daysCount: last7daysCount.map(item => ({
                        date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                        TotalAppoinment: item.count
                    })
                    )
                }
            }
        });
    } catch (error) {
        next(error);
    }
};





