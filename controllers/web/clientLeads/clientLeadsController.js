import { CLIENT_SAVE_SUCCESS } from "../../../constants/web/ClientLeadsConstant.js";
import { SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { clientLeadsData } from "../../../services/web/clientLeads/clientLeadsService.js";
import { sendContactFormEmail } from "../../../utils/emailSender/emailSender.js";

export const clientLeads = async(req, res, next) => {
    try{
        const { name, email, mobileCountryCode, mobileNumber, message } = req.body;

        await sendContactFormEmail(name, email, mobileCountryCode, mobileNumber, message);


        const newClient = await clientLeadsData(name, email, mobileCountryCode, mobileNumber, message);

        return SuccessHandler(CLIENT_SAVE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: newClient })


    }catch (error) {
        next(error);
    }
}