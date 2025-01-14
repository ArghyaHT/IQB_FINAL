import SalonSettings from "../../../models/salonSettingsModel.js"


//CREATE NEW SALON SETTINGS
export const createSalonSettings = async (salonId, appointmentSettings) => {
  const { startTime, endTime, intervalInMinutes } = appointmentSettings;

  // Create a new SalonSettings instance with generated time slots
  const newSalonSettings = new SalonSettings({
    salonId,
    appointmentSettings: {
      appointmentStartTime: startTime,
      appointmentEndTime: endTime,
      intervalInMinutes: intervalInMinutes,
    },
  });

  // Save the new SalonSettings to the database
  await newSalonSettings.save();
};

//GET SALON SETTINGS
export const getSalonSettings = async (salonId) => {
  const salonSettings = await SalonSettings.findOne({ salonId });
  return salonSettings;
}


//ADD ADVERTISEMENTS
export const addAdvertisement = async (salonId, uploadedImages) => {
  let advertisements = await SalonSettings.findOne({ salonId });

  if (!advertisements) {
    // If no salon settings exist, create a new entry
    advertisements = new SalonSettings({
      salonId,
      advertisements: uploadedImages
    });
    await advertisements.save();
  } else {
    // If salon settings exist, update the advertisements field
    advertisements = await SalonSettings.findOneAndUpdate(
      { salonId },
      { $push: { advertisements: { $each: uploadedImages } } },
      { new: true, projection: { _id: 0, advertisements: 1 } }
    );
  }

  return advertisements;
}

//GET ADVERTISEMENTS
export const getAdvertisements = async (salonId) => {
  const advertisements = await SalonSettings.findOne({ salonId }).select('advertisements');
  return advertisements || [];
}

//UPDATE ADVERTISEMENT 
export const findAdvertismentsById = async(id) => {
  const advertisement = await SalonSettings.findOne({ "advertisements._id": id }, { "advertisements.$": 1 })
  return advertisement;
}

export const updateAdvertisement = async(id, image) => {
  const advertisement = await SalonSettings.findOneAndUpdate(
    { "advertisements._id": id }, 
    { 
      $set: { 
        'advertisements.$.public_id': image.public_id,
        'advertisements.$.url': image.url
      } 
    }, 
    { new: true } 
  );
  return advertisement;
}

//DELETE ADVERTISEMENTS
export const deleteAdvertisement = async(img_id) => {
  const advertisement = await SalonSettings.findOne({ 'advertisements._id': img_id });

  const image = advertisement.advertisements.id(img_id);
  
  // Remove the image
  await SalonSettings.updateOne(
    { 'advertisements._id': img_id },
    { $pull: { advertisements: { _id: img_id } } },
  );
  
  return { updatedSalonSettings: advertisement, deletedImage: image };

}

//GET SALON SETTINGS
export const findSalonSetingsBySalonId = async(salonId) => {
  const salonSettings = await SalonSettings.findOne({ salonId });
  return salonSettings
}


export const saveNewSalonSettings = async (salonId, startTime, endTime, intervalInMinutes,salonOffDays,appointmentAdvanceDays) => {
  const salonSettings = await SalonSettings.create({
      salonId,
      appointmentSettings: {
          appointmentStartTime: startTime,
          appointmentEndTime: endTime,
          intervalInMinutes: intervalInMinutes,
      },
      // salonOffDays: salonOffDays,
      appointmentAdvanceDays: appointmentAdvanceDays
  });
  await salonSettings.save();
  
  return salonSettings;
};

export const setDragAdvertisemnts = async(salonId, advertisements) => {

  // Find the SalonSettings document by salonId
  const salonSettings = await SalonSettings.findOne({ salonId });

     // Update the advertisements field
    salonSettings.advertisements = advertisements;

    // Save the updated document
    const updatedSalonSettings = await salonSettings.save();

    // Return the updated document
    return updatedSalonSettings;
}

export const matchSalonOffDays = async(salonId, day) =>{
  // Find a record where the day matches the appointmentDays array
  const record = await SalonSettings.findOne({
      salonId,
      salonOffDays: { $in: [day] }, 
      });
  return record;
}

