import Admin from "../../../models/adminRegisterModel.js"


export const findAdminByEmailandRole = async (email) => {
   const admin = await Admin.findOne({ email, role: 'Admin' })
     .select('-vendorAccountDetails.vendorAccountId') // Exclude vendorAccountId
     .exec();
   return admin;
 };

 export const findAdminByEmailandRoleTest = async (email) => {
   const admin = await Admin.findOne({ email, role: 'Admin' })
     .exec();
   return admin;
 };

//SAVE ADMIN
export const createAdmin = async (email, hashedPassword) => {
   const user = new Admin({
      email,
      password: hashedPassword,
      role: "Admin",
   })
   await user.save();
   return user;
}

export const createGoogleAdmin = async (email) => {
   const user = new Admin({
      email: email,
      role: "Admin",
      AuthType: "google"
   })

   await user.save();

   return user;
}

export const resetPassword = async (resetPasswordToken) => {
   const user = await Admin.findOne({
      resetPasswordToken: resetPasswordToken, resetPasswordExpire: {
         $gt: Date.now()
      }
   }); // From here return two things one is user and other is token
   return user;
}

export const googleLoginAdmin = async (email) => {
   const user = await Admin.findOne({ email , role: 'Admin', AuthType: "google" });
   return user;
}

export const googleSignUpAdmin = async (name, email) => {
   const user = new Admin({
      name: name,
      email: email,
      admin: true,
      AuthType: "google"
   })
   await user.save();

   return user;
}

//Delete Admin
export const deleteAdmin = async (email) => {
   const admin = await Admin.findOneAndUpdate({ email }, { isDeleted: true }, { new: true });
   return admin;
}

//Update Admin Account Details
export const updateAdmin = async (name, gender, email, countryCode, mobileNumber, dateOfBirth, mobileVerified) => {
   let updateFields = {
      name,
      gender,
      dateOfBirth,
      mobileCountryCode: countryCode,
      mobileNumber,
      mobileVerified
   };

   const admin = await Admin.findOneAndUpdate({ email }, updateFields, { new: true }).select("-password");

   return admin;

};

//Update Admin Account Details
export const updateGoogleAdmin = async (name, gender, email, mobileNumber, hashedPassword, dateOfBirth) => {

   const admin = await Admin.findOneAndUpdate({ email }, 
      {
         name: name,
         gender: gender,
         mobileNumber: mobileNumber,
         password: hashedPassword,
         dateOfBirth: dateOfBirth
      },
      { new: true });

   return admin;

};

//Upload Admin ProfilePic
export const uploadAdminProPic = async (email, profileimg) => {
   const admin = await Admin.findOneAndUpdate({ email }, { profile: profileimg }, { new: true });

   return admin;
}

//Update Admin ProfilePic
export const findAdminProfileById = async (id) => {
   const admin = await Admin.findOne({ "profile._id": id }, { "profile.$": 1 });
   return admin
}


export const updateAdminProPic = async (id, image) => {
   const admin = await Admin.findOneAndUpdate(
      { "profile._id": id },
      {
         $set: {
            'profile.$.public_id': image.public_id,
            'profile.$.url': image.url
         }
      },
      { new: true }
   );
   return admin;
}

//Delete Admin Pro pic
export const deleteAdminProPic = async (img_id) => {
   const admin = await Admin.findOne({ 'profile._id': img_id });

   const image = admin.profile.id(img_id);

   // Remove the image 
   await Admin.updateOne(
      { 'profile._id': img_id },
      { $pull: { profile: { _id: img_id } } },
   );

   return { updatedAdmin: admin, deletedImage: image };
}

//UPDATE ADMIN DEFAULT SALON ID
export const updateDefaultSalonId = async (admin, newSalonId) => {
   admin.salonId = newSalonId;
   await admin.save();
   return admin;
};

export const findAdminByEmailAndSalonId = async (adminEmail, salonId) => {
   const admin = Admin.findOne({ salonId: salonId, email: adminEmail }).exec();

   return admin;
}