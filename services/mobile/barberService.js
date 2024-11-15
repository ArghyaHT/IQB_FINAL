import Barber from "../../models/barberRegisterModel.js";

//FIND BARBERS BY SALONID
export const findBarbersBySalonIdforCustomerDashboard = async (salonId) => {
    const barbers = await Barber.find({ salonId, isOnline: true });
    return barbers;
 }

 //GET ALL BARBERS BY SALONID
export const fetchedBarbers = async (salonId, sortOptions, skip, limit) => {
    const barbers = await Barber.find({ salonId, isDeleted: false, isActive:true, isOnline:true }).sort(sortOptions).skip(skip).limit(Number(limit));
 
    return barbers
 }

 //TOTAL BARBER COUNT 
export const totalBarberCount = async (query) => {
    const totalCount = await Barber.countDocuments(query);
    return totalCount;
 }

 //GET BARBER BY ID
export const getBarberbyId = async (barberId) => {
    const barber = await Barber.findOne({ barberId: barberId });
    return barber;
 }


//GET BARBERS BY SALON ID
export const getbarbersBySalonId = async (salonId) => {
    const barbers = await Barber.find({ salonId, isDeleted: false });
    return barbers;
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
        { salonId: salonId, barberId: barberId, isOnline: true },
        { $inc: { barberEWT: totalServiceEWT, queueCount: 1 } }, //  barberWorking.barberEWT + serviceEWT;
        { new: true }
     );
     return updatedBarber;
  }

    //GET BARBER BY BARBER ID
  export const getBarberByBarberId = async(barberId) => {
   const barber = await Barber.findOne({barberId});
   return barber;
  }

  //GET BARBER BY BARBER EMAIL AND SALON ID
  export const findBarberByBarberEmailAndSalonId = async(barberEmail, salonId) =>{
   const barber = Barber.findOne({ salonId: salonId, email: barberEmail }).exec();

   return barber;
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