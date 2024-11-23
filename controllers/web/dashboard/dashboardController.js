import { addAdvertisement, deleteAdvertisement, findAdvertismentsById, getAdvertisements, setDragAdvertisemnts, updateAdvertisement } from "../../../services/web/salonSettings/salonSettingsService.js";
import { dashboardAppointmentList } from "../../../services/web/appointments/appointmentsService.js";
import { v4 as uuidv4 } from 'uuid';

//Upload Profile Picture Config
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//DESC: ADD ADVERTISEMENTS ====================
export const addAdvertisements = async (req, res, next) => {
  try {
    let advertisements = req.files.advertisements;
    let salonId = req.body.salonId;

    if(advertisements === null || advertisements === undefined){
      return res.status(400).json({ success: false, message: "Admvertisements must be provided." });
    }

    // Ensure that advertisements is an array, even for single uploads
    if (!Array.isArray(advertisements)) {
      advertisements = [advertisements];
    }
      // Allowed file extensions
      const allowedExtensions = ["jpg", "png", "jfif", "svg", "jpeg", "webp"];
      // Maximum file size in bytes (e.g., 5MB)
      const maxFileSize = 2 * 1024 * 1024;

        // Validate each image
        for (const advertisement of advertisements) {
          const extension = path.extname(advertisement.name).toLowerCase().slice(1);
          if (!allowedExtensions.includes(extension)) {
            return res.status(400).json({
              success: false,
              message: `Invalid file extension for ${advertisement.name}. Allowed: ${allowedExtensions.join(', ')}`,
            });
          }
    
          if (advertisement.size > maxFileSize) {
            return res.status(400).json({
              success: false,
              message: `File size exceeds the maximum file size of 2MB.`,
            });
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

    res.status(200).json({
      success: true,
      message: "Advertisement images uploaded successfully",
      response: uploadedAdvertisements,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//DESC: GET ADVERTISEMENTS ====================
export const getAllAdvertisements = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    if (Number(salonId) === 0) {
      res.status(200).json({
        success: false,
        message: "No advertisements available now",
        advertisements: []
      });
    }
    else {
      // Find SalonSettings by salonId and retrieve only the advertisements field
      const allAdvertisements = await getAdvertisements(salonId)

      if (!allAdvertisements) {
        return res.status(200).json({ success: false, message: "No advertisements available now", advertisements: [] });
      }

      // Sort advertisements array in descending order
      const sortedAdvertisements = allAdvertisements.advertisements;

      res.status(200).json({
        success: true,
        message: 'Advertisement images retrieved successfully',
        advertisements: sortedAdvertisements
      });
    }
  } catch (error) {
    console.log(error);
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

    if(advertisements === null || advertisements === undefined){
      return res.status(400).json({ success: false, message: "Admvertisements must be provided." });
    }


    const updateadvertisements = await findAdvertismentsById(id);

    // Validate Image
    const fileSize = advertisements.size / 1000; // size in KB
    const fileExt = advertisements.name.split(".").pop().toLowerCase(); // get the file extension

    if (fileSize > 2048) {
      return res.status(400).json({ success: false, message: "File size must be lower than 2mb" });
    }

    if (!["jpg", "png", "jfif", "jpeg", "svg"].includes(fileExt)) {
      return res.status(400).json({ success: false, message: "File extension must be jpg, png, jfif, jpeg, or svg" });
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

        console.log("Cloud image deleted");

        // Delete the temporary file after uploading to Cloudinary
        fs.unlink(advertisements.tempFilePath, (err) => {
          if (err) {
            console.error(err);
          }
        });


        const updatedSalonSettings = await updateAdvertisement(id, image);

        // Find the newly added advertisement
        const updatedAdvertisement = updatedSalonSettings.advertisements.find(ad => ad.public_id === image.public_id);


        res.status(200).json({
          success: true,
          message: "File updated successfully",
          response: updatedAdvertisement
        });

      })
      .catch((uploadError) => {
        console.error(uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
          error: uploadError.message
        });
      });

  } catch (error) {
    console.error(error);
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
      console.log("Cloud image deleted");

      if (updatedSalonSettings) {
        return res.status(200).json({
          success: true,
          message: "Image successfully deleted",
          response: deletedImage
        });
      } else {
        return res.status(404).json({ success: false, message: 'Image not found in the advertisements' });
      }
    } else {
      return res.status(500).json({ success: false, message: 'Failed to delete image.' });
    }
  } catch (error) {
    console.log(error);
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
    console.log(error);
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
        return res.status(400).json({
          success: false,
          message: "No advertisements present currently."
        });
      }

      const changeAdvertisements = await setDragAdvertisemnts(salonId, advertisements);


      return res.status(200).json({
        success: false,
        message: "Advertisements position changed successfully."
      })

    } else {
      return res.status(400).json({
        success: false,
        message: "Advertisements or SalonId not present"
      })
    }
  }
  catch (error) {
    console.log(error);
    next(error);
  }
}
