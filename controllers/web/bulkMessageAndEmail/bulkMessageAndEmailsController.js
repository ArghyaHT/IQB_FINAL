import { bulkEmail } from "../../../utils/emailSender/emailSender.js";
import { sendSmsLogic } from "../../../utils/mobileMessageSender/mobileMessageSender.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js"
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { EMAIL_SEND_SUCCESS, MESSAGE_NOT_PRESENT_ERROR, RECEP_EMAIL_ARRAY_ERROR, RECEP_EMAIL_NOT_PRESENT_ERROR, RECEP_NUM_ARRAY_ERROR, RECEP_NUM_NOT_PRESENT_ERROR, SMS_SEND_SUCCESS, SUBJECT_NOT_PRESENT_ERROR } from "../../../constants/web/BulkMessageAndEmailConstants.js";

export const sendBulkTextMessages = async (req, res, next) => {
  try {
    const { numbers, smsBody } = req.body;

    if (!smsBody) {
      return ErrorHandler(MESSAGE_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    if (numbers.length === 0) {
      return ErrorHandler(RECEP_NUM_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!Array.isArray(numbers)) {
      return ErrorHandler(RECEP_NUM_ARRAY_ERROR, ERROR_STATUS_CODE, res)
    }

    // Convert each number to string and add a + sign before each number
    const formattedNumbers = numbers.map(number => `+${String(number)}`);


    // Iterate over each mobile number and send SMS
    for (const number of formattedNumbers) {
      await sendSmsLogic(smsBody, number);
    }

    return SuccessHandler(SMS_SEND_SUCCESS, SUCCESS_STATUS_CODE, res)
  }
  catch (error) {
    next(error);
  }
}

//DESC: SEND BULK MAIL TO ================
export const sendBulkEmails = async (req, res, next) => {
  try {
    const { subject, message, role, recipientEmails } = req.body;

    if (!subject) {
      return ErrorHandler(SUBJECT_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!message) {
      return ErrorHandler(MESSAGE_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    if (recipientEmails.length === 0) {
      return ErrorHandler(RECEP_EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!Array.isArray(recipientEmails)) {
      return ErrorHandler(RECEP_EMAIL_ARRAY_ERROR, ERROR_STATUS_CODE, res)
    }

    // Call your bulk email function here passing subject, message, and recipientEmails
    await bulkEmail(subject, message, recipientEmails);

    if (role === "Barber") {
      return SuccessHandler(EMAIL_SEND_SUCCESS, SUCCESS_STATUS_CODE, res)
    }
    else {
      return SuccessHandler(EMAIL_SEND_SUCCESS, SUCCESS_STATUS_CODE, res)
    }

  } catch (error) {
    next(error);
  }
};