import { getSalonCancelledQlist, getSalonServedQlist, getTotalSalonQlist } from "../../../services/web/queue/joinQueueHistoryService.js";


export const salonServedReport = async(req, res, next) => {
    try {
        const { salonId, from, to, reportType, reportValue } = req.body;

        if (!salonId || !from || !to || !reportType) {
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

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format for from or to date',
            });
        }

        if(reportValue === "queueserved"){
            const getSalonServedReport = await getSalonServedQlist(salonId, fromDate, toDate, reportType);

            return res.status(200).json({
                success: true,
                message: 'Report retrieved successfully.',
                response: getSalonServedReport,
            });
        }
        else{
            const getSalonCancelledReport = await getSalonCancelledQlist(salonId, fromDate, toDate, reportType);
            return res.status(200).json({
                success: true,
                message: 'Report retrieved successfully.',
                response: getSalonCancelledReport,
            });
        }   

    } catch (error) {
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


export const dashboardReports = async(req, res, next) => {

    try{

        const { salonId, reportType } = req.body;

        const getSalonQueueReport = await getTotalSalonQlist(salonId, reportType);
        return res.status(200).json({
            success: true,
            message: 'Report retrieved successfully.',
            response: getSalonQueueReport,
        });

    }

    catch (error) {
        next(error);
    }
}