import { getSalonPaymentHistoryBySalonId } from "../../../services/web/salonPayments/salonPaymentsHistoryService.js";

export const paymentHistories = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        const salonPaymentHistory = await getSalonPaymentHistoryBySalonId(salonId);

        if (!salonPaymentHistory) {
            return res.status(400).json({success: false, response: "No payment history found for this salon" });
        }

        res.status(200).json({ success: true, response: salonPaymentHistory });
    } catch (error) {
        next(error);
    }
};