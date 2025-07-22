import { EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, EMAIL_NOT_PRESENT_ERROR } from "../../constants/web/adminConstants"
import { ERROR_STATUS_CODE } from "../../constants/web/Common/StatusCodeConstant"
import { createBarber, createBarberId } from "../../services/web/barber/barberService";
import { sendVerificationCode } from "../../utils/emailSender/emailSender";
import { sendMobileVerificationCode } from "../../utils/mobileMessageSender/mobileMessageSender";

export const barberRegisterController = async (req, res, next) => {
    try {
        let { email, mobileCountryCode, phoneNumber, password } = req.body

        // if (!email && !password) {
        //     return ErrorHandler(EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        // }

        // if (!email) {
        //     return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        // }

        // if (!validateEmail(email)) {
        //     return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        // }

        if (!password) {
            return ErrorHandler(PASSWORD_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (password.length < 8) {
            return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        if (email) {
            const existingUser = await findBarberByEmailIsVerifiedAndRole(email)
            if (existingUser) {
                return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
            }

            const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

            try {
                await sendVerificationCode(email, user.name, verificationCode);
            } catch (error) {
                return ErrorHandler(VERIFICATION_EMAIL_ERROR, ERROR_STATUS_CODE, res)
            }
            const barberId = await createBarberId();

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await createBarber(email, hashedPassword, barberId, verificationCode)

            return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })
        }

        if (phoneNumber) {
            const existingUser = await findBarberByMobileIsVerifiedAndRole(mobileCountryCode, phoneNumber)
            if (existingUser) {
                return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
            }

            const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
            // Format the mobile number with the country code
            const formattedNumber = `+${mobileCountryCode}${String(mobileNumber)}`;

            try {
                await sendMobileVerificationCode(formattedNumber, verificationCode);
            } catch (error) {
                next(error);
            }
            const barberId = await createBarberId();

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await createBarber(email, hashedPassword, barberId, verificationCode)

            return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })
        }
    } catch (error) {
        next(error);
    }
}