import Barber from "../../models/barberRegisterModel";

export const findBarberByEmailIsVerifiedAndRole = async (email) => {
   const barber = await Barber.findOne({ email, role: 'Barber', emailVerified: true }).exec()
   return barber;
}


export const findBarberByMobileIsVerifiedAndRole = async (mobileCountryCode, mobileNumber) => {
   const barber = await Barber.findOne({ mobileCountryCode, mobileNumber, role: 'Barber', mobileVerified: true }).exec()
   return barber;
}