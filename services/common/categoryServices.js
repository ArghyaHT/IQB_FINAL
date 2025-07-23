import Categoty from "../../models/serviceCategoryRegisterModel.js";

export const uploadCategory = async (categoryName, result) => {
    const categoryImage = {
        public_id: result.public_id,
        url: result.secure_url, 
    };

    const category = await Categoty.findOneAndUpdate(
        { serviceCategoryName: categoryName },
        { serviceCategoryImage: categoryImage },
        { new: true, upsert: true }
    );

    return category;
};



export const getCategories = async() =>{
   const getAllCategories = await Categoty.find().sort({ serviceCategoryName: 1 });

      return getAllCategories;
} 