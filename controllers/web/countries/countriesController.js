import {City} from "country-state-city"
import { findAllCountries, findCountryNameByQuery, getCountryByCountryCode } from "../../../services/web/countries/countryService.js";
import { getCurrencySymbol } from "../../../utils/currencySymbolMap/currencysymbolmap.js";



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
            res.status(400).json({
                success: false,
                message: "No countries found",
            });
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

            res.status(200).json({
                success: true,
                message: "Countries retrieved successfully",
                response: countries
            });
        }
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET ALL TIMEZONES ============================
export const getAllTimeZonesByCountry = async (req, res, next) => {
    try {
        const { countryCode } = req.query;
        if (!countryCode) {
            res.status(400).json({
                success: false,
                message: "Please choose a Country first"
            });
        }
        const country = await getCountryByCountryCode(countryCode);

        // Extract timeZones array from the country
        const timeZones = country.timeZones;
        // Extract unique gmtOffsetName values using Set
        const uniqueGmtOffsetNames = new Set(timeZones.map(zone => zone.gmtOffsetName));


        res.status(200).json({
            success: true,
            message: "Time zones retrieved successfully",
            response: Array.from(uniqueGmtOffsetNames)
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET ALL CITIES =======================================
export const getAllCitiesByCountryCode = async (req, res, next) => {
    try {
        const { countryCode, cityName } = req.query;

        // Validate input
        if (!countryCode) {
            return res.status(400).json({
                success: false,
                message: "Please choose a Country first"
            });
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
            return res.status(201).json({
                success: false,
                message: "No cities found",
            });
        }

        // Return the list of cities
        res.status(200).json({
            success: true,
            message: "All cities retrieved successfully",
            response: retrievedCities
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
}