import { createPushDevices, getPushDevicesbyEmailId } from "../../services/mobile/pushDeviceTokensService.js";

export const pushDeviceTokens = async(req, res, next) => {
    try{

        const {salonId, name, email, deviceToken, deviceType} = req.body

        const extractedToken = deviceToken.replace(/^ExponentPushToken\[(.*)\]$/, "$1");

                // Check if the email already exists
                let existingDevice =  await getPushDevicesbyEmailId(email)

                if (existingDevice) {
                    // Update the existing entry
                    existingDevice.salonId = salonId
                    existingDevice.deviceToken = extractedToken;
                    existingDevice.deviceType = deviceType;
                    await existingDevice.save();
                    return res.status(200).json({ success: true, message: "Device token updated successfully", response: existingDevice });
                } else {

                    const extractedToken = deviceToken.replace(/^ExponentPushToken\[(.*)\]$/, "$1");
                    // Create a new entry
                    const newDevice = await createPushDevices(salonId, name, email, extractedToken, deviceType)
                    return res.status(200).json({ success: true, message: "Device token stored successfully", response: newDevice });
                }


    }  
     catch (error) {
        //console.log(error);
        next(error);
    }
}


export const pushFcmDeviceTokens = async(req, res, next) => {
    try{
        const {salonId, name, email, deviceToken, deviceType} = req.body

        console.log(deviceToken)

        // Check if the email already exists
        let existingDevice =  await getPushDevicesbyEmailId(email)

        if (existingDevice) {
            // Update the existing entry
            existingDevice.salonId = salonId
            existingDevice.deviceToken = deviceToken;
            existingDevice.deviceType = deviceType;
            await existingDevice.save();
            return res.status(200).json({ success: true, message: "Device token updated successfully", response: existingDevice });
        } else {
            // Create a new entry
            const newDevice = await createPushDevices(salonId, name, email, deviceToken, deviceType)
            return res.status(200).json({ success: true, message: "Device token stored successfully", response: newDevice });
        }
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}