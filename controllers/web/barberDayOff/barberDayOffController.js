import { getBarberByBarberId } from "../../../services/web/barber/barberService.js"
import { createBarberDayOff } from "../../../services/web/barberDayOff/barberDayOffService.js"

export const barberDayOff = async (req, res, next) => {
    try {
        const { salonId, barberId, fromDate, toDate  } = req.body

        const barberDayoffRequest = await createBarberDayOff(salonId, barberId, fromDate, toDate )

        if (barberDayoffRequest) {
            res.status(200).json({
                success: false,
                message: "Your day off request has been recorded"
            })
        }
    }
    catch (error) {
        next(error);
    }
}

// export const getBarberDayOffRequests = async(req, res, next) => {

//     try{
//         const {salonId} = req.body;

//         const allBarberDayoffRequests = await getAllBarberDayoffRequests(salonId)
    
//         if(allBarberDayoffRequests){
//             res.status(200).json({
//                 success: false,
//                 message: "Day off approved successfully", 
//                 response:allBarberDayoffRequests
//             })
//         }
//     }
//     catch (error) {
//         next(error);
//     }
// }
