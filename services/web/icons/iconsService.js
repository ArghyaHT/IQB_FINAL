import Icons from "../../../models/iconsModel.js";

export const addedicons = async(uploadedIcons) => {
    const icons = await Icons.create({ icons: uploadedIcons });

    return icons
}

export const findAllIcons = async() => {
    const icons = await Icons.findOne({}, { icons: 1 });

    return icons;
}