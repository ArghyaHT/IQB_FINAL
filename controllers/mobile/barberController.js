import { fetchedBarbers, totalBarberCount } from "../../services/mobile/barberService.js";

//DESC:GET ALL BARBERS BY SALONID =================
export const getAllBarberbySalonId = async (req, res, next) => {
    try {
        let { salonId, name, email, page = 1, limit = 10, sortField, sortOrder } = req.query;

        // Convert email to lowercase
        email = email.toLowerCase();

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

        res.status(200).json({
            success: true,
            message: "All barbers fetched successfully",
            response: {
                allbarbers: getAllBarbers,
                totalPages: Math.ceil(totalBarbers / Number(limit)),
                currentPage: Number(page),
                totalBarbers,
            }

        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};