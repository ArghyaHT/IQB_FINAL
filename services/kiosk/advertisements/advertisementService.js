import SalonSettings from "../../../models/salonSettingsModel.js"

//GET ADVERTISEMENTS
export const getAdvertisements = async (salonId) => {
    const advertisements = await SalonSettings.findOne({ salonId }).select('advertisements');
    return advertisements;
  }