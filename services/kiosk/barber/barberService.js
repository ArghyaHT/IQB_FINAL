import Barber from "../../../models/barberRegisterModel.js";

export const findBarberByEmailAndRole = async(email) => {
    const barber = await Barber.findOne({ email, role: 'Barber', isApproved: true }).exec();

    return barber;
}

export const findBarberByEmailAndSalonId = async(email, salonId) => {
   const barber = await Barber.findOne({ email, salonId: salonId, isApproved: true }).exec();

   return barber;
}

export const findBaberByBarberId = async(barberId) => {
   const barber = await Barber.findOne({barberId}).exec();

   return barber;
}


//CHANGE BARBER ONLINE STATUS
export const barberOnlineStatus = async (barberId, salonId, isOnline) => {
    const barber = await Barber.findOneAndUpdate(
       { barberId: barberId, salonId: salonId, isClockedIn: true },
       { isOnline: isOnline }, // Update the isOnline field in the database
       { new: true }
    );
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


 //GET BARBERS FOR Q
export const getBarbersForQ = async (salonId) => {
   const barbers = await Barber.find({ salonId, isActive: true, isOnline: true, isClockedIn: true });
   return barbers;
}

//GET BARBERS BY MULTIPLE SERVICE IDS
export const getBarbersWithMulServices = async (salonId, serviceIds) => {
   const barbers = await Barber.find({
      salonId,
      isOnline: true,
      isActive: true,
      'barberServices.serviceId': { $all: serviceIds }, // Query barbers with serviceIds present in the serviceIdsArray
   });
   return barbers;
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

 //INCREASE BARBER EWT WHEN QUEUEING
export const updateBarberEWT = async (salonId, barberId, totalServiceEWT) => {
    const updatedBarber = await Barber.findOneAndUpdate(
       { salonId: salonId, barberId: barberId, isOnline: true, isClockedIn: true },
       { $inc: { barberEWT: totalServiceEWT, queueCount: 1 } }, //  barberWorking.barberEWT + serviceEWT;
       { new: true }
    );
    return updatedBarber;
 }

 //GET ALL BARBERS BY SALONID
export const fetchedBarbers = async (query) => {
   const barbers = await Barber.find(query).sort({ email: 1 }).select("email"); 

   return barbers
}

//GET BARBER BY BARBERID
export const getBarberByBarberId = async (barberId) => {
   const barber = await Barber.findOne({ barberId, isDeleted: false })
   return barber;
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


export const findBarberByBarberEmailAndSalonId = async(updatedByEmail, salonId) =>{
   const barber = Barber.findOne({ salonId: salonId, email: updatedByEmail }).exec();

   return barber;
}

// Function to get all barber IDs
export const getAllBarberIds = async () => {
   try {
       const barberIds = await Barber.find().distinct('_id');
       return barberIds;
   } catch (error) {
       console.error("Error fetching barber IDs:", error);
       return [];
   }
};

export const changeBarberStatusAtSalonOffline = async (salonId) => {
   const barbers = await Barber.updateMany(
       { salonId: salonId },
       { $set: { isOnline: false, isClockedIn: false } },
       { new: true }
   );
   return barbers;
};

//GET ALL BARBERS BY SALONID
export const getAllSalonBarbers = async (salonId, ) => {
   const barbers = await Barber.find({ salonId, isDeleted: false, isApproved: true });

   return barbers
}