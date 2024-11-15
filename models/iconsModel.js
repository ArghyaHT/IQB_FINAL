import mongoose  from "mongoose";

const iconsModel = new mongoose.Schema({
    icons: [
        {
            public_id: {
                type: String
            },
            url: {
                type: String,
            }
        }
    ]
})

const Icons = mongoose.model('Icons', iconsModel);

export default Icons;