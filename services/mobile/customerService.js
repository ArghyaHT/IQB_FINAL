import Customer from "../../models/customerRegisterModel.js"

//FIND CUSTOMER BY EMAIL
export const findCustomerByEmail = async (email) => {
   const customer = await Customer.findOne({ email });
   return customer;
}

//SAVE CUSTOMER
export const saveCustomer = async (newCustomer) => {
   const { email,
      name,
      gender,
      dateOfBirth,
      mobileNumber,
      countryFlag,
      countryCca2,
      mobileCountryCode,
      hashedPassword,
      // verificationCode,
   } = newCustomer

   const customer = new Customer({
      email,
      name,
      gender,
      dateOfBirth,
      mobileNumber,
      countryFlag,
      countryCca2,
      mobileCountryCode,
      password: hashedPassword,
      // verificationCode,
      customer: true,
      mobileVerified:true
   });


   //Saving the Customer
   const savedCustomer = await customer.save();

   return savedCustomer;
}

export const createGoogleCustomer = async (email) => {
   const user = new Customer({
      email: email,
      AuthType: "google"
   })

   await user.save();

   return user;
}

export const googleLoginCustomer = async (email) => {
   const user = await Customer.findOne({ email: email, AuthType: "google" });
   return user;
}

//GET ALL CUSTOMERS BY SALONID
export const fetchedCustomers = async (query, sortOptions, skip, limit) => {
   const customers = await Customer.find(query).sort(sortOptions).skip(skip).limit(Number(limit));

   return customers;
}

//TOTAL CUSTOMER COUNT 
export const totalCustomerCount = async (query) => {
   const totalCount = await Customer.countDocuments(query);
   return totalCount;
}

//UPDATE CUSTOMER
export const updateCustomerDetails = async (customerData) => {
   const {
      email,
      name,
      gender,
      dateOfBirth,
      mobileCountryCode,
      countryFlag,
      countryCca2,
      // hashedPassword,
      mobileNumber,
   } = customerData;

   const customer = await Customer.findOneAndUpdate({ email },
      { name, gender, dateOfBirth, mobileNumber, mobileCountryCode, countryFlag: countryFlag, countryCca2: countryCca2 },
      { new: true })
   return customer;
}

//DELETE CUSTOMER
export const deleteCustomer = async (email) => {
   const deleteCustomer = await Customer.deleteOne({ email: email });
   return deleteCustomer;
}

//UPLOAD CUSTOMER PROFILEPIC
export const uploadCustomerProPic = async (email, profileimg) => {
   const customer = await Customer.findOneAndUpdate({ email }, { profile: profileimg }, { new: true });

   return customer;
}

//UPDATE CUSTOMER PROFILEPIC
export const findCustomerProfileById = async (id) => {
   const customer = await Customer.findOne({ "profile._id": id }, { "profile.$": 1 });
   return customer;
}


export const updateCustomerProPic = async (id, image) => {
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
export const deleteCustomerProPic = async (img_id) => {
   const customer = await Customer.findOneAndUpdate(
      { 'profile._id': img_id },
      { $pull: { profile: { _id: img_id } } },
      { new: true }
   );
   return customer;
}

//GET CUSTOMER BY CUSTOMER EMAIL AND SALON ID
export const findCustomerByCustomerEmailAndSalonId = async (customerEmail, salonId) => {
   const customer = await Customer.findOne({ salonId: salonId, email: customerEmail }).exec();

   return customer;
}

export const updateCustomerCancelCount = async () => {
   const updateCustomers = await Customer.updateMany(
      {},
      {
         cancellationCount: 0    // Set cancellationCount to 0
      }
   );
   return updateCustomers
}
