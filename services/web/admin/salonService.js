import Salon from "../../../models/salonRegisterModel.js"
import { getCurrencySymbol } from "../../../utils/currencySymbolMap/currencysymbolmap.js";
import { findCountryByName } from "../../../services/web/countries/countryService.js";
import SalonQueueListModel from "../../../models/salonQueueListModel.js";
import moment from "moment";
import SalonPayments from "../../../models/salonPaymnetsModel.js";


//FIND SALON BY SALON NAME
export const findSalonBySalonNameOrEmail = async (salonName, salonEmail) => {
  const salon = await Salon.findOne({ $or: [{ salonEmail }, { salonName }] });
  return salon
}

//CREATE SALONID
export const createSalonId = async () => {
  const salonId = await Salon.countDocuments() + 1;
  return salonId
}


//CREATE SALON
export const saveSalon = async (salonId, salonData) => {
  const {
    adminEmail,
    salonName,
    salonCode,
    salonLogo,
    salonType,
    timeZone,
    countryCode,
    address,
    city,
    location,
    salonDesc,
    country,
    postCode,
    contactTel,
    webLink,
    fbLink,
    salonEmail,
    tiktokLink,
    twitterLink,
    instraLink,
    servicesData
  } = salonData


  // Find the country data from the Country model
  const countryData = await findCountryByName(country);

  // Retrieve currency from countryData
  const currency = await getCurrencySymbol(countryData.currency);

  const savedSalon = new Salon({
    salonId,
    adminEmail,
    salonName,
    salonCode: salonCode,
    salonLogo,
    salonType,
    salonDesc,
    mobileCountryCode: countryCode,
    address,
    timeZone,
    city,
    location,
    country,
    currency: currency,
    isoCurrencyCode:countryData.currency.toLowerCase(),
    postCode,
    contactTel,
    tiktokLink,
    webLink,
    fbLink,
    salonEmail,
    twitterLink,
    instraLink,
    services: servicesData
  })

  await savedSalon.save();

  return savedSalon;
}

//FIND SALON BY SALONID AND ADMIN EMAIL
export const findSalonBySalonIdAndAdmin = async (salonId, adminEmail) => {
  const salon = await Salon.findOne({ salonId: salonId, adminEmail: adminEmail }).lean();
  return salon;
}

//UPDATE SALON 
export const updateSalon = async (salonId, adminEmail, updateFields) => {
  const salon = await Salon.findOneAndUpdate(
    { salonId: salonId, adminEmail: adminEmail },
    {
      // Update only the provided fields
      $set: updateFields,
    },
    {
      new: true,
    }
  );
  return salon;
}

// Fetch all salons associated with the admin from registeredSalons array
export const allSalonsByAdmin = async (registeredSalons) => {

  const salons = await Salon.find({
    salonId: { $in: registeredSalons },
    isDeleted: false,
  });
  return salons

}

//GET ADMIN DEFAULT SALON DETAILS
export const getDefaultSalonDetailsByAdmin = async (salonId) => {
  const salon = await Salon.findOne({ salonId })

  return salon;
}
//UPLOAD SALON IMAGES
export const uploadSalonImages = async (salonId, uploadedImages) => {
  // const salon = await Salon.findOneAndUpdate(
  //   { salonId }, { gallery: galleryImg }, { new: true });
  // return salon;
  const salon = await Salon.findOneAndUpdate(
    { salonId },
    { $push: { gallery: { $each: uploadedImages } } },
    { new: true }
  );
  return salon;

}

//ADD MORE SALON IMAGES 
export const addMoreSalonImages = async (salonId, uploadedImages) => {
  const salon = await Salon.findOneAndUpdate(
    { salonId },
    { $push: { gallery: { $each: uploadedImages } } },
    { new: true }
  );
  return salon;
}

//UPDATE SALON IMAGE
export const findSalonProfileById = async (id) => {
  const salon = await Salon.findOne({ "profile._id": id }, { "profile.$": 1 });
  return salon
}

export const updateSalonImage = async (id, image) => {
  const salon = await Salon.findOneAndUpdate(
    { "gallery._id": id },
    {
      $set: {
        'gallery.$.public_id': image.public_id,
        'gallery.$.url': image.url
      }
    },
    { new: true }
  );
  return salon;
}

//DELETE SALON IMAGE
export const deleteSalonImage = async (img_id) => {
  // Find the salon and get the image details before deletion
  const salon = await Salon.findOne({ 'gallery._id': img_id });

  const image = salon.gallery.id(img_id);

  // Remove the image
  await Salon.updateOne(
    { 'gallery._id': img_id },
    { $pull: { gallery: { _id: img_id } } }
  );

  return { updatedSalon: salon, deletedImage: image };
}

//SEARCH SALONS BY LOCATION
export const findSalonsByLocation = async (longitude, latitude) => {
  const salons = await Salon.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        key: "location",
        // maxDistance: parseFloat(1000) * 1609,
        maxDistance: 20 * 1000, // 3 km in meters
        spherical: true,
        distanceField: "dist.calculated",
      },
    },
    {
      $project: {
        salonId: 1,      // Include the salon ID
        salonName: 1,     // Include the salon name
      }
    }
  ]);
  return salons
}

//GET ALL SALON SERVICES 
export const allSalonServices = async (salonId) => {
  const salon = await Salon.findOne({ salonId })

  const allServices = salon.services

  return allServices
}

//GET ALL SALONS
export const allSalons = async () => {
  const salons = await Salon.find({});
  return salons;
}

//SEARCH SALONS BY NAME AND CITY
export const getSalonsByNameAndCity = async (query, sortOptions, limit) => {
  const salons = await Salon.find(query).sort(sortOptions).limit(Number(limit));
  return salons;
}

//DELETE SALON 
export const toDeleteSalon = async (salonId) => {
  const deletedSalon = await Salon.findOneAndUpdate({ salonId }, { isDeleted: true }, { new: true });

  return deletedSalon;
}

//CHANGE SALON ONLINE STATUS
export const salonOnlineStatus = async (salonId, isOnline) => {
  const salon = await Salon.findOneAndUpdate(
    { salonId: salonId },
    { isOnline: isOnline }, // Update the Salon isOnline field in the database
    { new: true }
  );
  return salon;
}


//GET SALON INFO BY SALON ID
export const salonInfoDetails = async (salonId) => {
  const salon = await Salon.findOne({ salonId });
  return salon;
}

//GET CUSTOMER CONNECTED SALONS 
export const getCustomerConnectedSalons = async (connectedSalon) => {
  const connectedSalons = await Salon.find({
    salonId: { $in: connectedSalon },
    isDeleted: false,
  });
  return connectedSalons;
}

//FIND SALON BY SALONID
export const findSalonBySalonId = async (salonId) => {
  const salon = await Salon.findOne({ salonId, isOnline: true });
  return salon;
}

//UPLOAD SALON LOGO
export const uploadedSalonLogo = async (salonId, salonLogosUploaded) => {
  const salonLogo = await Salon.findOneAndUpdate(
    { salonId }, { salonLogo: salonLogosUploaded }, { new: true });
  return salonLogo;
}

//UPDATE SALON LOGO
export const findSalonLogoById = async (id) => {
  const salon = await Salon.findOne({ "salonLogo._id": id }, { "salonLogo.$": 1 });
  return salon
}

export const updatedSalonLogo = async (salonId, id, image) => {
  const salon = await Salon.findOneAndUpdate(
    { salonId, "salonLogo._id": id },
    {
      $set: {
        'salonLogo.$.public_id': image.public_id,
        'salonLogo.$.url': image.secure_url
      }
    },
    { new: true }
  );
  return salon;
}

//GET SALON LOGO
export const getSalonLogoBySalonId = async (salonId) => {
  const salonLogo = await Salon.findOne({ salonId }).select("salonName salonLogo");
  return salonLogo;
}

//DELETE SALON LOGO
export const deletedSalonLogo = async (salonId, img_id) => {
  const salonLogo = await Salon.findOneAndUpdate(
    { salonId, 'salonLogo._id': img_id },
    { $pull: { salonLogo: { _id: img_id } } },
    { new: true }
  );
  return salonLogo;
}


//GET CUSTOMER FAVOURITE SALONS
export const getCustomerFavouriteSalon = async (favoriteSalons) => {
  const salons = await Salon.find({
    salonId: { $in: favoriteSalons },
    isDeleted: false,
  }).select("salonName");

  return salons;
}


//GET CUSTOMER FAVOURITE SALONS
export const getSalonGallery = async (salonId) => {
  const salongallery = await Salon.findOne({ salonId }).select('gallery');

  return salongallery;
}

//GET SALON TIMEZONE 
export const getSalonBySalonId = async (salonId) => {
  const salon = await Salon.findOne({ salonId })

  return salon;
}

export const checkSalonExists = async (salonId) => {
  let salon = await Salon.findOne({ salonId })

  if (salon) {
    return salon;
  }
  else {
    return salon = null;
  }

}


export const changeSalonService = async(salonId) => {
  const salon = await SalonQueueListModel.findOne({ salonId });
  return salon
}


// export const addSalonPayments = async (salonId, isQueuing, isAppointments, paymentData) => {
//   const salonPayments = await Salon.updateOne(
//     { salonId: salonId },
//     {
//       $set: {
//         isQueuing: isQueuing,
//         isAppointments: isAppointments,
//       },
//       $push: {
//         productPayment: paymentData,
//       },
//     }
//   );

//   return salonPayments;
// };


export const getSalonPayments = async (salonId) => {
const salonPayments = await SalonPayments.find({ salonId }); // Find all payments for the salonId

if (!salonPayments || salonPayments.length === 0) return []; // Return empty array if no payments found

const formattedPayments = salonPayments.map((payment) => {
  const purchaseDate = moment.unix(payment.purchaseDate);
  const paymentExpiryDate = moment.unix(payment.paymentExpiryDate);
  const today = moment();

  return {
    ...payment.toObject(),
    purchaseDate: purchaseDate.format('YYYY-MM-DD'),
    paymentExpiryDate: paymentExpiryDate.format('YYYY-MM-DD'),
    activityStatus: today.isBetween(purchaseDate, paymentExpiryDate, undefined, '[]'),
  };
});

return formattedPayments;
};


export const checkQueueingExpireDate = async() => {
  const todayDate = Math.floor(Date.now() / 1000); // Current time in seconds

  // Fetch all salons from the database
  const salons = await Salon.find();

  for (const salon of salons) {
    const queueExpiryDate = parseInt(salon.queueingExpiryDate, 10); // Convert expiry date to a number
    if (todayDate >= queueExpiryDate) {
      salon.isQueuing = false; // Update the field locally
      await salon.save(); // Save the updated salon to the database
    }
  }
  return
}

export const checkAppointmentExpireDate = async() => {
  const todayDate = Math.floor(Date.now() / 1000); // Current time in seconds

  // Fetch all salons from the database
  const salons = await Salon.find();

  for (const salon of salons) {
    const appointmentExpiryDate = parseInt(salon.appointmentExpiryDate, 10); // Convert expiry date to a number
    if (todayDate >= appointmentExpiryDate) {
      salon.isAppointments = false; // Update the field locally
      await salon.save(); // Save the updated salon to the database
    }
  }
  return
}


export const changeAllSalonOnlineStatus = async () => {
    // Fetch all salons
    const salons = await Salon.find();

    // Iterate through each salon and update its status
    for (const salon of salons) {
      salon.isOnline = false;
      salon.mobileBookingAvailability = false;
      salon.kioskAvailability = false
      await salon.save(); // Save the updated document
    }
};


export const changeSalonTrailPeriodStatus = async() => {
  const todayDate = Math.floor(Date.now() / 1000); // Current time in seconds

  // Fetch all salons from the database
  const salons = await Salon.find();

  for (const salon of salons) {
    const trailEndDate = parseInt(salon.trailExpiryDate, 10); // Convert expiry date to a number
    
    if (todayDate >= trailEndDate) {

      salon.isTrailEnabled = false; 

      if(!salon.queueingExpiryDate){
        salon.isQueuing = false
      }

      if(!salon.appointmentExpiryDate){
        salon.isAppointments = false
      }
      await salon.save(); // Save the updated salon to the database
    }
  }
  return

}