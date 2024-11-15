import Country from "../../../models/countryModel.js";


//DESC:FIND ALL COUNTRIES==========================
export const findAllCountries = async() => {
    const countries = await Country.find();

    return countries;
}

//DESC:FIND COUNTRIES BY NAME QUERY=================
export const findCountryNameByQuery = async(query) => {
    const countries = await Country.find(query)
    return countries
}

//DESC: GET COUNTRY BY COUNTRY CODE======================
export const getCountryByCountryCode = async(countryCode) => {
    const country = await Country.findOne({ countryCode })
    
    return country;
}

export const findCountryByName = async(country) => {
    const countryData = await Country.findOne({ name: country });

    return countryData;
}