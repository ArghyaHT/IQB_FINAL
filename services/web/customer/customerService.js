import Customer from "../../../models/customerRegisterModel.js";

//FIND CUSTOMER BY EMAIL
export const findCustomerByEmail = async(email) => {
    const customer = await Customer.findOne({ email }).select("-password");
    return customer;
}

//SAVE CUSTOMER
export const saveCustomer = async(newCustomer) => {
    const {email,
        name,
        gender,
        dateOfBirth,
        mobileNumber,
        hashedPassword,
        verificationCode,
        } = newCustomer

    const customer = new Customer({
        email,
        name,
        gender,
        dateOfBirth,
        mobileNumber,
        password: hashedPassword,
        verificationCode,
        customer: true,
      });
  
  
      //Saving the Customer
      const savedCustomer = await customer.save();
      
      return savedCustomer;
}

//GET ALL CUSTOMERS BY SALONID
export const fetchedCustomers = async (salonId) => {
    const customers = await Customer.find({salonId});
 
    return customers || [];
 }
 

 //UPDATE CUSTOMER
 export const updateCustomerDetails = async(customerData) => {
    const {
        email,
        name,
        gender,
        dateOfBirth,
        hashedPassword,
        mobileNumber,
        mobileCountryCode,
      } = customerData;

      const customer = await Customer.findOneAndUpdate({ email },
        { name, gender, password:hashedPassword, dateOfBirth, mobileNumber, mobileCountryCode },
        { new: true })
        return customer;
 }

 //DELETE CUSTOMER
 export const deleteCustomer = async(email) => {
    const deleteCustomer = await Customer.deleteOne({ email: email });
    return deleteCustomer;
 }

 //UPLOAD CUSTOMER PROFILEPIC
export const uploadCustomerProPic = async(email, profileimg) => {
    const customer = await Customer.findOneAndUpdate({ email }, { profile: profileimg }, { new: true });
 
    return customer;
 }
 
//UPDATE CUSTOMER PROFILEPIC
 export const findCustomerProfileById = async(id) => {
    const customer = await Customer.findOne({ "profile._id": id }, { "profile.$": 1 });
    return customer;
 }
 
 
 export const updateCustomerProPic = async(id, image) => {
    const customer = await Customer.findOneAndUpdate(
       { "profile._id": id },
       {
           $set: {
               'profile.$.public_id': image.public_id,
               'profile.$.url': image.url
           }
       },
       { new: true }
   );
   return customer;
 }
 
//DELETE CUSTOMER PROFILEPIC
 export const deleteCustomerProPic = async(img_id) => {
   const customer =  await Customer.findOneAndUpdate(
    { 'profile._id': img_id },
    { $pull: { profile: { _id: img_id } } },
    { new: true }
 );
 return customer;
 }


 //GET BARBERS BY SALON ID
export const getCustomersBySalonId = async (salonId) => {
    const customer = await Customer.find({ salonId });
    return customer;
 }


 export const getAllCustomersForAdmin = async (adminSalons) => {
    // Assuming you have a function getBarbersBySalonId(salonId)
    const allCustomers = await Promise.all(
        adminSalons.map(async (salonId) => {
            const customers = await getCustomersBySalonId(salonId); // Fetch barbers for this salonId
            return customers; // Return the list of barbers for this salon
        })
    );
 
    // Flattening the array to get a single list of all barbers
    const flattenedCustomers = allCustomers.flat();
 
    return flattenedCustomers;
 };