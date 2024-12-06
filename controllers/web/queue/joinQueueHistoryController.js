import { BARBER_NOT_EXIST_ERROR } from "../../../constants/web/BarberConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { BARBER_QUEUE_HISTORY_SUCCESS, SALON_QUEUE_HISTORY_SUCCESS } from "../../../constants/web/QueueConstants.js";
import { SALONID_EMPTY_ERROR } from "../../../constants/web/SalonConstants.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { getQueueHistoryByBarber, getSalonQueueHistory } from "../../../services/web/queue/joinQueueHistoryService.js";

export const getBarberQueueHitory = async(req, res, next) => {
    try{
        const {salonId, barberId} = req.body;

        if(!salonId) {
            return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)

        }

        if(!barberId){
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)

        }

        const queuehistory = await getQueueHistoryByBarber(salonId, barberId);

        return SuccessHandler(BARBER_QUEUE_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: queuehistory })


    }    catch (error) {
        next(error);
    }
}

export const getSalonQueueHistoryBySalonId = async(req, res, next) => {
    try{
        const { salonId } = req.body;

        if(!salonId) {
            return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    
    }
    
    const salonQueueHistory = await getSalonQueueHistory(salonId)

    return SuccessHandler(SALON_QUEUE_HISTORY_SUCCESS, SUCCESS_STATUS_CODE, res, { response: salonQueueHistory })

    }
    catch (error) {
        next(error);
    }
   
}
