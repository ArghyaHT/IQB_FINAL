import Admin from "../../../models/adminRegisterModel.js"

export const findAdminByEmailandRole = async(email) => {
    const admin = await Admin.findOne({ email, role: 'Admin'  }).exec()
    return admin;
}


export const connectAdminKiosk = async(email, salonId) => {
    const admin = await Admin.findOneAndUpdate({ email },
      { salonId: salonId}, { new: true });

   return admin;
  }

  export const findAdminByEmailandSalonId = async(email, salonId) => {
    const admin = await Admin.findOne({ email, salonId: salonId }).exec()
    return admin;
}


export const findGoogleAdminByEmailandSalonId = async(email, salonId) => {
  const admin = await Admin.findOne({ email, salonId: salonId, AuthType: "google" }).exec()
  return admin;
}