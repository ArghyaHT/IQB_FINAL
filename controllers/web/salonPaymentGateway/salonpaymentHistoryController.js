import { getSalonPaymentHistoryBySalonId } from "../../../services/web/salonPayments/salonPaymentsHistoryService.js";

export const paymenthistories = async(req, res, next) => {
    try{
        const {salonId} = req.body;

        const salonPaymenthistory = await getSalonPaymentHistoryBySalonId(salonId)

        console.log(salonPaymenthistory)
        
    }
    catch (error) {
        next(error);
    }
}