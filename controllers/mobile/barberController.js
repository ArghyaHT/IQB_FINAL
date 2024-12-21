import { ERROR_STATUS_CODE_201, SUCCESS_STATUS_CODE } from "../../constants/mobile/StatusCodeConstants.js";
import { GET_ALL_BARBER_SUCCESS, NO_BARBERS_ERROR } from "../../constants/web/BarberConstants.js";
import { ErrorHandler } from "../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { fetchedBarbers, totalBarberCount } from "../../services/mobile/barberService.js";

//DESC:GET ALL BARBERS BY SALONID =================
export const getAllBarberbySalonId = async (req, res, next) => {
    try {
        const { salonId, name, email, page = 1, limit = 10, sortField, sortOrder } = req.query;
        let query = {}; // Filter for isDeleted set to false

        const searchRegExpName = new RegExp('.*' + name + ".*", 'i');
        const searchRegExpEmail = new RegExp('.*' + email + ".*", 'i');

        if (salonId) {
            query.salonId = salonId;
        }

        if (name || email) {
            query.$or = [
                { name: { $regex: searchRegExpName } },
                { email: { $regex: searchRegExpEmail } }
            ];
        }

        const sortOptions = {};
        if (sortField && sortOrder) {
            sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
        }

        const skip = Number(page - 1) * Number(limit);

        const getAllBarbers = await fetchedBarbers(salonId, sortOptions, skip, limit);

        const totalBarbers = await totalBarberCount(query);

        if (getAllBarbers.length === 0) {
            // return res.status(201).json({
            //     success: true,
            //     message: "No Barbers found for the particular salon.",
            // })

            return ErrorHandler(NO_BARBERS_ERROR, ERROR_STATUS_CODE_201, res)


        }

        // return res.status(200).json({
        //     success: true,
        //     message: "All barbers fetched successfully",
        //     response:{
        //         allbarbers: getAllBarbers,
        //         totalPages: Math.ceil(totalBarbers / Number(limit)),
        //         currentPage: Number(page),
        //         totalBarbers,
        //     }

        // });
        return SuccessHandler(
            GET_ALL_BARBER_SUCCESS,
            SUCCESS_STATUS_CODE,
            res,
            {
                response: {
                    allBarbers: getAllBarbers,
                    totalPages: Math.ceil(totalBarbers / Number(limit)),
                    currentPage: Number(page),
                    totalBarbers
                }
            }
        );
    } catch (error) {
        next(error);
    }
};