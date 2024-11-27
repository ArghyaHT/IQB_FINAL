import { findAdminByEmailandRole } from "../../../services/web/admin/adminService.js";
import { addMoreSalonImages, allSalonServices, allSalons, createSalonId, deleteSalonImage, findSalonBySalonIdAndAdmin, findSalonLogoById, findSalonProfileById, findSalonsByLocation, getSalonsByNameAndCity, salonInfoDetails, salonOnlineStatus, saveSalon, toDeleteSalon, updateSalon, updateSalonImage, uploadSalonImages, updatedSalonLogo, getSalonLogoBySalonId, deletedSalonLogo, uploadedSalonLogo, findSalonBySalonNameOrEmail, findSalonBySalonId, getSalonGallery, getSalonBySalonId } from "../../../services/web/admin/salonService.js";
import { createSalonSettings } from "../../../services/web/salonSettings/salonSettingsService.js";
import { v4 as uuidv4 } from 'uuid';
import libphonenumber from 'google-libphonenumber';

//Upload Images
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { changeBarberStatusAtSalonOffline, getbarbersBySalonId } from "../../../services/web/barber/barberService.js";
import { getAverageSalonRating } from "../../../services/web/ratings/ratingsService.js";
import { validateEmail } from "../../../middlewares/validator.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { ADMIN_NOT_EXIST_ERROR, EMAIL_NOT_FOUND_ERROR, IMAGE_FILE_EXTENSION_ERROR, IMAGE_FILE_SIZE_ERROR, INVALID_EMAIL_ERROR } from "../../../constants/web/adminConstants.js";
import { SALON_ADDRESS_ERROR, SALON_BARBERS_FOUND_SUCCESS, SALON_CITY_ERROR, SALON_CONNECT_SUCCESS, SALON_CONTACT_TEL_ERROR, SALON_COORDINATES_ERROR, SALON_COUNTRY_ERROR, SALON_CREATE_SUCCESS, SALON_DELETE_SUCCESS, SALON_DESC_ERROR, SALON_DESCRIPTION_EMPTY_SUCCESS, SALON_DESCRIPTION_RETRIEVED_SUCCESS, SALON_DESCRIPTION_UPDATE_SUCCESS, SALON_EMAIL_NOT_PRESENT_ERROR, SALON_EXISTS_ERROR, SALON_GALLERY_DELETE_ERROR, SALON_GALLERY_EMPTY_ERROR, SALON_GALLERY_NOT_FOUND_ERROR, SALON_GALLERY_UPLOADED_ERROR, SALON_IMAGE_DELETE_SUCESS, SALON_IMAGE_RETRIEVED_SUCESS, SALON_IMAGES_UPLOAD_SUCESS, SALON_INVALID_EMAIL_ERROR, SALON_LOGO_DELETE_ERROR, SALON_LOGO_NOT_FOUND_ERROR, SALON_LOGO_UPLOAD_SUCCESS, SALON_NAME_ERROR, SALON_NOT_FOUND_ERROR, SALON_OFFLINE_SUCCESS, SALON_ONLINE_SUCCESS, SALON_POSTCODE_ERROR, SALON_SERVICES_ERROR, SALON_SERVICES_RETRIEVED_SUCESS, SALON_TIMEZONE_ERROR, SALON_UPDATE_SUCCESS, SALONID_EMPTY_ERROR, SALONS_RETRIEVED_SUCESS } from "../../../constants/web/SalonConstants.js";
import {ErrorHandler} from "../../../middlewares/ErrorHandler.js"
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";


//DESC:CREATE SALON BY ADMIN============================
export const createSalonByAdmin = async (req, res, next) => {
  let {
    salonName,
    salonLogo,
    salonType,
    address,
    city,
    location,
    country,
    timeZone,
    salonDesc,
    countryCode,
    postCode,
    contactTel,
    webLink,
    salonEmail,
    fbLink,
    twitterLink,
    instraLink,
    tiktokLink,
    services,
    adminEmail
  } = req.body

  try {

    if (!salonEmail) {
      return ErrorHandler(SALON_EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    // Validate email format
    if (!validateEmail(salonEmail)) {
      return ErrorHandler(SALON_INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!salonName) {
      return ErrorHandler(SALON_NAME_ERROR, ERROR_STATUS_CODE, res)
    }


    if (salonName && (salonName.length < 1 || salonName.length > 40)) {
      return ErrorHandler(SALON_NAME_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!country) {
      return ErrorHandler(SALON_COUNTRY_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!city) {
      return ErrorHandler(SALON_CITY_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!timeZone) {
      return ErrorHandler(SALON_TIMEZONE_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!contactTel) {
      return ErrorHandler(SALON_CONTACT_TEL_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!address && address.length > 100) {
      return ErrorHandler(SALON_ADDRESS_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!location || !location.coordinates || location.coordinates.latitude === null || location.coordinates.longitude === null) {
      return ErrorHandler(SALON_COORDINATES_ERROR, ERROR_STATUS_CODE, res)
    }




    // Convert mobile number to string only if it's a number
    let contactTelStr = typeof contactTel === 'number' ? contactTel.toString() : contactTel;

    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

    const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

    // Parse the mobile number, specifying the region code
    const phoneNumberProto = phoneUtil.parse(contactTelStr, regionCode);

    // Check if the parsed phone number is valid
    const isValid = phoneUtil.isValidNumber(phoneNumberProto);

    if (!isValid) {
      return ErrorHandler(SALON_CONTACT_TEL_ERROR, ERROR_STATUS_CODE, res)
    }

    // Get the national significant number (i.e., without the country code)
    const nationalNumber = phoneNumberProto.getNationalNumber();

    // Convert formatted number back to a number for storage
    const formattedNumberAsNumber = parseInt(nationalNumber);

    // Validate the format and length of the contactTel
    if (postCode && !/^\d{1,8}$/.test(postCode)) {
      return ErrorHandler(SALON_POSTCODE_ERROR, ERROR_STATUS_CODE, res)
    }

    // Check if services array is empty
    if (!services || services.length === 0) {
      return ErrorHandler(SALON_SERVICES_ERROR, ERROR_STATUS_CODE, res)
    }

    if (salonDesc && salonDesc.length > 50) {
      return ErrorHandler(SALON_DESC_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!adminEmail) {
      return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
    }

    // Validate email format
    if (!validateEmail(adminEmail)) {
      return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
    }


    //Find the Salon If exits 
    const existingSalon = await findSalonBySalonNameOrEmail(salonName, salonEmail)


    if (existingSalon) {
      return ErrorHandler(SALON_EXISTS_ERROR, ERROR_STATUS_CODE, res)
    }


    const salonId = await createSalonId();

    const firstTwoLetters = salonName.slice(0, 2).toUpperCase();
    // const secondTwoLetters = admin.FirstName.slice(0, 2).toUpperCase();

    const salonCode = firstTwoLetters + salonId;

    const servicesData = services.map((s, i) => ({

      //Service desc 50 characters needed
      serviceId: `${salonId}${i + 1}`,
      serviceCode: `${s.serviceName.slice(0, 2).toUpperCase()}${salonId}${i + 1}`,
      serviceName: s.serviceName,
      serviceIcon: {
        public_id: s.serviceIcon.public_id,
        url: s.serviceIcon.url,
      },
      serviceDesc: s.serviceDesc,
      servicePrice: s.servicePrice,
      serviceEWT: s.serviceEWT,
      vipService: s.vipService

    }));

    //Save the Salon
    const salonData = {
      adminEmail,
      salonName,
      salonCode,
      salonLogo,
      salonType,
      address,
      timeZone,
      salonDesc,
      city,
      location,
      country,
      countryCode,
      postCode,
      contactTel: formattedNumberAsNumber,
      tiktokLink,
      webLink,
      fbLink,
      salonEmail,
      twitterLink,
      instraLink,
      servicesData
    };

    const savedSalon = await saveSalon(salonId, salonData);

    const admin = await findAdminByEmailandRole(adminEmail);

    if (admin) {
      admin.registeredSalons.push(savedSalon.salonId); // Assuming salonId is the unique identifier for salons
      admin.salonId = savedSalon.salonId; // Update the salonId of the admin
      await admin.save();
    }
    else {
      return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
    }

    return SuccessHandler(SALON_CREATE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: savedSalon }) 

  }
  catch (error) {
    next(error);
  }
}

//Update Salon By Admin
export const updateSalonBySalonIdAndAdminEmail = async (req, res, next) => {

  try {
    let {
      salonName,
      salonLogo,
      salonId,
      adminEmail,
      address,
      salonDesc,
      salonType,
      contactTel,
      countryCode,
      webLink,
      fbLink,
      twitterLink,
      instraLink,
      tiktokLink,
      services,
    } = req.body


    // Check if required fields are missing or empty
    if (!salonId) {
      return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!services || services.length === 0) {
      return ErrorHandler(SALON_SERVICES_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!adminEmail) {
      return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
    }


    // Validate email format
    if (!validateEmail(adminEmail)) {
      return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!address && address.length > 100) {
      return ErrorHandler(SALON_ADDRESS_ERROR, ERROR_STATUS_CODE, res)
    }

    if (salonDesc && salonDesc.length > 150) {
      return ErrorHandler(SALON_DESC_ERROR, ERROR_STATUS_CODE, res)
    }

    // Convert mobile number to string only if it's a number
    let contactTelStr = typeof contactTel === 'number' ? contactTel.toString() : contactTel;

    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

    const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

    // console.log(regionCode)

    // Parse the mobile number, specifying the region code
    const phoneNumberProto = phoneUtil.parse(contactTelStr, regionCode);

    // Check if the parsed phone number is valid
    const isValid = phoneUtil.isValidNumber(phoneNumberProto);

    if (!isValid) {
      return ErrorHandler(SALON_CONTACT_TEL_ERROR, ERROR_STATUS_CODE, res)
    }

    // Get the national significant number (i.e., without the country code)
    const nationalNumber = phoneNumberProto.getNationalNumber();

    // Convert formatted number back to a number for storage
    const formattedNumberAsNumber = parseInt(nationalNumber);

    const salon = await findSalonBySalonIdAndAdmin(salonId, adminEmail)

    if (!salon) {
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
    }

    if (services && Array.isArray(services)) {

      salon.services = salon.services.filter((existingService) =>
        services.some((s) => s.serviceId === existingService.serviceId)
      );

      
      // If services are provided, update the services
      const updatedServices = salon.services.map((existingService, i) => {
        const matchingService = services.find((s) => s.serviceId === existingService.serviceId);

        if (matchingService) {
          return {
            ...existingService,
            serviceId: matchingService.serviceId,
            serviceCode: `${matchingService.serviceName.slice(0, 2).toUpperCase()}${matchingService.serviceId}`,
            serviceName: matchingService.serviceName,
            serviceIcon: {
              public_id: matchingService.serviceIcon.public_id,
              url: matchingService.serviceIcon.url,
            },
            serviceDesc: matchingService.serviceDesc,
            servicePrice: matchingService.servicePrice,
            serviceEWT: matchingService.serviceEWT,
            vipService: matchingService.vipService
          };
        }
        return existingService; // Keep the existing service unchanged
      });

      // Extract existing services from the salon document
      const existingServices = salon.services.sort((a, b) => a.serviceId - b.serviceId);


      let lastServiceId = existingServices.length ? existingServices[existingServices.length - 1].serviceId : 0;

      // Loop through each new service
      services.forEach((newService) => {
        const existingService = existingServices.find((s) => s.serviceId === newService.serviceId);

        // If the service doesn't exist or serviceId is 0, we create a new serviceId and serviceCode
        if (!existingService) {
          // If serviceId is 0, generate a unique serviceId using the salonId and incremented value
          const newServiceId = newService.serviceId === 0
            ? `${lastServiceId + 1}`  // Combine salonId and incremented value
            : newService.serviceId; // Use the provided serviceId if it's not 0

          // Update lastServiceId for the next iteration to increment properly
          if (newService.serviceId === 0) {
            lastServiceId++;
          }

          // Generate serviceCode based on the new serviceName and new serviceId
          const newServiceCode = newService.serviceId === 0
            ? `${newService.serviceName.slice(0, 2).toUpperCase()}${lastServiceId}`
            : newService.serviceCode; // Use the provided serviceCode if it's not 0

          // Push the new service with the generated serviceId and serviceCode
          updatedServices.push({
            ...newService,
            serviceId: newServiceId,
            serviceCode: newServiceCode,
          });
        }
      });

      // Assign the updated services back to the salon object
      salon.services = updatedServices;
    }



    let updateFields = {
      salonName,
      salonLogo,
      salonId,
      adminEmail,
      address,
      salonDesc,
      salonType,
      contactTel: formattedNumberAsNumber,
      mobileCountryCode: countryCode,
      webLink,
      fbLink,
      twitterLink,
      instraLink,
      tiktokLink,
      services: salon.services,
    }

    const updatedSalon = await updateSalon(salonId, adminEmail, updateFields)

    // return res.status(200).json({
    //   success: true,
    //   message: "Salon Updated",
    //   response: updatedSalon
    // });
    return SuccessHandler(SALON_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: updatedSalon }) 

  }
  catch (error) {
    next(error);
  }
}

//DESC:UPLOAD SALON IMAGES============================
export const uploadSalonGalleryImages = async (req, res, next) => {
  try {
    let galleries = req.files.gallery;
    let salonId = req.body.salonId;

    if (galleries === null || galleries === undefined) {
      return ErrorHandler(SALON_GALLERY_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', "svg"];
    const maxFileSize = 2 * 1024 * 1024;

    // Ensure that profiles is an array, even for single uploads
    if (!Array.isArray(galleries)) {
      galleries = [galleries];
    }

    // Validate each image
    for (const gallery of galleries) {
      const extension = path.extname(gallery.name).toLowerCase().slice(1);
      if (!allowedExtensions.includes(extension)) {
        return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res)
      }

      if (gallery.size > maxFileSize) {
        return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
      }
    }

    // Maximum total image size should be 10mb .

    const uploadPromises = galleries.map(gallery => {
      return new Promise((resolve, reject) => {

        const public_id = `${gallery.name.split(".")[0]}_${uuidv4()}`;
        const folderPath = `salon-gallery/salon-${salonId}`


        cloudinary.uploader.upload(gallery.tempFilePath, {
          public_id: public_id,
          folder: folderPath,
        })
          .then((image) => {
            resolve({
              public_id: image.public_id,
              url: image.secure_url,
            });
          })
          .catch((err) => {
            reject(err);
          })
          .finally(() => {
            fs.unlink(gallery.tempFilePath, (unlinkError) => {
              if (unlinkError) {
                console.error('Failed to delete temporary file:', unlinkError);
              }
            });
          });
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    const updatedSalon = await uploadSalonImages(salonId, uploadedImages)

    // Filter the updated gallery to only include the newly uploaded images
    const newImages = updatedSalon.gallery.filter(image =>
      uploadedImages.some(uploaded => uploaded.public_id === image.public_id)
    );

    if (!updatedSalon) {
      // return res.status(404).json({ success: false, message: "Images cant be uploaded" });
      return ErrorHandler(SALON_GALLERY_UPLOADED_ERROR, ERROR_STATUS_CODE, res)
    }

    // res.status(200).json({
    //   success: true,
    //   message: "Salon images uploaded successfully",
    //   response: newImages,
    // });

    return SuccessHandler(SALON_IMAGES_UPLOAD_SUCESS, SUCCESS_STATUS_CODE, res, { response: newImages }) 
  } catch (error) {
    next(error);
  }
}

//DESC:ADD MORE SALON IMAGES============================
export const uploadMoreSalonGalleryImages = async (req, res, next) => {
  try {
    let galleries = req.files.gallery;
    let salonId = req.body.salonId;

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', "svg"];
    const maxFileSize = 2 * 1024 * 1024;

    // Ensure that profiles is an array, even for single uploads
    if (!Array.isArray(galleries)) {
      galleries = [galleries];
    }

    // Validate each image
    for (const gallery of galleries) {
      const extension = path.extname(gallery.name).toLowerCase().slice(1);
      if (!allowedExtensions.includes(extension)) {
        return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res)
      }

      if (gallery.size > maxFileSize) {
        return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
      }
    }



    const uploadPromises = galleries.map(gallery => {
      return new Promise((resolve, reject) => {

        const public_id = `${gallery.name.split(".")[0]}`;
        const folderPath = `salon-gallery/salon-${salonId}`


        cloudinary.uploader.upload(gallery.tempFilePath, {
          public_id: public_id,
          folder: folderPath,
        })
          .then((image) => {
            resolve({
              public_id: image.public_id,
              url: image.secure_url,
            });
          })
          .catch((err) => {
            reject(err);
          })
          .finally(() => {
            fs.unlink(gallery.tempFilePath, (unlinkError) => {
              if (unlinkError) {
                console.error('Failed to delete temporary file:', unlinkError);
              }
            });
          });
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    const updatedSalon = await addMoreSalonImages(salonId, uploadedImages)

    if (!updatedSalon) {
      // return res.status(404).json({ success: false, message: "Salon image cant be uploaded" });
      return ErrorHandler(SALON_GALLERY_UPLOADED_ERROR, ERROR_STATUS_CODE, res)
    }

    // res.status(200).json({
    //   success: true,
    //   message: "Salon Images uploaded successfully",
    //   response: updatedSalon,
    // });
    return SuccessHandler(SALON_IMAGES_UPLOAD_SUCESS, SUCCESS_STATUS_CODE, res, { response: updatedSalon }) 
  } catch (error) {
    next(error);
  }
};


//DESC:UPDATE SALON IMAGES============================
export const updateSalonImages = async (req, res, next) => {
  try {
    const id = req.body.id;
    const public_imgid = req.body.public_imgid;
    const gallery = req.files.gallery;
    const salonId = req.body.salonId

    const salonProfile = await findSalonProfileById(id)

    // Validate Image
    const maxFileSize = 2 * 1024 * 1024;
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', "svg"];
    const fileExt = gallery.name.split(".")[1];

    if (maxFileSize > 2048) {
      return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!allowedExtensions.includes(fileExt)) {
      return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
    }

    // Generate a unique public_id based on the original file name
    const public_id = `${gallery.name.split(".")[0]}_${uuidv4()}`;
    const folderPath = `salon-gallery/salon-${salonId}`

    cloudinary.uploader.upload(gallery.tempFilePath, {
      public_id: public_id,
      folder: folderPath,
    })
      .then(async (image) => {

        const result = await cloudinary.uploader.destroy(public_imgid);

        if (result.result === 'ok') {
          console.log("cloud img deleted")

        } else {
          return ErrorHandler(SALON_GALLERY_DELETE_ERROR, ERROR_STATUS_CODE, res)
        }

        // Delete the temporary file after uploading to Cloudinary
        fs.unlink(gallery.tempFilePath, (err) => {
          if (err) {
            console.error(err);
          }
        });

        const updatedSalon = await updateSalonImage(id, image)


        // Find the newly added advertisement
        const updatedSalonImage = updatedSalon.gallery.find(si => si.public_id === image.public_id);

        // res.status(200).json({
        //   success: true,
        //   message: "Salon images updated successfully",
        //   response: updatedSalonImage
        // });
        return SuccessHandler(SALON_IMAGES_UPLOAD_SUCESS, SUCCESS_STATUS_CODE, res, { response: updatedSalonImage }) 
      })
  } catch (error) {
    next(error);
  }
}

//DESC:DELETE SALON IMAGES============================
export const deleteSalonImages = async (req, res, next) => {
  try {
    const public_id = req.body.public_id
    const img_id = req.body.img_id

    const { updatedSalon, deletedImage } = await deleteSalonImage(img_id);

    const result = await cloudinary.uploader.destroy(public_id);


    if (result.result !== 'ok') {
      // return res.status(404).json({
      //   success: false,
      //   message: 'Failed to delete salon image'
      // });
      return ErrorHandler(SALON_GALLERY_DELETE_ERROR, ERROR_STATUS_CODE, res)
    }

    if (updatedSalon) {
      // res.status(200).json({
      //   success: true,
      //   message: "Salon image deleted successfully",
      //   response: deletedImage
      // })
      return SuccessHandler(SALON_IMAGE_DELETE_SUCESS, SUCCESS_STATUS_CODE, res, { response: deletedImage }) 
    } else {
      // res.status(404).json({
      //   success: false,
      //   message: 'Image not found.'
      // });
      return ErrorHandler(SALON_GALLERY_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)

    }

  } catch (error) {
    next(error);
  }
}

export const getSalonImages = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    // Check if salonId is provided in the request body
    if (!salonId) {
      return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    }
    // Check if salonId exists in the database
    const salonExists = await getSalonBySalonId(salonId)

    if (!salonExists) {
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)    }
    const salongallery = await getSalonGallery(salonId);

    if (!salongallery) {
      // return res.status(201).json({
      //   success: false,
      //   message: "Salon not found"
      // });
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res) 
    }
    // Sort advertisements array in descending order
    const sortedSalonGallery = salongallery.gallery.reverse();

    // res.status(200).json({
    //   success: true,
    //   message: 'Salon images retrieved successfully',
    //   response: sortedSalonGallery
    // });
    return SuccessHandler(SALON_IMAGE_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: sortedSalonGallery }) 

  } catch (error) {
    next(error);
  }
}

//DESC:GET ALL SALONS =====================
export const getAllSalons = async (req, res, next) => {
  try {
    const salons = await allSalons(); // Retrieve all salons from the database


    // res.status(200).json({
    //   success: true,
    //   response: salons
    // });
    return SuccessHandler(SALONS_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: salons }) 

  } catch (error) {
    next(error);
  }
}

//DESC:SEARCH SALONS BY LOCATION =====================
export const getSalonsByLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.query;
    let salons = [];
    salons = await findSalonsByLocation(longitude, latitude)

    //  // Populate salonRatings field
    //  await getSalonRating(salons);

    // return res.status(200).json({
    //   success: true,
    //   message: "Salons retrieved successfully",
    //   response: salons
    // });
    return SuccessHandler(SALONS_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: salons }) 

  }
  catch (error) {
    next(error);
  }
}


//DESC:GET ALL SALON SERVICES ======================
export const getAllSalonServices = async (req, res, next) => {
  try {

    const { salonId } = req.query;

    if(salonId === 0){
      // res.status(400).json({
      //   success: false,
      //   message: "Salon not found",
      // })
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res) 

    }

    const salonServices = await allSalonServices(salonId)

    // res.status(200).json({
    //   success: true,
    //   message: "Salon services retrieved successfully.",
    //   response: salonServices
    // })

    return SuccessHandler(SALON_SERVICES_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: salonServices }) 
  }
  catch (error) {
    next(error);
  }
}

//DESC:SEARCH SALONS BY NAME AND CITY =================
export const searchSalonsByNameAndCity = async (req, res, next) => {
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

    const getAllSalons = await getSalonsByNameAndCity(query, sortOptions, limit);
    // res.status(200).json({
    //   success: true,
    //   message: "All Salons fetched successfully",
    //   getAllSalons,
    // })

    return SuccessHandler(SALONS_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { getAllSalons }) 

  } catch (error) {
    next(error);
  }
}

//DESC:DELETE SALON=================
export const deleteSalon = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    const deletedSalon = await toDeleteSalon(salonId)

    if (!deletedSalon) {
      // res.status(404).json({
      //   success: true,
      //   message: "The Salon with the SalonId not found",
      // })
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res) 

    }

    // res.status(200).json({
    //   success: true,
    //   message: "The Salon has been deleted",
    //   response: deletedSalon
    // })
    return SuccessHandler(SALON_DELETE_SUCCESS, SUCCESS_STATUS_CODE, res, { response:deletedSalon }) 

  }
  catch (error) {
    next(error);
  }
}

//DESC:CHANGE SALON ONLINE STATUS=================
export const changeSalonOnlineStatus = async (req, res, next) => {

  try {
    const { salonId, isOnline } = req.body;

    const updatedSalon = await salonOnlineStatus(salonId, isOnline)

    if (!updatedSalon) {
      // return res.status(404).json({
      //   success: false,
      //   message: "Salon not found"
      // });
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res) 

    }
    if (isOnline === true) {
      // return res.status(200).json({ success: true, message: "The salon is currently online.", response: updatedSalon });
      return SuccessHandler(SALON_ONLINE_SUCCESS, SUCCESS_STATUS_CODE, res, { response:updatedSalon }) 

    }
    else {

      updatedSalon.mobileBookingAvailability = false;

      await updatedSalon.save();

      await changeBarberStatusAtSalonOffline(salonId);

      // return res.status(200).json({ success: true, message: "The salon is currently offline.", response: updatedSalon });

      return SuccessHandler(SALON_OFFLINE_SUCCESS, SUCCESS_STATUS_CODE, res, { response:updatedSalon })     }
  } catch (error) {
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
      // res.status(404).json({
      //   success: false,
      //   message: 'No salons found for the particular SalonId.',
      // });
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res) 

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

    return SuccessHandler(SALON_BARBERS_FOUND_SUCCESS, SUCCESS_STATUS_CODE, res, {
      response: {
          salonInfo: salonInfo,
          barbers: barbers,
          salonRating: salonRating,
      },
  });
  } catch (error) {
    next(error);
  }
}

//DESC:UPLOAD SALON LOGO ==================
export const uploadSalonLogo = async (req, res, next) => {
  try {
    const salonLogo = req.files.salonLogo;
    const salonId = req.body.salonId;

    if (!salonLogo) {
      return ErrorHandler(SALON_LOGO_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res) 
    }

    // Allowed file extensions
    const allowedExtensions = ["jpg", "png", "jfif", "svg", "jpeg", "webp"];
    // Maximum file size in bytes (e.g., 2MB)
    const maxFileSize = 2 * 1024 * 1024;

    // Ensure that salonLogo is an array, even for single uploads
    const salonLogos = Array.isArray(salonLogo) ? salonLogo : [salonLogo];

    // Find the existing salon by ID
    const existingSalon = await findSalonBySalonId(salonId);

    // Validate the new logos before anything else
    const uploadPromises = salonLogos.map((logo) => {
      // Get file extension and check if it's allowed
      const extension = path.extname(logo.name).toLowerCase().slice(1);
      if (!allowedExtensions.includes(extension)) {
        return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res) 
      }

      // Check file size
      if (logo.size > maxFileSize) {
        return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res) 
      }

      return null; // All checks passed, so continue processing
    });

    // If any validation fails, it will return a response early.
    const invalidFile = uploadPromises.find((p) => p !== null);
    if (invalidFile) return invalidFile;

    // Check and delete the existing logo if it exists and is valid
    if (existingSalon && existingSalon.salonLogo && Array.isArray(existingSalon.salonLogo) && existingSalon.salonLogo.length > 0) {
      const oldLogo = existingSalon.salonLogo[0]; // Ensure we are getting the correct logo object
      if (oldLogo && oldLogo.public_id) { // Check if oldLogo is not null and has public_id
          // console.log('Deleting old logo with public_id:', oldLogo.public_id);
          const result = await cloudinary.uploader.destroy(oldLogo.public_id);
          // console.log('Deletion result:', result);

          if (result.result !== 'ok') {
            return ErrorHandler(SALON_LOGO_DELETE_ERROR, ERROR_STATUS_CODE, res)           }
      } else {
        console.log('No valid logo found or missing public_id for deletion');
      }
    } else {
      console.log('No existing salon logo or salonLogo array is empty');
    }

    // Upload new logo(s) to Cloudinary
    const uploadedLogos = await Promise.all(
      salonLogos.map((logo) => {
        const public_id = `${logo.name.split('.')[0]}_${uuidv4()}`;
        const folderPath = `salon-logos`;

        return cloudinary.uploader.upload(logo.tempFilePath, {
          public_id,
          folder: folderPath,
        }).then((image) => {
          // Delete the temporary file after uploading
          fs.unlink(logo.tempFilePath, (unlinkError) => {
            if (unlinkError) {
              console.error('Failed to delete temporary file:', unlinkError);
            }
          });
          return { public_id: image.public_id, url: image.secure_url };
        });
      })
    );

    // Update the salon document with the new logo details
    const updatedSalon = await uploadedSalonLogo(salonId, uploadedLogos);

    // res.status(200).json({
    //   success: true,
    //   message: "Salon logo uploaded successfully",
    //   response: updatedSalon
    // });

    return SuccessHandler(SALON_LOGO_UPLOAD_SUCCESS, SUCCESS_STATUS_CODE, res, { response:updatedSalon }) 
  } catch (error) {
    next(error);
  }
};

//DESC:UPDATE SALON LOGO ==================
export const updateSalonLogo = async (req, res, next) => {
  try {
    const { salonId, id, public_imgid } = req.body;
    const salonLogo = req.files.salonLogo;

    // Validate Image
    const fileSize = salonLogo.size / 1000;
    const fileExt = salonLogo.name.split('.').pop().toLowerCase();

    if (fileSize > 2048) {
      return res.status(400).json({ success: false, message: "File size must be lower than 2mb" });
    }

    if (!['jpg', 'png', 'jfif', 'svg', 'jpeg', "webp"].includes(fileExt)) {
      return res.status(400).json({ success: false, message: "File extension must be jpg, png, jfif, svg, or jpeg" });
    }

    // Generate a unique public_id based on the original file name and a unique identifier
    const public_id = `${salonLogo.name.split('.')[0]}_${uuidv4()}`;
    const folderPath = `salon-logos/salon-${salonId}`;

    // Upload the new logo to Cloudinary
    const image = await cloudinary.uploader.upload(salonLogo.tempFilePath, {
      public_id: public_id,
      folder: folderPath,
    });

    // Delete the temporary file after uploading to Cloudinary
    fs.unlink(salonLogo.tempFilePath, (err) => {
      if (err) {
        console.error(err);
      }
    });

    if (!public_imgid && !id) {
      // If no public_imgid or id, upload new logo
      const updatedSalon = await uploadedSalonLogo(salonId, image);
      res.status(200).json({
        success: true,
        message: "Logo uploaded successfully",
        response: updatedSalon
      });
    } else {
      // If public_imgid and id are provided, update existing logo
      const result = await cloudinary.uploader.destroy(public_imgid);

      if (result.result !== 'ok') {
        return res.status(500).json({ success: false, message: 'Failed to delete old image.' });
      }

      const updatedSalon = await updatedSalonLogo(salonId, id, image);
      res.status(200).json({
        success: true,
        message: "Logo updated successfully",
        response: updatedSalon
      });
    }
  } catch (error) {
    next(error);
  }
};

//DESC:GET SALON LOGO ==================
export const getSalonLogo = async (req, res, next) => {
  try {
    const salonId = req.body.salonId; // Assuming you pass salonId as a route parameter


    if (!salonId) {
      // return res.status(404).json({ success: false, message: 'SalonId is not present' });
      return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res) 
    }

    // Find the salonlogo in the database
    const salonlogo = await getSalonLogoBySalonId(salonId)


    // // Send the salon logo information in the response
    // return res.status(200).json({
    //   success: true,
    //   message: "Salon logo retrieved",
    //   response: salonlogo
    // });
    return SuccessHandler(SALON_LOGO_UPLOAD_SUCCESS, SUCCESS_STATUS_CODE, res, { response:salonlogo }) 

  } catch (error) {
    next(error);
  }
};

//DESC:DELETE SALON LOGO ==================
export const deleteSalonLogo = async (req, res) => {
  try {
    const salonId = req.body.salonId;
    const public_id = req.body.public_id
    const img_id = req.body.img_id

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      console.log("cloud img deleted")

    } else {
      res.status(500).json({ message: 'Failed to delete image.' });
    }

    const updatedSalon = await deletedSalonLogo(salonId, img_id)

    if (updatedSalon) {
      res.status(200).json({
        success: true,
        message: "Image successfully deleted"
      })
    } else {
      res.status(404).json({ message: 'Image not found in the Salon Logo' });
    }

  } catch (error) {
    next(error);
  }
};



//DESC:UPDATE THE SALON INFO =================
export const updateSalonInfo = async (req, res, next) => {
  try {
    const { salonId, salonDesc } = req.body;

    // Find the existing salon by ID
    const salon = await getSalonBySalonId(salonId);

    if (!salon) {
      // return res.status(404).json({
      //   success: false,
      //   message: 'Salon not found or salon is not online',
      // });
      return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
    }

    // Update the salon description
    salon.salonDesc = salonDesc;

    // Save the updated salon information
    const updatedSalon = await salon.save();

    // // Send the response
    // res.status(200).json({
    //   success: true,
    //   message: 'Salon information updated successfully',
    //   response: updatedSalon.salonDesc,
    // });

    return SuccessHandler(SALON_DESCRIPTION_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, { response:updatedSalon.salonDesc }) 

  } catch (error) {
    next(error);
  }
}

export const getSalonInfoBySalonId = async (req, res, next) => {
  try {

    const salonId = req.body.salonId;

    if (!salonId) {
      return ErrorHandler(SALONID_EMPTY_ERROR, ERROR_STATUS_CODE, res)
    }

    if (salonId === 0) {
      // // Send the response
      // res.status(200).json({
      //   success: true,
      //   message: 'Need to connect to salon first.'
      // });
      return SuccessHandler(SALON_CONNECT_SUCCESS, SUCCESS_STATUS_CODE, res) 

    } else {
      // Find the existing salon by ID
      const salon = await getSalonBySalonId(salonId);

      if (salon.salonDesc === "") {
        // Send the response
        // res.status(200).json({
        //   success: true,
        //   message: 'No salon info present',
        //   response: "",
        // });
        return SuccessHandler(SALON_DESCRIPTION_EMPTY_SUCCESS, SUCCESS_STATUS_CODE, res, { response:"" } ) 

      }
      // // Send the response
      // res.status(200).json({
      //   success: true,
      //   message: 'Salon information retrieved successfully',
      //   response: salon.salonDesc,
      // });
      return SuccessHandler(SALON_DESCRIPTION_RETRIEVED_SUCCESS, SUCCESS_STATUS_CODE, res, { response:salon.salonDesc } )
    }
  } catch (error) {
    next(error);
  }
}

// //SEARCH SALONS BY LOCATION
// export const getSalonsByLocation = async (req, res, next) => {

//   try {
//     const { longitude, latitude } = req.query;
//     let salons = [];
//     salons = await searchSalonsByLocation(longitude, latitude)

//      // Populate salonRatings field
//      await getSalonRating(salons);

//     return res.status(200).json({
//       success: true,
//       message: "Salons retrieved successfully",
//       response: salons
//     });
//   }
//   catch (error) {
//     //console.log(error);
//     next(error);
//   }
// }