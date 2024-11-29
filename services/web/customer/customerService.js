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
export const fetchedCustomers = async (query, sortOptions, skip, limit) => {
    const customers = await Customer.find(query).sort(sortOptions).skip(skip).limit(Number(limit));
 
    return customers || [];
 }
 
 //TOTAL CUSTOMER COUNT 
 export const totalCustomerCount = async (query) => {
    const totalCount = await Customer.countDocuments(query);
    return totalCount;
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
