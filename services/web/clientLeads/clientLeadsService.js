import ClientLeads from "../../../models/clientLeadsModel.js";



export const clientLeadsData = async(name, email, mobileCountryCode, mobileNumber, message) => {
    const newClient =  new ClientLeads({
        name: name,
        email: email,
        mobileCountryCode: mobileCountryCode,
        mobileNumber: mobileNumber,
        message: message
    })

    const saveClientLeads = await newClient.save();

    return saveClientLeads

}