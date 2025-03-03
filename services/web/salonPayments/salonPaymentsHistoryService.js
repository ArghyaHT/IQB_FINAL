import SalonPaymentsHistory from "../../../models/salonPaymentsHistoryModel.js"

export const getSalonPaymentHistoryBySalonId = async (salonId) => {
    const salonPaymentHistory = await SalonPaymentsHistory.find({ salonId });

    return salonPaymentHistory;
};