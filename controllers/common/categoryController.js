import { CATEGORY_IMAGE_EMPTY_ERROR, CATEGORY_NAME_EMPTY_ERROR } from "../../constants/common/commonConstants.js";
import { ERROR_STATUS_CODE } from "../../constants/kiosk/StatusCodeConstants.js";
import { ALLOWED_IMAGE_EXTENSIONS, IMAGE_FAILED_DELETE, MAX_FILE_SIZE } from "../../constants/web/Common/ImageConstant.js";
import { ErrorHandler } from "../../middlewares/ErrorHandler.js";
import { v4 as uuidv4 } from 'uuid';

import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { IMAGE_UPLOAD_SUCCESS } from "../../constants/web/adminConstants.js";
import { SUCCESS_STATUS_CODE } from "../../constants/web/Common/StatusCodeConstant.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { uploadCategory } from "../../services/common/categoryServices.js";



export const addCategory = async (req, res, next) => {
    try {
        let categoryimage = req.files.categoryimage;
        const { categoryName } = req.body;


        if (!categoryName) {
            return ErrorHandler(CATEGORY_NAME_EMPTY_ERROR, ERROR_STATUS_CODE, res);
        }

        if (!req.files || !req.files.categoryimage) {
            return ErrorHandler(CATEGORY_IMAGE_EMPTY_ERROR, ERROR_STATUS_CODE, res)
        }

        // Allowed file extensions
        const allowedExtensions = ALLOWED_IMAGE_EXTENSIONS;
        const maxFileSize = MAX_FILE_SIZE;

        const extension = path.extname(categoryimage.name).toLowerCase().slice(1);


        if (!allowedExtensions.includes(extension)) {
            return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res);
        }

        if (categoryimage.size > maxFileSize) {
            return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res);
        }

        // Upload to Cloudinary
        const public_id = `${categoryimage.name.split('.')[0]}_${uuidv4()}`;
        const folderPath = 'categories';

        const result = await cloudinary.uploader.upload(categoryimage.tempFilePath, {
            public_id,
            folder: folderPath,
        });

        // Delete the temp file
        fs.unlink(categoryimage.tempFilePath, (err) => {
            if (err) console.error(IMAGE_FAILED_DELETE, err);
        });

        const newCategory = await uploadCategory(categoryName, result)

        return SuccessHandler(IMAGE_UPLOAD_SUCCESS, SUCCESS_STATUS_CODE, res, {
            response: newCategory
        });
    }
    catch (error) {
        next(error);
    }
}
