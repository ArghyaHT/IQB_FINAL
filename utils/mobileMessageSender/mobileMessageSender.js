import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();


const accountSid = process.env.TWILIO_ACC_SID; // Your Twilio account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Twilio trail auth token
const twilioPhoneNumber = process.env.TWILIO_FROM_NO; // Your Twilio phone number

const client = twilio(accountSid, authToken);

export const sendSmsLogic = async (body, number) => {
  let msgOptions = {
    from: twilioPhoneNumber,
    to: number,
    body
  }
  try {
    const message = await client.messages.create(msgOptions);
  }
  catch (error) {
    console.log(error)
  }
}


export const sendMobileVerificationCode = async (number, verificationCode, body) => {
  let msgOptions = {
    from: twilioPhoneNumber,
    to: number,
    // body: `<#> Your verification code is ${verificationCode} Don't share.`
    body: `Your one-time password is ${verificationCode}.\nPlease use this one-time password (OTP) within the next 10 minutes to proceed.\n\nThank you,\nTeam Iqbook`
  }
  try {
    const message = await client.messages.create(msgOptions);
  }
  catch (error) {
    console.log(error)
  }
}



export const sendQueueListMessage = async (number, verificationCode, body) => {
  let msgOptions = {
    from: twilioPhoneNumber,
    to: number,
    body: `<#> Your verification code is ${verificationCode} Don't share.
    `

  }
  try {
    const message = await client.messages.create(msgOptions);
  }
  catch (error) {
    console.log(error)
  }
}

