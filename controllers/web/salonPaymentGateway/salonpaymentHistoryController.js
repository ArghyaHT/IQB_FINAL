import moment from "moment";
import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { SALON_PAYMENT_HISTORY_SUCCESS } from "../../../constants/web/SalonPaymentsConstants.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getSalonPaymentHistoryBySalonId } from "../../../services/web/salonPayments/salonPaymentsHistoryService.js";

export const paymentHistories = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        const salonPaymentHistory = await getSalonPaymentHistoryBySalonId(salonId);

        // Format the dates in the response
        const formattedHistory = salonPaymentHistory.map(payment => ({
            ...payment.toObject(), // Spread original fields
            purchaseDate: moment.unix(Number(payment.purchaseDate)).format("D MMM YYYY"), 
            paymentExpiryDate: moment.unix(Number(payment.paymentExpiryDate)).format("D MMM YYYY")
        }));

        return SuccessHandler(SALON_PAYMENT_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: formattedHistory });

    } catch (error) {
        next(error);
    }
};