import Salon from "../../models/salonRegisterModel.js";

//FIND SALON BY SALONID
export const findSalonBySalonId = async (salonId) => {
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

  //GET CUSTOMER FAVOURITE SALONS
export const getCustomerFavouriteSalon = async(favoriteSalons) => {
    const salons = await Salon.find({
      salonId: { $in: favoriteSalons },
      isDeleted: false,
    });
  
    return salons;
  } 

  //GET ALL SALONS
export const allSalons = async () => {
  const salons = await Salon.find({});
  return salons;
}


//GET ALL SALON SERVICES 
export const allSalonServices = async (salonId) => {
  const salon = await Salon.findOne({ salonId })

  const allServices = salon.services
  console.log(allServices)

  return allServices
}


//GET SALON INFO BY SALON ID
export const salonInfoDetails = async (salonId) => {
  const salon = await Salon.findOne({ salonId });
  return salon;
}

export const searchSalonsByNameAndCity = async(query, sortOptions, limit) => {
  const salons = await Salon.find(query).sort(sortOptions).limit(Number(limit));

  return salons;
}

export const searchSalonsByLocation =  async(longitude, latitude) => {
  const salons = await Salon.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        key: "location",
        // maxDistance: parseFloat(1000) * 1609,
        maxDistance: Number.MAX_VALUE,
        spherical: true,
        distanceField: "dist.calculated",
      },
    },
  ]);
  return salons
}

export const getSalonRating = async(salons) => {
  const salonRating = await Salon.populate(salons, { path: "salonRatings" });

  return salonRating;
}

//GET SALON TIMEZONE 
export const getSalonBySalonId = async(salonId) => {
  const salonTimeZone = await Salon.findOne({salonId})

  return salonTimeZone;
}


export const getAllSalonsByCountry = async(country) => {
  const salons = await Salon.find({country: country})

  return salons;
}


//GET ALL SALON SERVICES 
// GET ALL SALON SERVICES (Optionally filter by serviceCategoryName)
export const allCategorySalonServices = async (salonId, serviceCategoryName) => {
  const salon = await Salon.findOne({ salonId });

  if (!salon) {
    throw new Error("Salon not found");
  }

  let allServices = salon.services || [];

  if (serviceCategoryName) {
    allServices = allServices.filter(
      service => service.serviceCategoryName === serviceCategoryName
    );
  }

  return allServices;
};
