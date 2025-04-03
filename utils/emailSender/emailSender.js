import nodemailer from "nodemailer"
import { generateInvoicePDF } from "../invoice/invoicepdf.js";
import fs from "fs"

// Configure the email transporter
const transporter = nodemailer.createTransport({
  // host: 'iqueuebarbers.com',
  // port: 465,
  // secure: true,
  // auth: {
  //   user: process.env.SENDER_EMAIL_ADDRESS,
  //   pass: 'DDOoTM5uB3rH',
  // },

    host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'arghyahimanstech@gmail.com',
    pass: 'srseljzsckyykpsg',
  },
  });

  // host: 'smtp.gmail.com',
  // port: 465,
  // secure: true,
  // auth: {
  //   user: 'arghyahimanstech@gmail.com',
  //   pass: 'srseljzsckyykpsg',
  // },
// host: 'smtp.hostinger.com',
// port: 465,
// secure: true,
// auth: {
//   user: process.env.SENDER_EMAIL_ADDRESS,
//   pass: 'Bikki@852147',
// },

transporter.verify((err, success) => {
  if (err) console.error(err);
  console.log('Your config is correct');
});


//SEND RESET PASSWORD LINK
export const emailWithNodeMail = async (email, name, CLIENT_URL, PASSWORD_ROUTE, resetToken) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL_ADDRESS, // sender address
      to: email, // list of receivers
      subject: 'Reset Password Email', // Subject line
      html: `
       <h2>Hello ${name}!</h2>
       <p>Please click here to link <a style="background-color: #c2e7ff; padding: 8px 12px; border-radius: 15px; color: white; text-decoration: none; border: none; margin-left:10px;color:black;font-weigth:bold" href="${CLIENT_URL}/${PASSWORD_ROUTE}/${resetToken}" target="_blank">Reset your password</a></p>
   `// html body
    }

    const info = await transporter.sendMail(mailOptions)
    //    console.log(`Message send: %s`,info)
  } catch (error) {
    console.error(error)
  }
}


//DESC:SEND VERIFICATION CODE EMAIL ============================
export const sendVerificationCode = (email, name, verificationCode) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS,
    to: email,
    subject: 'Verify your Email',
    html: `
    <h2>Hello ${name}!</h2>
    <p>To verify your Email please note the verification code. Your verification code is ${verificationCode}</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//DESC:SEND VERIFICATION CODE EMAIL ============================
export const sendForgetPasswordMail = (email, name, verificationCode) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS,
    to: email,
    subject: 'Reset Password Email',
    html: `
  <h2>Hello ${name}!</h2>
  <p>Your Password Reset Verification Code is ${verificationCode}</p>
`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//DESC:SEND MAIL TO CUSTOMERS FOR QPOSITION CHANGE ============================
export const sendQueuePositionChangedEmail = (customerEmail, qPosition) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: customerEmail,
    subject: 'Queue Position Changed',
    html: `<p>Your queue position has changed. Your new position is ${qPosition}.</p>`
    // Customize the email content as per your requirements
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


//DESC:SEND MAIL TO ADMIN FOR APPOINTMENTS ============================
export const sendAppointmentsEmailAdmin = (adminEmail, startTime, customerName) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: adminEmail,
    subject: 'New Appointment Created',
    html: `
          <h2>Hello Admin!</h2>
          <p>A new appointment has been created at ${startTime} by ${customerName}.</p>
          <!-- Add more details here -->
        `,
    // Customize the email content as per your requirements
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//DESC:SEND MAIL TO BARBER FOR APPOINTMENTS ============================
export const sendAppointmentsEmailBarber = (email, name, startTime,) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: email,
    subject: 'New Appointment Created',
    html: `
    <h2>Hello ${name}!</h2>
    <p>You have a new appointment scheduled at ${startTime}.</p>
    <!-- Add more details here -->
  `,
    // Customize the email content as per your requirements
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//DESC:SEND MAIL TO BARBER FOR APPOINTMENTS ============================
export const sendAppointmentsEmailCustomer = (customerEmail, customerName, startTime,) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: customerEmail,
    subject: 'Appointment Confirmation',
    html: `
          <h2>Hello ${customerName}!</h2>
          <p>Your appointment has been confirmed at ${startTime}.</p>
          <!-- Add more details here -->
        `,
    // Customize the email content as per your requirements
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//DESC:SEND MAIL TO CUSTOMER ============================
export const sendCustomerMail = (email,subject, text) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS,
    to: `${email}`,
    subject: `${subject}`,
    html: `<p>Dear User,</p>
           <p>${text}</p>`,
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

//DESC:SEND BULK MAIL TO CUSTOMERS ============================
export const bulkEmail = (subject, message, recipientEmails) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: recipientEmails.join(', '),
    subject: `${subject}`,
    html: `<p>${message}</p><p>Thank you,<br>iQueueBarbers Team</p>`
    // Customize the email content as per your requirements
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


//DESC:SEND MAIL TO CUSTOMERS FOR QPOSITION CHANGE ============================
export const sendQueuePositionEmail = (customerEmail, emailSubject, emailBody) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: customerEmail,
    subject: emailSubject,
    html: emailBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//DESC:SEND BARBER LOGIN DETAILS WHEN CREATED BY ADMIN ============================
export const barberLogin = (email, emailSubject, emailBody) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: email,
    subject: emailSubject,
    html: emailBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


//DESC:SEND BARBER APPROVAL STATUS MESSAGE============================
export const barberApprovalStatus = (email, emailSubject, emailBody) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: email,
    subject: emailSubject,
    html: emailBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


//DESC:SEND BARBER APPROVAL STATUS MESSAGE============================
export const barberLeaveApproval = (email, emailSubject, emailBody) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: email,
    subject: emailSubject,
    html: emailBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


//DESC:SEND PAYMENT SUCCESS===========================
export const sendPaymentSuccesEmail = async(email, emailSubject, emailBody, invoice, paymentData, products) => {

  const invoicePath = await generateInvoicePDF(invoice, paymentData, products);

  if (!fs.existsSync(invoicePath)) {
    console.error('Invoice file does not exist:', invoicePath);
    return;
  }

  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS, // Replace with your sender email address
    to: email,
    subject: emailSubject,
    html: emailBody,
    attachments: [
      {
        filename: 'invoice.pdf',
        path: invoicePath, // Attach the generated invoice file
        contentType: 'application/pdf', // Specify MIME type
      },
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
    // Delete the file after successfully sending the email
    try {
      fs.unlinkSync(invoicePath);
      console.log('Temporary invoice file deleted:', invoicePath);
    } catch (unlinkError) {
      console.error('Error deleting the invoice file:', unlinkError.message);
    }
  });
};