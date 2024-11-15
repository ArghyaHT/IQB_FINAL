import SalonSettings from "../../models/salonSettingsModel.js";

//GET SALON SETTINGS
export const getSalonSettings = async (salonId) => {
    const salonSettings = await SalonSettings.findOne({ salonId });
    return salonSettings;
  }

  //GET ADVERTISEMENTS
export const getAdvertisements = async (salonId) => {
  const advertisements = await SalonSettings.findOne({ salonId }).select('advertisements');
  return advertisements;
}
  