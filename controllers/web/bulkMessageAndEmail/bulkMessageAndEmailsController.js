import { bulkEmail } from "../../../utils/emailSender/emailSender.js";
import { sendSmsLogic } from "../../../utils/mobileMessageSender/mobileMessageSender.js";

export const sendBulkTextMessages = async (req, res, next) => {
    try {
      const { numbers, smsBody } = req.body;
  
      if (!smsBody) {
        return res.status(400).json({ success: false, message: "Plese enter message" });
      }
  
         // Check if numbers is an array
         if (numbers.length === 0) {
          return res.status(400).json({ success: false, message: "Please provide atleast one receipient number." });
        }
    
  
  
      // Check if numbers is an array
      if (!Array.isArray(numbers)) {
        return res.status(400).json({ success: false, message: "RecipientNumbers must be an array" });
      }
  
      // Convert each number to string and add a + sign before each number
      const formattedNumbers = numbers.map(number => `+${String(number)}`);
  
  
      // Iterate over each mobile number and send SMS
      for (const number of formattedNumbers) {
  
        // console.log(number, smsBody)
        // Replace sendSms with your actual SMS sending logic
        await sendSmsLogic(smsBody, number);
      }
      return res.status(200).json({
        success: true,
        message: 'Sms sent successfully',
    });
  
    }
    catch (error) {
      next(error);
    }
  }
  
  //DESC: SEND BULK MAIL TO ================
  export const sendBulkEmails = async (req, res, next) => {
    try {
        const { subject, message, role, recipientEmails } = req.body;
  
        if (!subject) {
          return res.status(400).json({
              success: false,
              message: 'Please enter subject.',
          });
      }
      
      if (!message) {
          return res.status(400).json({
              success: false,
              message: 'Please enter message.',
          });
      }
         
      if (!Array.isArray(recipientEmails)) {
          return res.status(400).json({
              success: false,
              message: 'RecipientEmails should be an array.',
          });
      }
      
      if (recipientEmails.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'RecipientEmails should not be empty.',
          });
      }
  
        // Call your bulk email function here passing subject, message, and recipientEmails
        await bulkEmail(subject, message, recipientEmails);
  
        if(role === "Barber"){
          return res.status(200).json({
            success: true,
            message: 'Mail sent successfully.',
        });
        }
        else{  return res.status(200).json({
          success: true,
          message: 'Mail sent successfully.',
      });
  
  
        }
     
    } catch (error) {
        // //console.log(error);
        next(error);
    }
  };