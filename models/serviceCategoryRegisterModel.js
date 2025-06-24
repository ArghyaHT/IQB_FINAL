import mongoose from "mongoose";

const categotySchema = new mongoose.Schema({
    serviceCategoryName: {
        type: String

    },
  serviceCategoryImage: {
        type: {
            public_id: {
                type: String
            },
            url: {
                type: String,
                // default: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg"
            }
        },
        default: {}  // Ensure default value is an array with an object
    },}, { timestamps: true })


const Categoty = mongoose.model('Categoty', categotySchema);

export default Categoty;
