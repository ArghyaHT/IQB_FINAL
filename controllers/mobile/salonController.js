import { CUSTOMER_DASHBOARD_SUCCESS, GET_SALON_SERVICES_ERROR } from "../../constants/mobile/SalonConstants.js";
import { ERROR_STATUS_CODE_201, SUCCESS_STATUS_CODE } from "../../constants/mobile/StatusCodeConstants.js";
import { SALON_NOT_FOUND_ERROR, SALON_SERVICES_RETRIEVED_SUCESS, SALONS_RETRIEVED_SUCESS } from "../../constants/web/SalonConstants.js";
import { ErrorHandler } from "../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { getbarbersBySalonId } from "../../services/mobile/barberService.js";
import { getAverageSalonRating } from "../../services/mobile/salonRatingService.js";
import { allSalonServices, allSalons, getSalonRating, salonInfoDetails, searchSalonsByLocation, searchSalonsByNameAndCity } from "../../services/mobile/salonServices.js";

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

    if (!salonServices) {
      // res.status(201).json({
      //   success: true,
      //   message: "Salon services not found for the salon.",
      // })
      return ErrorHandler(GET_SALON_SERVICES_ERROR, ERROR_STATUS_CODE_201, res)

    }

    // res.status(200).json({
    //   success: true,
    //   message: "Salon services retrieved",
    //   response: salonServices
    // })

    return SuccessHandler(SALON_SERVICES_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: salonServices });


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
      // res.status(201).json({
      //   success: false,
      //   message: 'No salons found for the particular SalonId.',
      // });
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE_201, res)

    }

    // Find associated barbers using salonId
    const barbers = await getbarbersBySalonId(salonId)

    const salonRating = await getAverageSalonRating(salonId)

    // res.status(200).json({
    //   success: true,
    //   message: 'Salon and barbers found successfully.',
    //   response: {
    //     salonInfo: salonInfo,
    //     barbers: barbers,
    //     salonRating: salonRating
    //   },
    // });
    return SuccessHandler(
      CUSTOMER_DASHBOARD_SUCCESS, 
      SUCCESS_STATUS_CODE, 
      res, 
      { 
          response: {
              salonInfo: salonInfo,
              barbers: barbers,
              salonRating: salonRating
          }
      }
  );
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
    // res.status(200).json({
    //   success: true,
    //   message: "Salons retrieved successsfully",
    //   response: getAllSalons,
    // })
    return SuccessHandler(SALONS_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: getAllSalons });

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

    // return res.status(200).json({
    //   success: true,
    //   message: "Salons retrieved successfully",
    //   response: salons
    // });
    return SuccessHandler(SALONS_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: salons });

  }
  catch (error) {
    next(error);
  }
}