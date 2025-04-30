import { BARBER_NOT_EXIST_ERROR } from "../../../constants/web/BarberConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { BARBER_QUEUE_HISTORY_SUCCESS, QUEUEHISTORY_MAX_DAYS, QUEUELIST_RANGE_ERROR, SALON_QUEUE_HISTORY_SUCCESS } from "../../../constants/web/QueueConstants.js";
import { SALONID_EMPTY_ERROR } from "../../../constants/web/SalonConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getQueueHistoryByBarber, getQueueHistoryByBarberIdToAndFrom, getQueueHistoryByCustomerEmail, getSalonQueueHistory } from "../../../services/web/queue/joinQueueHistoryService.js";

export const getBarberQueueHitory = async (req, res, next) => {
    try {
        const { salonId, barberId, from, to } = req.body;

        if (!salonId) {
            return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)

        }

        if (!barberId) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)

        }

        //          // Calculate default from/to dates if not provided
        //  const now = new Date(); // ✅ define now first
        //  const toDate = to ? new Date(to) : new Date(now.setHours(0, 0, 0, 0) - 1);;
        //  const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));


        // // Validate date range
        // const diffInMs = toDate - fromDate;
        // const diffInDays = diffInMs / (1000 * 60 * 60 * 24); // convert ms to days

        // if(to && from){
        //     if (diffInDays > QUEUEHISTORY_MAX_DAYS) {
        //         return ErrorHandler(QUEUELIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
        //     }
        // }

        const queuehistory = await getQueueHistoryByBarber(salonId, barberId);

        queuehistory.sort((a, b) => new Date(b.dateJoinedQ) - new Date(a.dateJoinedQ));

        return SuccessHandler(BARBER_QUEUE_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: queuehistory })


    } catch (error) {
        next(error);
    }
}

export const getSalonQueueHistoryBySalonId = async (req, res, next) => {
    try {
        const { salonId, from, to, customerEmail, barberId } = req.body;

        if (!salonId) {
            return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)

        }
        
        if(customerEmail){
            // Calculate default from/to dates if not provided
            const now = new Date(); // ✅ define now first
            const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
            const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

            // Helper function to calculate total days (inclusive)
            function getTotalDays(startDate, endDate) {
                const utc1 = Date.UTC(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate()
                );
                const utc2 = Date.UTC(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate()
                );

                return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
            }

            const totalDays = getTotalDays(fromDate, toDate);

            if (to && from) {
                if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                    return ErrorHandler(QUEUELIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
                }
            }

            const salonQueueHistory = await getQueueHistoryByCustomerEmail(salonId, customerEmail, fromDate, toDate)

            salonQueueHistory.sort((a, b) => new Date(b.dateJoinedQ) - new Date(a.dateJoinedQ));

            return SuccessHandler(SALON_QUEUE_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonQueueHistory })
        }

        if (barberId) {
            // Calculate default from/to dates if not provided
            const now = new Date(); // ✅ define now first
            const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
            const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

            // Helper function to calculate total days (inclusive)
            function getTotalDays(startDate, endDate) {
                const utc1 = Date.UTC(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate()
                );
                const utc2 = Date.UTC(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate()
                );

                return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
            }

            const totalDays = getTotalDays(fromDate, toDate);

            if (to && from) {
                if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                    return ErrorHandler(QUEUELIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
                }
            }

            const salonQueueHistory = await getQueueHistoryByBarberIdToAndFrom(salonId, barberId, fromDate, toDate)

            salonQueueHistory.sort((a, b) => new Date(b.dateJoinedQ) - new Date(a.dateJoinedQ));

            return SuccessHandler(SALON_QUEUE_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonQueueHistory })

        }

        // Calculate default from/to dates if not provided
        const now = new Date(); // ✅ define now first
        const toDate = to ? new Date(to) : new Date(now.setHours(23, 59, 59, 999));
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

        // Helper function to calculate total days (inclusive)
        function getTotalDays(startDate, endDate) {
            const utc1 = Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
            );
            const utc2 = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
            );

            return (utc2 - utc1) / (1000 * 60 * 60 * 24) + 1;
        }

        const totalDays = getTotalDays(fromDate, toDate);

        if (to && from) {
            if (totalDays > QUEUEHISTORY_MAX_DAYS) {
                return ErrorHandler(QUEUELIST_RANGE_ERROR, ERROR_STATUS_CODE, res);
            }
        }

        // if(range thake){

        // if(barberId){
            // return queuehistory of that barberID send korchi of range to - from 
        // }

        // return queuehistory mixup send korchi of range to - from   

        // }else {
        // Jokhn kono range nai 

        // if(barberId){
        // return queuehistory of that barberID send korchi of default last 30 days
        // }

        // return queuehistory mixup send korchi of default last 30 days

        // }

        const salonQueueHistory = await getSalonQueueHistory(salonId, fromDate, toDate)

        salonQueueHistory.sort((a, b) => new Date(b.dateJoinedQ) - new Date(a.dateJoinedQ));

        return SuccessHandler(SALON_QUEUE_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonQueueHistory })

    }
    catch (error) {
        next(error);
    }

}
