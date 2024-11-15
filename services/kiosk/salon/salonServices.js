import Salon from "../../../models/salonRegisterModel.js";

// Fetch all salons associated with the admin from registeredSalons array
export const allSalonsByAdmin = async (registeredSalons) => {

  const salons = await Salon.find({
    salonId: { $in: registeredSalons },
    isDeleted: false,
  });
  return salons;
}

//Get Salon By Salon Id
export const getSalonBySalonId = async (salonId) => {
  const salon = await Salon.findOne({ salonId });
  return salon;
}

//GET ALL SALON SERVICES 
export const allSalonServices = async (salonId) => {
  const salon = await Salon.findOne({ salonId })

  const allServices = salon.services

  return allServices
}


//Change Salon Online Status
export const salonOnlineStatus = async (salonId, isOnline) => {
  const salon = await Salon.findOneAndUpdate(
    { salonId: salonId },
    { isOnline: isOnline }, // Update the Salon isOnline field in the database
    { new: true }
  );
  return salon;
}

//GET ADMIN DEFAULT SALON DETAILS
export const getDefaultSalonDetailsEmail = async (salonId) => {
  const salon = await Salon.findOne({ salonId })

  return salon;
}

//GET SALON ONLINE
export const getSalonOnlineStatus = async(salonId) => {
  const salon = await Salon.findOne({salonId}).select("isOnline").lean();

  return salon?.isOnline ?? false;
}

export const getbokingAvailabilystatus = async(salonId) => {
  const salon = await Salon.findOne({salonId}).select("mobileBookingAvailability").lean();

  return salon?.mobileBookingAvailability ?? false;
}

//GET SALON TIMEZONE 
export const getSalonTimeZone = async(salonId) => {
  const salonTimeZone = await Salon.findOne({salonId})

  return salonTimeZone;
}

//CHANGE MOBILE BOOKING AVAILABILITY STATUS 
export const mobileBookingAvailabilityStatus = async(salonId, mobileBookingAvailability) => {
  const salon = await Salon.findOneAndUpdate(
    { salonId: salonId },
    { mobileBookingAvailability: mobileBookingAvailability }, // Update the isOnline field in the database
    { new: true }
 );
 return salon;
}

// Function to get all salon IDs
export const getAllSalonIds = async () => {
  try {
      const salonIds = await Salon.find().distinct('_id');
      return salonIds;
  } catch (error) {
      console.error("Error fetching salon IDs:", error);
      return [];
  }
};

export const checkSalonExists = async (salonId) => {
  let salon = await Salon.findOne({ salonId })

  if (salon) {
    return salon;
  }
  else {
    return salon = null;
  }

}