import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { SALON_PAYMENT_HISTORY_SUCCESS } from "../../../constants/web/SalonPaymentsConstants.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getSalonPaymentHistoryBySalonId } from "../../../services/web/salonPayments/salonPaymentsHistoryService.js";

export const paymentHistories = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        const salonPaymentHistory = await getSalonPaymentHistoryBySalonId(salonId);

        return SuccessHandler(SALON_PAYMENT_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonPaymentHistory })

    } catch (error) {
        next(error);
    }
};