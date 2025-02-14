import { BARBER_RESERVATION_SUCCESS } from "../../../constants/web/BarberConstants.js";
import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { addBarberReservations } from "../../../services/web/barberReservations/barberReservationsService.js";

export const updateBarberReservations = async (req, res, next) => {
    try {
        const { salonId, barberId, date, startTime, endTime } = req.body;

        const addBarberReservation = await addBarberReservations(salonId, barberId, date, startTime, endTime)

        return SuccessHandler(BARBER_RESERVATION_SUCCESS, SUCCESS_STATUS_CODE, res, { response: addBarberReservation })

    }
    catch (error) {
        next(error);
    }
}