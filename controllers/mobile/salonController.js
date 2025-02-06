import { getbarbersBySalonId } from "../../services/mobile/barberService.js";
import { getAverageSalonRating } from "../../services/mobile/salonRatingService.js";
import { allSalonServices, allSalons, getAllSalonsByCountry, getSalonRating, salonInfoDetails, searchSalonsByLocation, searchSalonsByNameAndCity } from "../../services/mobile/salonServices.js";
import { findAdminByEmailandRoleTest } from "../../services/web/admin/adminService.js";

///DESC:GET ALL SALONS =====================
export const getAllSalons = async (req, res, next) => {
  try {
    const salons = await allSalons(); // Retrieve all salons from the database
    res.status(200).json({
      success: true,
      response: salons
    });
  } catch (error) {
    next(error);
}
}

//DESC:GET ALL SALON SERVICES ======================
export const getAllSalonServices = async (req, res, next) => {
  const { salonId } = req.query;
  try {
    const salonServices = await allSalonServices(salonId)

    if(!salonServices){
      res.status(201).json({
        success: true,
        message: "Salon services not found for the salon.",
      })
    }

    res.status(200).json({
      success: true,
      message: "Salon services retrieved",
      response: salonServices
    })
    
  }
  catch (error) {
    next(error);
  }
}

//DESC:GET SALON INFO ==================
export const getSalonInfo = async (req, res, next) => {
const { salonId } = req.query;
try {
  // Find salon information by salonId
  const salonInfo = await salonInfoDetails(salonId)

  if (!salonInfo) {
    res.status(201).json({
      success: false,
      message: 'No salons found for the particular SalonId.',
    });
  }

  // Find associated barbers using salonId
  const barbers = await getbarbersBySalonId(salonId)

    const salonRating = await getAverageSalonRating(salonId)

  res.status(200).json({
    success: true,
    message: 'Salon and barbers found successfully.',
    response: {
      salonInfo: salonInfo,
      barbers: barbers,
        salonRating: salonRating
    },
  });
} catch (error) {
  next(error);
}
}


//SEARCH SALONS BY NAME AND CITY
export const getSalonsByNameAndCity = async (req, res, next) => {
try {
  const { searchValue, limit = 10, sortField, sortOrder } = req.query;

  let query = {};

  //Creating the RegExp For salonName and City
  const searchRegExpName = new RegExp('.*' + searchValue + ".*", 'i')
  const searchRegExpCity = new RegExp('.*' + searchValue + ".*", 'i')

  //Query for searching salonName and City
  if (searchValue) {
    query.$or = [
      { salonName: { $regex: searchRegExpName } },
      { city: { $regex: searchRegExpCity } }
    ];
  }

  const sortOptions = {};

  //Creating sorting options
  if (sortField && sortOrder) {
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
  }

  const getAllSalons = await searchSalonsByNameAndCity(query, sortOptions, limit);
  res.status(200).json({
    success: true,
    message: "Salons retrieved successsfully",
    response: getAllSalons,
  })
} catch (error) {
  next(error);
}
}


//SEARCH SALONS BY LOCATION
export const getSalonsByLocation = async (req, res, next) => {

try {
  const { longitude, latitude } = req.query;
  let salons = [];
  salons = await searchSalonsByLocation(longitude, latitude)

   // Populate salonRatings field
   await getSalonRating(salons);

  return res.status(200).json({
    success: true,
    message: "Salons retrieved successfully",
    response: salons
  });
}
catch (error) {
  next(error);
}
}


export const getallSalonsTest = async (req, res, next) => {
  try {
    const salons = await allSalons(); // Retrieve all salons from the database

    // Transform salons to include only the desired fields
    const filteredSalons = salons.map(salon => ({
      salonId: salon.salonId,
      adminEmail: salon.adminEmail,
      salonName: salon.salonName,
      currency: salon.currency,
      isoCurrencyCode:salon.isoCurrencyCode
    }));

    return res.status(200).json({
      success: true,
      message: "All salons retrieved successfully",
      response: filteredSalons,
    });
  } catch (error) {
    next(error);
  }
};


export const getAdminDetailsByAdminEmailTest = async(req, res, next) => {
  try{

    const {adminEmail} = req.body;

    const admin = await findAdminByEmailandRoleTest(adminEmail)

    return res.status(200).json({
      success: true,
      message: "Admin retrieved successfully",
      response: admin
    });


  }
  catch (error) {
    next(error);
}
}


  export const getSalonCities = async(req, res, next) => {
    try{
      const {country} = req.body;

      const salonsByCountry = await getAllSalonsByCountry(country)

      const cities = [...new Set(salonsByCountry.map(salon => salon.city))];

      return res.status(200).json({ 
        success: true,
        message: "All salon cities retrieved successfully",
        response: cities 
      });

    }
    catch (error) {
      next(error);
  }
  }