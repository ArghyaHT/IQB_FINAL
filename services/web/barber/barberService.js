import Barber from "../../../models/barberRegisterModel.js"
import moment from "moment"


//FIND BARBER BY EMAIL
export const findBarberByEmailAndRole = async (email) => {
   const barber = await Barber.findOne({ email, role: 'Barber' }).exec()
   return barber;
}

//CREATE BARBERID
export const createBarberId = async () => {
   const barberId = await Barber.countDocuments() + 1;
   return barberId;
}

//SAVE BARBER
export const createBarber = async (email, hashedPassword, barberId) => {
   const user = new Barber({
      email,
      password: hashedPassword,
      barberId: barberId,
      role: "Barber"
    })
    
   await user.save();

   return user;
}

//BARBER GOOGLE SIGNUP
export const createGoogleBarber = async(email, barberId, barberCode) => {
   const barber =  new Barber({
      email: email,
      role: "Barber",
      AuthType: "google",
      barberId: barberId,
      barberCode: barberCode
    })

    await barber.save();

    return barber;
}

//BARBER RESET PASSWORD 
export const resetBarberPassword = async (resetPasswordToken) => {
   const user = await Barber.findOne({
      resetPasswordToken: resetPasswordToken, resetPasswordExpire: {
         $gt: Date.now()
      }
   });
   return user;
}

//GOOGLE LOGIN BARBER
export const googleLoginBarber = async (email) => {
   const user = await Barber.findOne({ email: email, AuthType: "google", isDeleted:false });
   return user;
}

//GOOGLE SIGNUP BARBER
export const googleSignUpBarber = async (name, email, barberId, barberCode) => {
   const user = new Admin({
      name: name,
      email: email,
      barberId: barberId,
      barberCode: barberCode,
      barber: true,
      AuthType: "google"
   })
   await user.save();

   return user;
}

//ADMIN CREATE BARBER
export const adminCreateBarber = async (email, hashedPassword, name, nickName, salonId, countryCode, mobileNumber, dateOfBirth, barberCode, barberId, barberExp, barberServices) => {

   const newBarber = new Barber({
      email,
      password: hashedPassword,
      name,
      nickName,
      salonId,
      mobileNumber,
      mobileCountryCode: countryCode,
      dateOfBirth,
      role: "Barber",
      isApproved: true,
      barberCode,
      barberExp: barberExp,
      dateOfJoin: moment().format('YYYY-MM-DD'), // Set dateOfJoin to the current date in the desired format
      barberId: barberId,
      isActive: true,
      barberServices // Assigning the received services array
   });

   // Save the new barber to the database
   await newBarber.save();
   return newBarber;
}

// Update Barber Services by Admin
export const adminUpdateBarberServices = async (email, salonId, serviceId, serviceIcon, serviceName, serviceCode, servicePrice, vipService, barberServiceEWT) => {
   const service = await Barber.findOneAndUpdate(
       { email, salonId, 'barberServices.serviceId': serviceId },
       {
           $set: {
               'barberServices.$.serviceIcon': serviceIcon,
               'barberServices.$.serviceName': serviceName,
               'barberServices.$.serviceCode': serviceCode,
               'barberServices.$.servicePrice': servicePrice,
               'barberServices.$.vipService': vipService,
               'barberServices.$.barberServiceEWT': barberServiceEWT // Update other fields if needed
           }
       },
       { new: true }
   );
   return service;
}

//ADMIN ADD BARBER SERVICES
export const adminAddNewBarberService = async (email, salonId, newService) => {
   const service = await Barber.findOneAndUpdate(
      { email, salonId },
      { $addToSet: { barberServices: newService } },
      { new: true }
   );
   return service;
}

//ADMIN UPDATE BARBER 
export const adminUpdateBarber = async (email, name, nickName,countryCode, mobileNumber, dateOfBirth, barberServices) => {
   const barber = await Barber.findOneAndUpdate({ email },
      { name, nickName, mobileNumber, mobileCountryCode: countryCode, dateOfBirth, barberServices: barberServices },
      { new: true });
   return barber;
}

//UPLOAD BARBER PROFILE PICTURE
export const uploadBarberProPic = async (email, profileimg) => {
   const barber = await Barber.findOneAndUpdate({ email }, { profile: profileimg }, { new: true });

   return barber;
}

//UPDATE ADMIN PROFILE PICTURE
export const findBarberProfileById = async (id) => {
   const barber = await Barber.findOne({ "profile._id": id }, { "profile.$": 1 });
   return barber;
}


export const updateBarberProPic = async (id, image) => {
   const barber = await Barber.findOneAndUpdate(
      { "profile._id": id },
      {
         $set: {
            'profile.$.public_id': image.public_id,
            'profile.$.url': image.url
         }
      },
      { new: true }
   );
   return barber;
}


//DELETE ADMIN PROFILE PICTURE
export const deleteBarberProPic = async (img_id) => {
   const barber = await Barber.findOne({ 'profile._id': img_id });

   const image = barber.profile.id(img_id);
   
   // Remove the image 
   await Barber.updateOne(
     { 'profile._id': img_id },
     { $pull: { profile: { _id: img_id } } },
   );
   
   return { updatedBarber: barber, deletedImage: image };
}

//CONNEXT BARBER TO SALON 
export const connectBarberSalon = async (email, salonId, barberServices, approvePendingMessage) => {
   const barber = await Barber.findOneAndUpdate({ email },
      { salonId: salonId, barberServices: barberServices, approvePendingMessage:approvePendingMessage }, { new: true });

   return barber;
}

//GET ALL BARBERS BY SALONID
export const fetchedBarbers = async (salonId, sortOptions) => {
   const barbers = await Barber.find({ salonId, isDeleted: false }).sort(sortOptions);

   return barbers
}

//TOTAL BARBER COUNT 
export const totalBarberCount = async (query) => {
   const totalCount = await Barber.countDocuments(query);
   return totalCount;
}

//UPDATE BARBER ACCOUNT DETAILS
export const updateBarber = async (email, updateFields) => {
   const barber = await Barber.findOneAndUpdate({ email: email }, updateFields, { new: true }).select("-password");
   return barber;
}

//UPDATE BARBERCODE
export const barberCode = async (email, updatedBarberCode) => {
   const barber = await Barber.findOneAndUpdate({ email: email }, { barberCode: updatedBarberCode }, { new: true });
   return barber;
}

//DELETE BARBER
export const deletedBarber = async (salonId, email) => {
   const barber = await Barber.findOneAndUpdate({ salonId: salonId, email: email }, { isDeleted: true }, { new: true });

   return barber;
}

//CHANGE BARBER WORKING STATUS
export const changeBarberStatus = async (barberId, isActive) => {
   const barber = await Barber.findOneAndUpdate(barberId, { isActive }, { new: true });

   return barber;
}

//CHANGE BARBER ONLINE STATUS
//CHANGE BARBER ONLINE STATUS
export const barberOnlineStatus = async (barberId, salonId, isOnline) => {
   const barber = await Barber.findOneAndUpdate(
      { barberId: barberId, salonId: salonId, isClockedIn: true },
      { isOnline: isOnline }, // Update the isOnline field in the database
      { new: true }
   );
   return barber;
}

//GET BARBERS BY SERVICE ID
export const getBarbersByServiceId = async (serviceId) => {
   const barbers = await Barber.find({ "barberServices.serviceId": serviceId, isDeleted: false });
   return barbers;
}


//GET BARBER BY BARBERID
export const getBarberByBarberId = async (barberId) => {
   const barber = await Barber.findOne({ barberId, isDeleted: false })
   return barber;
}

//GET BARBERS BY SALON ID
export const getbarbersBySalonId = async (salonId) => {
   const barbers = await Barber.find({ salonId, isDeleted: false });
   return barbers;
}

//INCREASE BARBER EWT WHEN QUEUEING
export const updateBarberEWT = async (salonId, barberId, totalServiceEWT) => {
   const updatedBarber = await Barber.findOneAndUpdate(
      { salonId: salonId, barberId: barberId, isOnline: true },
      { $inc: { barberEWT: totalServiceEWT, queueCount: 1 } }, //  barberWorking.barberEWT + serviceEWT;
      { new: true }
   );
   return updatedBarber;
}

 //AVAILABLE BARBER FOR AUTO JOIN
 export const availableBarberAutoJoin = async (salonId, serviceIds, totalServiceEWT) => {
   const availableBarber = await Barber.findOneAndUpdate(
      {
         salonId: salonId,
         isOnline: true,
         isClockedIn: true,
         'barberServices.serviceId': { $all: serviceIds },
         
      },
      {
         $inc: { barberEWT: totalServiceEWT, queueCount: 1 },
      },
      { new: true, sort: { barberEWT: 1 } }
   );

   return availableBarber;
}

//DECREASE BARBER EWT WHEN SERVED
export const decreaseBarberEWT = async (salonId, barberId, currentServiceEWT) => {
   const updatedBarber = await Barber.findOneAndUpdate(
      { salonId: salonId, barberId: barberId },
      { $inc: { barberEWT: -currentServiceEWT, queueCount: -1 } },
      { new: true }
   );
   return updatedBarber;
}

//DECREASE BARBER EWT WHEN CANCEL QUEUE
export const decreaseBarberEWTWhenQCancel = async (salonId, barberId, canceledServiceEWT) => {
   const updatedBarber = await Barber.findOneAndUpdate(
      { salonId, barberId },
      { $inc: { queueCount: -1, barberEWT: -canceledServiceEWT } },
      { new: true }
   );
   return updatedBarber;
}

//GET BARBERS FOR Q
export const getBarbersForQ = async (salonId) => {
   const barbers = await Barber.find({ salonId, isActive: true, isOnline: true });
   return barbers;
}


//GET BARBERS BY MULTIPLE SERVICE IDS
export const getBarbersWithMulServiceId = async (salonId, serviceIdsArray) => {
   const barbers = await Barber.find({
      salonId,
      isOnline: true,
      isActive: true,
      'barberServices.serviceId': { $all: serviceIdsArray }, // Query barbers with serviceIds present in the serviceIdsArray
   });
   return barbers;
}

//GET BARBER BY ID
export const getBarberbyId = async (barberId) => {
   const barber = await Barber.findOne({ barberId: barberId });
   return barber;
}

//FIND BARBERS BY SALONID
export const findBarbersBySalonIdforCustomerDashboard = async (salonId) => {
   const barbers = await Barber.find({ salonId, isOnline: true }).select("name");
   return barbers;
}


// Function to update barberExp for existing barbers
export const updateBarberExp = async () => {
   const allBarbers = await Barber.find(); // Fetch all existing barbers from the database

   for (const barber of allBarbers) {
      // Ensure barberExp is defined and not null
      if (barber.barberExp !== undefined && barber.barberExp !== null) {
         // Convert barberExp to a numeric format
         const barberExpNumeric = parseFloat(barber.barberExp);

         const currentDate = moment();
         const dateOfJoin = moment(barber.dateOfJoin);

         const yearsOfExperience = currentDate.diff(dateOfJoin, 'years', true);

         const fractionalPart = Math.ceil(yearsOfExperience * 10) / 10;

         // Calculate the updated barberExp by adding the years of experience directly
         let updatedBarberExp = barberExpNumeric + fractionalPart;


         // Round to one decimal place
         updatedBarberExp = parseFloat(updatedBarberExp.toFixed(1));

         // Log the values for debugging
         console.log(`Updating barber ${barber._id}:`);
         console.log(`  - Old barberExp: ${barber.barberExp}`);
         console.log(`  - Years of experience: ${yearsOfExperience}`);
         console.log(`  - New barberExp: ${updatedBarberExp}`);

         // Update the barber record in the database
         await Barber.findByIdAndUpdate(barber._id, { $set: { barberExp: updatedBarberExp.toString() } });
      } else {
         console.log(`Skipping barber ${barber._id} due to undefined or null barberExp.`);
      }
   }
};


//Approve Barber By Admin
export const approveBarberByadmin = async(salonId, email, isApproved) => {
   const barber = await Barber.findOneAndUpdate({ salonId, email }, { isApproved, approvePendingMessage: "" }, { new: true });
   return barber;
}


export const findBarberByBarberEmailAndSalonId = async(barberEmail, salonId) =>{
   const barber = Barber.findOne({ salonId: salonId, email: barberEmail }).exec();

   return barber;
}

//CHANGE BARBER CLOCKIN STATUS
export const barberClockInStatus = async (barberId, salonId, isClockedIn) => {
   const barber = await Barber.findOneAndUpdate(
      { barberId: barberId, salonId: salonId },
      { isClockedIn: isClockedIn }, // Update the isOnline field in the database
      { new: true }
   );
   return barber;
}

//CHANGE BARER ONLINE STATUS
export const changeBarberStatusAtSalonOffline = async (salonId) => {
   const barbers = await Barber.updateMany(
       { salonId: salonId },
       { $set: { isOnline: false, isClockedIn: false } },
       { new: true }
   );
   return barbers;
};