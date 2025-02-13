import { BARBER_BREAKTIME_SUCCESS } from "../../../constants/web/BarberConstants.js";
import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { addBarberBreakTimes } from "../../../services/web/barberBreakTimes/barberBreakTimesService.js";

export const updateBarberBreakTime = async(req, res, next) =>{
    try{
        const {salonId, barberId, day, times} = req.body;

        const getBarberbreakTimesBySalonId = await addBarberBreakTimes(salonId, barberId, day, times)

        return SuccessHandler(BARBER_BREAKTIME_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getBarberbreakTimesBySalonId })

    }
    catch (error) {
        next(error);
    }
}