import { City } from "country-state-city"
import { findAllCountries, findCountryNameByQuery, getCountryByCountryCode } from "../../../services/web/countries/countryService.js";
import { getCurrencySymbol } from "../../../utils/currencySymbolMap/currencysymbolmap.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { ALL_CITIES_SUCCESS, ALL_COUNTRIES_SUCCESS, ALL_TIMEZONES_SUCCESS, CITY_NOT_FOUND_ERROR, COUNTRY_NOT_FOUND_ERROR, COUNTRY_NOT_SELECT_ERROR } from "../../../constants/web/CountriesConstants.js";

//DESC:GET ALL COUNTRIES ===========================
export const getAllCountries = async (req, res, next) => {
    try {
        const { name } = req.query;

        let query = {};
        let countries;

        // Check if query parameters exist in the request
        if (name === undefined || name === null || name === "" || name === "undefined" || name === "null") {
            countries = await findAllCountries();
        }
        else {
            query.name = { $regex: new RegExp('^' + name, 'i') }; // Case-insensitive search

            countries = await findCountryNameByQuery(query);
        }
        if (countries.length === 0) {
            return ErrorHandler(COUNTRY_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }
        else {
            // Assuming countries is an array
            countries = await Promise.all(countries.map(async (country) => {
                const currencySymbol = await getCurrencySymbol(country.currency);
                return {
                    ...country.toObject(),
                    currency: currencySymbol
                };
            }));

            return SuccessHandler(ALL_COUNTRIES_SUCCESS, SUCCESS_STATUS_CODE, res, { response: countries })
        }
    }
    catch (error) {
        next(error);
    }
}

//DESC:GET ALL TIMEZONES ============================
export const getAllTimeZonesByCountry = async (req, res, next) => {
    try {
        const { countryCode } = req.query;
        if (!countryCode) {
            return ErrorHandler(COUNTRY_NOT_SELECT_ERROR, ERROR_STATUS_CODE, res)
        }
        const country = await getCountryByCountryCode(countryCode);

        const timeZones = country.timeZones;
        const uniqueGmtOffsetNames = new Set(timeZones.map(zone => zone.gmtOffsetName));

        return SuccessHandler(ALL_TIMEZONES_SUCCESS, SUCCESS_STATUS_CODE, res, { response: Array.from(uniqueGmtOffsetNames) })

    } catch (error) {
        next(error);
    }
}

//DESC:GET ALL CITIES =======================================
export const getAllCitiesByCountryCode = async (req, res, next) => {
    try {
        const { countryCode, cityName } = req.query;

        // Validate input
        if (!countryCode) {
            return ErrorHandler(COUNTRY_NOT_SELECT_ERROR, ERROR_STATUS_CODE, res)
        }

        // Retrieve all cities and filter by country code
        const cities = City.getAllCities().filter(city => city.countryCode === countryCode);
        let retrievedCities;

        // Apply search by city name if provided
        if (cityName) {
            const searchRegExpCityName = new RegExp('^' + cityName + '.*', 'i');
            retrievedCities = cities.filter(city => searchRegExpCityName.test(city.name));
        } else {
            retrievedCities = cities;
        }

        // Check if any cities were found
        if (retrievedCities.length === 0) {
            return ErrorHandler(CITY_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(ALL_CITIES_SUCCESS, SUCCESS_STATUS_CODE, res, { response: retrievedCities })

    } catch (error) {
        next(error);
    }
}