import { addAdvertisement, deleteAdvertisement, findAdvertismentsById, getAdvertisements, setDragAdvertisemnts, updateAdvertisement } from "../../../services/web/salonSettings/salonSettingsService.js";
import { dashboardAppointmentList } from "../../../services/web/appointments/appointmentsService.js";
import { v4 as uuidv4 } from 'uuid';

//Upload Profile Picture Config
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { ADVERT_DELETE_SUCCESS, ADVERT_DRAG_SUCCESS, ADVERT_IMAGES_SUCCESS, ADVERT_NOT_FOUND, ADVERT_NOT_PRESENT_ERROR, ADVERT_UPDATE_SUCCESS, ADVERT_UPLOAD_SUCCESS } from "../../../constants/web/DashboardConstants.js";
import { ALLOWED_IMAGE_EXTENSIONS, MAX_FILE_SIZE, TOTAL_IMAGE_SIZE_ERROR, TOTAL_IMAGE_UPLOAD_SIZE } from "../../../constants/web/Common/ImageConstant.js";
import { IMAGE_FILE_EXTENSION_ERROR, IMAGE_FILE_SIZE_ERROR } from "../../../constants/web/adminConstants.js";
import { SALON_NOT_CREATED_ERROR } from "../../../constants/web/SalonConstants.js";

//DESC: ADD ADVERTISEMENTS ====================
export const addAdvertisements = async (req, res, next) => {
  try {
    let advertisements = req.files.advertisements;
    let salonId = req.body.salonId;

    if (advertisements === null || advertisements === undefined) {
      return ErrorHandler(ADVERT_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
    }

    // Ensure that advertisements is an array, even for single uploads
    if (!Array.isArray(advertisements)) {
      advertisements = [advertisements];
    }

    const allowedExtensions = ALLOWED_IMAGE_EXTENSIONS;
    const maxFileSize = MAX_FILE_SIZE;
    
     // Calculate total size
          const totalSize = advertisements.reduce((acc, file) => acc + file.size, 0);
          if (totalSize > 3 * 1024 * 1024) {
            return ErrorHandler(TOTAL_IMAGE_SIZE_ERROR, ERROR_STATUS_CODE, res);
          }

    // Validate each image
    for (const advertisement of advertisements) {
      const extension = path.extname(advertisement.name).toLowerCase().slice(1);
      if (!allowedExtensions.includes(extension)) {
        return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res)
      }

      if (advertisement.size > maxFileSize) {
        return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
      }
    }

    const uploadPromises = advertisements.map(advertisement => {
      return new Promise((resolve, reject) => {

        const timestamp = Date.now();
        const uniqueId = uuidv4(); // Generate a unique identifier
        const public_id = `${advertisement.name.split(".")[0]}_${timestamp}_${uniqueId}`;
        const folderPath = `advertisements/salon-${salonId}`;

        cloudinary.uploader.upload(advertisement.tempFilePath, {
          public_id: public_id,
          folder: folderPath, // Change the folder name as required
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
            fs.unlink(advertisement.tempFilePath, (unlinkError) => {
              if (unlinkError) {
                console.error('Failed to delete temporary file:', unlinkError);
              }
            });
          });
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Update the Salon model with the uploaded advertisement images
    const updatedSalon = await addAdvertisement(salonId, uploadedImages)

    if (!updatedSalon) {
      return res.status(404).json({ success: false, message: "Advertisements can't be uploaded" });
    }

    // Filter the newly added advertisements
    const uploadedAdvertisementIds = uploadedImages.map(img => img.public_id);
    const uploadedAdvertisements = updatedSalon.advertisements.filter(ad => uploadedAdvertisementIds.includes(ad.public_id));

    return SuccessHandler(ADVERT_UPLOAD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: uploadedAdvertisements })

  } catch (error) {
    next(error);
  }
};

//DESC: GET ADVERTISEMENTS ====================
export const getAllAdvertisements = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    if (Number(salonId) === 0) {
      return ErrorHandler(SALON_NOT_CREATED_ERROR, ERROR_STATUS_CODE, res)
    }
    else {
      // Find SalonSettings by salonId and retrieve only the advertisements field
      const allAdvertisements = await getAdvertisements(salonId)

      if (!allAdvertisements) {
        return ErrorHandler(ADVERT_NOT_FOUND, ERROR_STATUS_CODE, res)
      }

      // Sort advertisements array in descending order
      const sortedAdvertisements = allAdvertisements.advertisements;

      return SuccessHandler(ADVERT_IMAGES_SUCCESS, SUCCESS_STATUS_CODE, res, { advertisements: sortedAdvertisements })
    }
  } catch (error) {
    next(error);
  }
}

//DESC: UPDATE ADVERTISEMENTS ====================
export const updateAdvertisements = async (req, res, next) => {
  try {
    const id = req.body.id;
    const public_imgid = req.body.public_imgid;
    const advertisements = req.files.advertisements;
    const salonId = req.body.salonId;

    if (advertisements === null || advertisements === undefined) {
      return ErrorHandler(ADVERT_NOT_FOUND, ERROR_STATUS_CODE, res)
    }


    const updateadvertisements = await findAdvertismentsById(id);

    // Validate Image
    const fileSize = advertisements.size / 1000; // size in KB
    const fileExt = advertisements.name.split(".").pop().toLowerCase(); // get the file extension

    if (fileSize > 2048) {
      return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
    }

    if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res)
    }

    const timestamp = Date.now();
    const uniqueId = uuidv4(); // Generate a unique identifier
    const public_id = `${advertisements.name.split(".")[0]}_${timestamp}_${uniqueId}`;
    // // Generate a unique public_id based on the original file name
    // const public_id = `${advertisements.name.split(".")[0]}`;
    const folderPath = `advertisements/salon-${salonId}`;

    cloudinary.uploader.upload(advertisements.tempFilePath, {
      public_id: public_id,
      folder: folderPath,
    })
      .then(async (image) => {

        const result = await cloudinary.uploader.destroy(public_imgid);

        if (result.result !== 'ok') {
          return res.status(500).json({ success: false, message: 'Failed to delete image.' });
        }

        // Delete the temporary file after uploading to Cloudinary
        fs.unlink(advertisements.tempFilePath, (err) => {
          if (err) {
            console.error(err);
          }
        });


        const updatedSalonSettings = await updateAdvertisement(id, image);

        // Find the newly added advertisement
        const updatedAdvertisement = updatedSalonSettings.advertisements.find(ad => ad.public_id === image.public_id);


        return SuccessHandler(ADVERT_UPDATE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: updatedAdvertisement })

      })
      .catch((uploadError) => {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
          error: uploadError.message
        });
      });

  } catch (error) {
    next(error);
  }
};


//DESC: DELETE ADVERTISEMENTS ====================
export const deleteAdvertisements = async (req, res, next) => {
  try {
    const public_id = req.body.public_id;
    const img_id = req.body.img_id;

    const { updatedSalonSettings, deletedImage } = await deleteAdvertisement(img_id);

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {

      if (updatedSalonSettings) {
        return SuccessHandler(ADVERT_DELETE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: deletedImage })
      } else {
        return res.status(404).json({ success: false, message: 'Image not found in the advertisements' });
      }
    } else {
      return res.status(500).json({ success: false, message: 'Failed to delete image.' });
    }
  } catch (error) {
    next(error);
  }
};


//DESC: DASHBOARD APPOINTMENT LIST ====================
export const getDashboardAppointmentList = async (req, res, next) => {
  try {
    const { salonId, appointmentDate } = req.body;

    if (salonId && appointmentDate) {
      const appointments = await dashboardAppointmentList(salonId, appointmentDate)

      res.status(200).json({
        success: true,
        message: 'Appointments retrieved successfully for Dashboard',
        response: appointments
      });
    } else {
      res.status(201).json({
        success: false,
        message: 'Failed to fetch appointments',
        response: []
      })
    }

  } catch (error) {
    next(error);
  }
};

//DESC: SET DRAG ADVERTISEMENTS =====================
export const setDragAdvertisement = async (req, res, next) => {
  try {
    const advertisements = req.body.advertisements;
    const salonId = req.body.salonId

    if (advertisements && salonId) {
      if (advertisements.length === 0) {
        return ErrorHandler(ADVERT_NOT_FOUND, ERROR_STATUS_CODE, res)
      }

      const changeAdvertisements = await setDragAdvertisemnts(salonId, advertisements);

      return SuccessHandler(ADVERT_DRAG_SUCCESS, SUCCESS_STATUS_CODE, res)

    } else {
      return res.status(400).json({
        success: false,
        message: "Advertisements or SalonId not present"
      })
    }
  }
  catch (error) {
    next(error);
  }
}
