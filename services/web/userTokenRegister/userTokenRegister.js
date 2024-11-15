import UserTokenTable from "../../../models/userTokenModel.js"

//CREATE BARBER FCM TOKENS
export const createBarberFcmToken = async(email, tokenType, tokenValue)=> {
    const barber = await UserTokenTable.findOneAndUpdate(
      { email: email },
      { [tokenType]: tokenValue, type: "barber" },
      { upsert: true, new: true }
    );
      return barber;
}

//GET USER TOKENS TO SEND NOTIFICATION
export const getUserTokens = async() => {
  const userTokens = await  UserTokenTable.find();
  return userTokens;
}

//GET MULTIPLE TOKENS TO SEND NOTIFICATION
export const getMultipleUserTokens = async(emails) => {
  const users =  await UserTokenTable.find({ email: { $in: emails } });
  return users;
  }