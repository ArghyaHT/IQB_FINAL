import { getSalonCancelledQlist, getSalonServedQlist } from "../../../services/web/queue/joinQueueHistoryService.js";


//DESC:SALON SERVED REPORT ================
export const salonServedReport = async(req, res, next) => {
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

        const getSalonServedReport = await getSalonServedQlist(salonId, fromDate, toDate);

        return res.status(200).json({
            success: true,
            message: 'Report retrieved successfully.',
            response: getSalonServedReport,
        });

    } catch (error) {
        console.log(error);
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
        console.log(error);
        next(error);
    }
}