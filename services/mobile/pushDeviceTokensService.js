import PushDevices from "../../models/pushDeviceToken.js"

export const getPushDevicesbyEmailId = async (email) => {
    const existingDevice = await PushDevices.findOne({ email })

    return existingDevice
}


export const createPushDevices = async (salonId, name, email, deviceToken, deviceType) => {
    const newDevice = new PushDevices({ salonId, name, email, deviceToken, deviceType });
    await newDevice.save();

    return newDevice
}