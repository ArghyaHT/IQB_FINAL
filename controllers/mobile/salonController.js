import { getCategories } from "../../services/common/categoryServices.js";
import { getbarbersBySalonId } from "../../services/mobile/barberService.js";
import { findCustomerByCustomerEmailAndSalonId, findCustomerByEmail } from "../../services/mobile/customerService.js";
import { getAverageSalonRating } from "../../services/mobile/salonRatingService.js";
import { allCategorySalonServices, allSalonServices, allSalons, getAllSalonsByCountry, getSalonBySalonId, getSalonRating, salonInfoDetails, searchSalonsByLocation, searchSalonsByNameAndCity } from "../../services/mobile/salonServices.js";
import { getSalonSettings } from "../../services/mobile/salonSettingsService.js";
import { findAdminByEmailandRoleTest } from "../../services/web/admin/adminService.js";

///DESC:GET ALL SALONS =====================
export const getAllSalons = async (req, res, next) => {
  try {
    const salons = await allSalons(); // Retrieve all salons from the database

    const categories = await getCategories(); // Get once to reuse

    return res.status(200).json({
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

    if (!salonServices) {
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
  const { salonId, customerEmail } = req.query;
  try {
    // Find salon information by salonId
    const salonInfo = await salonInfoDetails(salonId)

    if (!salonInfo) {
      res.status(400).json({
        success: false,
        message: 'No salons found for the particular SalonId.',
      });
    }

    const getCustomer = await findCustomerByEmail(customerEmail)

    // Determine isFavourite status
    let isFavourite = false;
    if (getCustomer?.favoriteSalons && Array.isArray(getCustomer.favoriteSalons)) {

      const custFavSalon = getCustomer.favoriteSalons.includes(Number(salonId));

      if (custFavSalon) {
        isFavourite = true;
      }
    }

    // Add isFavourite to salonInfo object
    const salonInfoWithFav = {
      ...salonInfo._doc,
      isFavourite
    };



    // Find associated barbers using salonId
    const barbers = await getbarbersBySalonId(salonId)

    const salonServiceCategories = await getCategories()

    // Get categorized salon services
    const categorizedSalonServices = [];
    for (const category of salonServiceCategories) {
      const services = await allCategorySalonServices(salonId, category.serviceCategoryName);
      if (services && services.length > 0) {
        categorizedSalonServices.push({
          serviceCategoryName: category.serviceCategoryName,
          services: services
        });
      }
    }

    // const salonRating = await getAverageSalonRating(salonId)

    // const salonSettings = await getSalonSettings(salonId);

    // // Define all days of the week
    // const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // // Get off days from the salon settings
    // const salonOffDays = salonSettings?.salonOffDays || [];

    // // Get business hours from salon settings
    // const startTime = salonSettings?.appointmentSettings.appointmentStartTime || [];
    // const endTime = salonSettings?.appointmentSettings.appointmentEndTime || [];

    // // Construct the response with timings
    // const businessDays = allDays.map(day => {
    //   if (salonOffDays.includes(day)) {
    //     return { day, "status": "closed" };
    //   }
    //   return { day, startTime, endTime };
    // });


    return res.status(200).json({
      success: true,
      message: 'Salon and barbers found successfully.',
      response: {
        salonInfo: salonInfoWithFav,
        barbers: barbers,
        salonServiceCategories: salonServiceCategories,
        categorizedSalonServices: categorizedSalonServices,

        // salonRating: salonRating,
        // salonBusinessDays: businessDays
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
    
    const getsalonServiceCategories = await getCategories()

    // Attach same category array to every salon
    const salonsWithCategory = getAllSalons.map((salon) => ({
      ...salon._doc,
      serviceCategories: getsalonServiceCategories,
    }));

    
    return res.status(200).json({
      success: true,
      message: "Salons retrieved successsfully",
      response: salonsWithCategory,
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

    const getsalonServiceCategories = await getCategories()

    // Attach same category array to every salon
    const salonsWithCategory = salons.map((salon) => ({
      ...salon,
      serviceCategories: getsalonServiceCategories,
    }));


    // Populate salonRatings field
    await getSalonRating(salons);

    return res.status(200).json({
      success: true,
      message: "Salons retrieved successfully",
      response: salonsWithCategory
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
      isoCurrencyCode: salon.isoCurrencyCode
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


export const getAdminDetailsByAdminEmailTest = async (req, res, next) => {
  try {

    const { adminEmail } = req.body;

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

//GET ALL SALON CITIES
export const getSalonCities = async (req, res, next) => {
  try {
    const { country } = req.body;

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


//DESC:GET ALL SALON SERVICES ======================
export const getAllCategorySalonServices = async (req, res, next) => {
  const { salonId, serviceCategoryName } = req.query;
  try {
    const salonServices = await allCategorySalonServices(salonId, serviceCategoryName)

    if (!salonServices) {
      res.status(201).json({
        success: true,
        message: "Salon services not found for the salon.",
      })
    }

    res.status(200).json({
      success: true,
      message: "Salon services by category retrieved",
      response: salonServices
    })

  }
  catch (error) {
    next(error);
  }
}


export const getSalonFeatures = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    const getSalonDetails = await getSalonBySalonId(salonId);

    if (!getSalonDetails) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon features fetched successfully",
      response: {
        isQueuing: getSalonDetails.isQueuing,
        isAppointments: getSalonDetails.isAppointments
      }
    });
  } catch (error) {
    next(error);
  }
};


