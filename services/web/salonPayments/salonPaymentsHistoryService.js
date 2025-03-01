import SalonPaymentsHistory from "../../../models/salonPaymentsHistoryModel.js"

export const getSalonPaymentHistoryBySalonId = async(salonId) => {
    const getSalonPaymentHistory = await SalonPaymentsHistory.findOne({salonId})

    return getSalonPaymentHistory
}