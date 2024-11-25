import { addedicons, findAllIcons } from "../../../services/web/icons/iconsService.js";

//Upload Profile Picture Config
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


//AddAdvertisements api
export const addIcons = async (req, res, next) => {
    try {
      let icons = req.files.icons;
  
      // Ensure that icons is an array, even for single uploads
      if (!Array.isArray(icons)) {
        icons = [icons];
      }
  
      const uploadPromises = icons.map(icon => {
        return new Promise((resolve, reject) => {
          const timestamp = Date.now();
          const public_id = `${icon.name.split(".")[0]}_${timestamp}`;
  
          cloudinary.uploader.upload(icon.tempFilePath, {
            public_id: public_id,
            folder: "icons", // Change the folder name as required
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
              fs.unlink(icon.tempFilePath, (unlinkError) => {
                if (unlinkError) {
                  console.error('Failed to delete temporary file:', unlinkError);
                }
              });
            });
        });
      });
  
      const uploadedIcons = await Promise.all(uploadPromises);
  
      // Update the Icons model with the uploaded icon images
      const updatedIcons = await addedicons(uploadedIcons)
  
      res.status(200).json({
        success: true,
        message: "Icon images uploaded successfully",
        response: updatedIcons.icons,
      });
    } catch (error) {
        next(error);
    }
  };



 export const getAllIcons = async (req, res, next) => {
    try {
      // Fetch all icons from the database
      const allIcons = await findAllIcons();
  
      if (!allIcons || !allIcons.icons || allIcons.icons.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No icons found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "All icons retrieved successfully",
        response: allIcons.icons,
      });
    } catch (error) {
      next(error);
  }
  };


