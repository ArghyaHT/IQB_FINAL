import CountryData from '../../models/countryModel.js';

import { Country }  from 'country-state-city';

export const storeCountries = async () => {
    try {
        // Get all countries
        const countries = Country.getAllCountries();

        // Store each country in the database
        for (const country of countries) {
            const newCountry = new CountryData({
                name: country.name,
                countryCode: country.isoCode, // Assuming iso2 is used for isoCode
                // Assuming currency is available under country.currency
                currency: country.currency,
                // Assuming timezones are available under country.timezones
                timeZones: country.timezones.map(timezone => ({
                    zoneName: timezone.zoneName,
                    gmtOffset: timezone.gmtOffset,
                    gmtOffsetName: timezone.gmtOffsetName,
                    abbreviation: timezone.abbreviation,
                    tzName: timezone.tzName,
                }))
            });

            // Save the country document to the database
            await newCountry.save();
        }

        console.log('Countries stored successfully.');
    } catch (error) {
        console.error('Error storing countries:', error);
    } 
};
