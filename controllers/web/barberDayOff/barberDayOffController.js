import { createBarberDayOff } from "../../../services/web/barberDayOff/barberDayOffService.js"

export const barberDayOff = async(req, res, next) => {
    try{
        const {salonId, barberId, date, reason} = req.body
        if(!date){
            res.status(400).json({
                success: false,
                message: "Date not present"
            })
        }

        if(!reason){
            res.status(400).json({
                success: false,
                message: "Reason not present"
            })
        }

        const barberDayoffRequest = await createBarberDayOff(salonId, barberId, date, reason)

        if(barberDayoffRequest){
            res.status(200).json({
                success: false,
                message: "Your day off request has been sent for approval"
            })
        }

    }
    catch (error) {
        next(error);
    }
}

// export const barberDayOffApprovalByAdmin = async(req, res, next) => {
//     try{

//         const {salonId, barberId} = req.body;

//         const barberDayoffApproved = await 


//     }  
//     catch (error) {
//         next(error);
//     }
// }