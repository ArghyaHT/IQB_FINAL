import { validateEmail } from "../../middlewares/validator.js";
import { allAppointmentsByBarberId, allAppointmentsByBarberIdAndDate, allAppointmentsBySalonId, allAppointmentsBySalonIdAndDate, createNewAppointment, deleteAppointmentById, getAppointmentbyId, getAppointmentsByAppointmentId, getAppointmentsByDateAndBarberId, getCustomerAppointments, getDeletedAPpointmentById, updateAppointment } from "../../services/mobile/appointmentService.js";
import { getBarberByBarberId, getBarberbyId } from "../../services/mobile/barberService.js";
import { getSalonSettings } from "../../services/mobile/salonSettingsService.js";
import { generateTimeSlots } from "../../utils/timeSlots.js";
import { getSalonBySalonId } from "../../services/web/admin/salonService.js"


import moment from "moment";
import { getAppointmentbySalonId } from "../../services/web/appointments/appointmentsService.js";
import { barberAppointmentDays, getBarbersBySalonIdForAppointments } from "../../services/web/barberAppointmentDays/barberAppointmentDaysService.js";
import { findSalonSetingsBySalonId, matchSalonOffDays } from "../../services/web/salonSettings/salonSettingsService.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../constants/kiosk/StatusCodeConstants.js";
import { BOOK_APPOINTMENT_BARBER_RETRIEVE_ERROR, BOOK_APPOINTMENT_BARBER_RETRIEVE_SUCCESS } from "../../constants/web/BarberAppointmentConstants.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { ErrorHandler } from "../../middlewares/ErrorHandler.js";
import { getBarberDayOffs } from "../../services/web/barberDayOff/barberDayOffService.js";
import { sendQueuePositionEmail } from "../../utils/emailSender/emailSender.js";
import { sendAppointmentNotification } from "../../utils/pushNotifications/pushNotifications.js";
import { getPushDevicesbyEmailId } from "../../services/mobile/pushDeviceTokensService.js";
import { CREATE_APPOINTMENT, DELETE_APPOINTMENT, EDIT_APPOINTMENT } from "../../constants/mobile/NotificationConstants.js"
import { getBarberBreakTimes } from "../../services/web/barberBreakTimes/barberBreakTimesService.js";
import { getBarberReservations } from "../../services/web/barberReservations/barberReservationsService.js";
import { getAppointmentsByCustomerEmail } from "../../services/mobile/appointmentHistoryService.js"
import { CUSTOMER_APPOINTMENT_RETRIEVE_SUCCESS } from "../../constants/web/AppointmentsConstants.js";
import { io } from "../../utils/socket/socket.js";
import { findNotificationUserByEmail } from "../../services/mobile/notificationService.js";

let isLocked = false; // lock flag in memory

//Creating Appointment
export const createAppointment = async (req, res, next) => {
  const { salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime, customerEmail, customerName, customerType, methodUsed } = req.body;
  if (isLocked) {
    return res.status(400).json({
      success: false,
      message: "Please wait, another appointment is being processed. Try again shortly.",
    });
  }
  try {

    isLocked = true;

    // Check if salonId is missing
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the salon ID.',
      });
    }
    // Check if barberId is missing
    if (!barberId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the barber ID.',
      });
    }

    // Check if serviceId is missing
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the service ID.',
      });
    }

    // Check if appointmentDate is missing
    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the appointment date.',
      });
    }

    // Check if startTime is missing
    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the start time.',
      });
    }

    // Check if customerName is missing
    if (!customerName || customerName.length < 1 || customerName.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the customer name.',
      });
    }

    // Check if customerName length less than 1 or more than 20
    if (customerName.length < 1 || customerName.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a name that is between 1 and 20 characters in length.',
      });
    }

    const email = customerEmail;

    // Validate email format
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email "
      });
    }

    const salon = await getSalonBySalonId(salonId)

    if (salon.isOnline === false) {
      return res.status(400).json({
        success: false,
        message: "The salon is currently offine"
      });
    }

    const day = moment(appointmentDate).format('dddd');

    // const salonDayOff = await matchSalonOffDays(salonId, day)

    // if (salonDayOff) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Salon closed",
    //   });
    // }


    const getSalonSettings = await findSalonSetingsBySalonId(salonId)

    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

    // Number of days to advance
    const appointmentAdvanceDays = getSalonSettings.appointmentAdvanceDays;

    // Generate the list of dates
    const dates = Array.from({ length: appointmentAdvanceDays }, (_, index) => {
      const date = new Date(tomorrow); // Clone the starting date
      date.setDate(tomorrow.getDate() + index); // Add the index to calculate subsequent days
      return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    });

    const barberAppointmentDay = await barberAppointmentDays(salonId, barberId)

    const appointmentDays = barberAppointmentDay.appointmentDays;

    // Function to convert a date string (YYYY-MM-DD) to the weekday name
    const getDayName = (dateString) => {
      const date = new Date(dateString); // Convert the date string to a Date object
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return daysOfWeek[date.getDay()]; // Returns the weekday name (e.g., "Monday")
    };

    // Filter the dates based on available appointment weekdays
    let availableDates = dates.filter(date => {
      const dayName = getDayName(date); // Get the weekday name of the date
      return appointmentDays.includes(dayName); // Check if it's one of the available appointment days
    });

    const barberDayOff = await getBarberDayOffs(salonId, barberId)

    if (barberDayOff) {
      const daysOffs = barberDayOff.barberOffDays;

      const daysOffsFormatted = daysOffs.map(day => new Date(day).toISOString().split("T")[0]);

      availableDates = availableDates.filter(date => !daysOffsFormatted.includes(date));
    }

    if (availableDates.includes(appointmentDate)) {
      // Fetch barber information
      const barber = await getBarberbyId(barberId);

      // Calculate total barberServiceEWT for all provided serviceIds
      let totalServiceEWT = 0;
      let serviceIds = [];
      let serviceNames = [];
      let servicePrices = [];
      let barberServiceEWTs = [];
      if (barber && barber.barberServices) {
        // Convert single serviceId to an array if it's not already an array
        const services = Array.isArray(serviceId) ? serviceId : [serviceId];

        services.forEach(id => {
          const service = barber.barberServices.find(service => service.serviceId === id);
          if (service) {
            totalServiceEWT += service.barberServiceEWT || 0;
            serviceIds.push(service.serviceId);
            serviceNames.push(service.serviceName);
            servicePrices.push(service.servicePrice);
            barberServiceEWTs.push(service.barberServiceEWT);
          }
        });
      }

      // Calculate totalServiceEWT in hours and minutes
      const hours = Math.floor(totalServiceEWT / 60);
      const minutes = totalServiceEWT % 60;

      // const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;

      // Parse startTime from the request body into hours and minutes
      // const [startHours, startMinutes] = startTime.split(':').map(Number);

      // Calculate endTime by adding formattedTime to startTime using Moment.js
      const startTimeMoment = moment(`${appointmentDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
      const endTimeMoment = startTimeMoment.clone().add(hours, 'hours').add(minutes, 'minutes');
      const endTime = endTimeMoment.format('HH:mm');

      const existingAppointmentList = await getAppointmentbySalonId(salonId);// make this call in appointmentService

      if (existingAppointmentList && existingAppointmentList.appointmentList) {
        const isConflict = existingAppointmentList.appointmentList.some(app => {
          // Compare barberId (both numbers, so direct compare)
          if (app.barberId !== barberId) return false;

          // Normalize and compare dates
          const appDateFormatted = moment(app.appointmentDate).format('YYYY-MM-DD');
          const newAppDateFormatted = moment(appointmentDate).format('YYYY-MM-DD');
          if (appDateFormatted !== newAppDateFormatted) return false;

          // Compose full datetime moments
          const existingStart = moment(`${appDateFormatted} ${app.startTime}`, 'YYYY-MM-DD HH:mm');
          const existingEnd = moment(`${appDateFormatted} ${app.endTime}`, 'YYYY-MM-DD HH:mm');

          const newStart = moment(`${newAppDateFormatted} ${startTime}`, 'YYYY-MM-DD HH:mm');
          const newEnd = moment(`${newAppDateFormatted} ${endTime}`, 'YYYY-MM-DD HH:mm');

          // Check overlap
          return newStart.isBefore(existingEnd) && existingStart.isBefore(newEnd);
        });

        if (isConflict) {
          return res.status(400).json({
            success: false,
            message: 'The timeslot is already booked. Please check other slots',
          });
        }
      }

      const newAppointment = {
        barberId,
        services: serviceIds.map((id, index) => ({
          serviceId: id,
          serviceName: serviceNames[index],
          servicePrice: servicePrices[index],
          barberServiceEWT: barberServiceEWTs[index],
        })),
        appointmentDate,
        startTime,
        endTime,
        appointmentNotes,
        timeSlots: `${startTime}-${endTime}`,
        customerEmail,
        customerName,
        customerType,
        methodUsed,
      };


      const barberDetails = await getBarberbyId(barberId)

      if (existingAppointmentList) {
        existingAppointmentList.appointmentList.push(newAppointment);
        await existingAppointmentList.save();

        const emailSubject = 'Appointment Created';
        const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Salon Appointment Details</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo img {
                        max-width: 200px;
                    }
                    .email-content {
                        background-color: #f8f8f8;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    ul {
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-content">
                    <div class="logo">
                    <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                </div>
                        <h1 style="text-align: center;">New Appointment Created</h1>
                        <p>Dear ${customerName},</p>
                        <p>Thank you for appointment at our salon. Here are your appointment details:</p>
                        <ul>
                        <li><strong>Barber:</strong> ${barberDetails.name}</li>
                        <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                        <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                        <li><strong>Appointment Time:</strong> ${startTime} - ${endTime}</li>
                        <li><strong>Service Estimated Time:</strong> ${totalServiceEWT} minutes</li>
                        </ul>
                        <p>Please feel free to contact us if you have any questions or need further assistance at the below mentioned.</p>
                        <p>Best regards,</p>
                        <p style="margin: 0; padding: 10px 0 5px;">
                        ${salon.salonName}<br>
                        Contact No.: ${salon.contactTel}<br>
                        EmailId: ${salon.salonEmail}
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
          await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
          console.log('Email sent successfully.');
        } catch (error) {
          console.error('Error sending email:', error);
          // Handle error if email sending fails
        }

        const pushDevice = await getPushDevicesbyEmailId(customerEmail)

        const appointmentTitle = "Appointment Booked Successfully"

        if (pushDevice && pushDevice.deviceToken) {
          await sendAppointmentNotification(pushDevice.deviceToken, salon.salonName, customerName, pushDevice.deviceType, CREATE_APPOINTMENT, customerEmail, startTime, appointmentDate, appointmentTitle)
        }

        const notifications = await findNotificationUserByEmail(email);

        // Reverse the order of notifications and attach customer profile to each
        const latestnotifications = notifications.sentNotifications.reverse().map(notification => ({
          ...notification.toObject(),  // Convert Mongoose document to plain object
          salonLogo: customerSalon.salonLogo  // Attach customer details
        }));


        await io.to(`customer_${salonId}_${email}`).emit("receiveNotifications", latestnotifications);

        const emailSubjectForBarber = 'New Appointment Created';
        const emailBodyForBarber = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Salon Appointment</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .logo {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo img {
                max-width: 200px;
            }
            .email-content {
                background-color: #f8f8f8;
                padding: 20px;
                border-radius: 10px;
            }
            ul {
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-content">
            <div class="logo">
                <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
            </div>
            <h1 style="text-align: center;">New Appointment Details</h1>
            <p>Dear ${barberDetails.name},</p>
            <p>You have a new appointment at our salon. Here are the appointment details:</p>
            <ul>
                <li><strong>Customer Name:</strong> ${customerName}</li>
                <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                <li><strong>Appointment Time:</strong> ${startTime} - ${endTime}</li>
                <li><strong>Service Estimated Time:</strong> ${totalServiceEWT} minutes</li>
            </ul>
            <p>Please make sure to be prepared for the appointment at the specified time. If you have any questions, feel free to contact the salon.</p>
            <p>Best regards,</p>
            <p style="margin: 0; padding: 10px 0 5px;">
                ${salon.salonName}<br>
                Contact No.: ${salon.contactTel}<br>
                EmailId: ${salon.salonEmail}
            </p>
        </div>
    </div>
</body>
</html>
`;

        try {
          await sendQueuePositionEmail(barberDetails.email, emailSubjectForBarber, emailBodyForBarber);
          console.log('Barber email sent successfully.');
        } catch (error) {
          console.error('Error sending barber email:', error);
          // Handle error if email sending fails
        }


        return res.status(200).json({
          success: true,
          message: "Appointment Confirmed",
          response: existingAppointmentList,
        });
      }
      else {
        const newAppointmentData = await createNewAppointment(salonId, newAppointment)
        const savedAppointment = await newAppointmentData.save();

        const emailSubject = 'Appointment Created';
        const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Salon Appointment Details</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo img {
                        max-width: 200px;
                    }
                    .email-content {
                        background-color: #f8f8f8;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    ul {
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-content">
                    <div class="logo">
                    <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                </div>
                        <h1 style="text-align: center;">Salon Queue Details</h1>
                        <p>Dear ${customerName},</p>
                        <p>Thank you for appointment at our salon. Here are your appointment details:</p>
                        <ul>
                        <li><strong>Barber:</strong> ${barberDetails.name}</li>
                        <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                        <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                        <li><strong>Appointment Time:</strong> ${startTime} - ${endTime}</li>
                        <li><strong>Service Estimated Time:</strong> ${totalServiceEWT} minutes</li>
                        </ul>
                        <p>Please feel free to contact us if you have any questions or need further assistance at the below mentioned.</p>
                        <p>Best regards,</p>
                        <p style="margin: 0; padding: 10px 0 5px;">
                        ${salon.salonName}<br>
                        Contact No.: ${salon.contactTel}<br>
                        EmailId: ${salon.salonEmail}
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
          await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
          console.log('Email sent successfully.');
        } catch (error) {
          console.error('Error sending email:', error);
          // Handle error if email sending fails
        }

        const pushDevice = await getPushDevicesbyEmailId(customerEmail)

        if (pushDevice && pushDevice.deviceToken) {
          await sendAppointmentNotification(pushDevice.deviceToken, salon.salonName, customerName, pushDevice.deviceType, CREATE_APPOINTMENT, customerEmail, startTime, appointmentDate)
        }

        const notifications = await findNotificationUserByEmail(email);

        // Reverse the order of notifications and attach customer profile to each
        const latestnotifications = notifications.sentNotifications.reverse().map(notification => ({
          ...notification.toObject(),  // Convert Mongoose document to plain object
          salonLogo: customerSalon.salonLogo  // Attach customer details
        }));


        await io.to(`customer_${salonId}_${email}`).emit("receiveNotifications", latestnotifications);



        const emailSubjectForBarber = 'New Appointment Created';
        const emailBodyForBarber = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Salon Appointment</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .logo {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo img {
                max-width: 200px;
            }
            .email-content {
                background-color: #f8f8f8;
                padding: 20px;
                border-radius: 10px;
            }
            ul {
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-content">
            <div class="logo">
                <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
            </div>
            <h1 style="text-align: center;">New Appointment Details</h1>
            <p>Dear ${barberDetails.name},</p>
            <p>You have a new appointment at our salon. Here are the appointment details:</p>
            <ul>
                <li><strong>Customer Name:</strong> ${customerName}</li>
                <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                <li><strong>Appointment Time:</strong> ${startTime} - ${endTime}</li>
                <li><strong>Service Estimated Time:</strong> ${totalServiceEWT} minutes</li>
            </ul>
            <p>Please make sure to be prepared for the appointment at the specified time. If you have any questions, feel free to contact the salon.</p>
            <p>Best regards,</p>
            <p style="margin: 0; padding: 10px 0 5px;">
                ${salon.salonName}<br>
                Contact No.: ${salon.contactTel}<br>
                EmailId: ${salon.salonEmail}
            </p>
        </div>
    </div>
</body>
</html>
`;

        try {
          await sendQueuePositionEmail(barberDetails.email, emailSubjectForBarber, emailBodyForBarber);
          console.log('Barber email sent successfully.');
        } catch (error) {
          console.error('Error sending barber email:', error);
          // Handle error if email sending fails
        }

        return res.status(200).json({
          success: true,
          message: "Appointment Confirmed",
          response: savedAppointment,
        });
      }
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'Barber not available for this date',
      });
    }
  } catch (error) {
    next(error);
  }
  finally {
    isLocked = false; // always release the lock
  }
};

//DESC:EDIT APPOINTMENT ====================
export const editAppointment = async (req, res, next) => {
  const { appointmentId, salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime } = req.body; // Assuming appointmentId is passed as a parameter

  if (isLocked) {
    return res.status(400).json({
      success: false,
      message: "Please wait, another appointment is being processed. Try again shortly.",
    });
  }
  try {

    isLocked = true;
    // Check if required fields are missing
    if (!barberId || !serviceId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all the fields',
      });
    }

    const day = moment(appointmentDate).format('dddd');

    // const salonDayOff = await matchSalonOffDays(salonId, day)

    // if (salonDayOff) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Salon closed today",
    //   });
    // }

    const getSalonSettings = await findSalonSetingsBySalonId(salonId)

    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

    // Number of days to advance
    const appointmentAdvanceDays = getSalonSettings.appointmentAdvanceDays;

    // Generate the list of dates
    const dates = Array.from({ length: appointmentAdvanceDays }, (_, index) => {
      const date = new Date(tomorrow); // Clone the starting date
      date.setDate(tomorrow.getDate() + index); // Add the index to calculate subsequent days
      return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    });

    const barberAppointmentDay = await barberAppointmentDays(salonId, barberId)

    const appointmentDays = barberAppointmentDay.appointmentDays;

    // Function to convert a date string (YYYY-MM-DD) to the weekday name
    const getDayName = (dateString) => {
      const date = new Date(dateString); // Convert the date string to a Date object
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return daysOfWeek[date.getDay()]; // Returns the weekday name (e.g., "Monday")
    };

    // Filter the dates based on available appointment weekdays
    let availableDates = dates.filter(date => {
      const dayName = getDayName(date); // Get the weekday name of the date
      return appointmentDays.includes(dayName); // Check if it's one of the available appointment days
    });

    const barberDayOff = await getBarberDayOffs(salonId, barberId)

    if (barberDayOff) {
      const daysOffs = barberDayOff.barberOffDays;

      const daysOffsFormatted = daysOffs.map(day => new Date(day).toISOString().split("T")[0]);

      availableDates = availableDates.filter(date => !daysOffsFormatted.includes(date));
    }

    if (availableDates.includes(appointmentDate)) {
      // Fetch barber information
      const barber = await getBarberbyId(barberId);

      // Calculate total barberServiceEWTs for all provided serviceIds
      let totalServiceEWT = 0;
      let serviceIds = [];
      let serviceNames = [];
      let servicePrices = [];
      let barberServiceEWTs = [];
      if (barber && barber.barberServices) {
        // Convert single serviceId to an array if it's not already an array
        const services = Array.isArray(serviceId) ? serviceId : [serviceId];

        services.forEach(id => {
          const service = barber.barberServices.find(service => service.serviceId === id);
          if (service) {
            totalServiceEWT += service.barberServiceEWT || 0;
            serviceIds.push(service.serviceId);
            serviceNames.push(service.serviceName);
            servicePrices.push(service.servicePrice);
            barberServiceEWTs.push(service.barberServiceEWT);
          }
        });
      }

      // Calculate totalServiceEWT in hours and minutes
      const hours = Math.floor(totalServiceEWT / 60);
      const minutes = totalServiceEWT % 60;

      const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;

      // Parse startTime from the request body into hours and minutes
      const [startHours, startMinutes] = startTime.split(':').map(Number);

      // Calculate endTime by adding formattedTime to startTime using Moment.js
      const startTimeMoment = moment(`${appointmentDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
      const endTimeMoment = startTimeMoment.clone().add(hours, 'hours').add(minutes, 'minutes');
      const endTime = endTimeMoment.format('HH:mm');

      const allAppointments = await getAppointmentbySalonId(salonId);

      const newAppDateFormatted = moment(appointmentDate).format('YYYY-MM-DD');

      const otherAppointments = allAppointments?.appointmentList?.filter(app => {
        if (app.barberId !== barberId) return false;

        const appDateFormatted = moment(app.appointmentDate).format('YYYY-MM-DD');
        if (appDateFormatted !== newAppDateFormatted) return false;

        if (app._id === appointmentId) return false; // exclude the current appointment

        return true;
      });

      const hasOverlap = otherAppointments?.some(app => {
        const appDateFormatted = moment(app.appointmentDate).format('YYYY-MM-DD');
        const existingStart = moment(`${appDateFormatted} ${app.startTime}`, 'YYYY-MM-DD HH:mm');
        const existingEnd = moment(`${appDateFormatted} ${app.endTime}`, 'YYYY-MM-DD HH:mm');

        return startTimeMoment.isBefore(existingEnd) && existingStart.isBefore(endTimeMoment);
      });

      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          message: 'The timeslot is already booked. Please check other slots',
        });
      }
      const newData = {
        barberId,
        services: serviceIds.map((id, index) => ({
          serviceId: id,
          serviceName: serviceNames[index],
          servicePrice: servicePrices[index],
          barberServiceEWT: barberServiceEWTs[index],
        })),
        appointmentDate,
        appointmentNotes,
        startTime,
        endTime,
      }

      //Fetch the appointment by its ID
      const existingAppointment = await updateAppointment(salonId, appointmentId, newData)

      if (!existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      const appointment = await getAppointmentsByAppointmentId(salonId, appointmentId)

      const salon = await getSalonBySalonId(salonId)

      // Send email to the customer about the rescheduled appointment
      const emailSubjectForCustomer = 'Your Appointment Has Been Rescheduled';
      const emailBodyForCustomer = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Rescheduled</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 200px;
                }
                .email-content {
                    background-color: #f8f8f8;
                    padding: 20px;
                    border-radius: 10px;
                }
                ul {
                    padding-left: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-content">
                    <div class="logo">
                        <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                    </div>
                    <h1 style="text-align: center;">Appointment Rescheduled</h1>
                    <p>Dear ${appointment.customerName},</p>
                    <p>Your appointment has been rescheduled. Below are the updated details:</p>
                    <ul>
                        <li><strong>Barber:</strong> ${barber.name}</li>
                        <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                         <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                        <li><strong>New Appointment Time:</strong> ${startTime} - ${endTime}</li>
                        <li><strong>Service Estimated Time:</strong> ${totalServiceEWT} minutes</li>

                    </ul>
                    <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                    <p>Best regards,</p>
                    <p style="margin: 0; padding: 10px 0 5px;">
                        ${salon.salonName}<br>
                        Contact No.: ${salon.contactTel}<br>
                        EmailId: ${salon.salonEmail}
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;
      try {
        await sendQueuePositionEmail(appointment.customerEmail, emailSubjectForCustomer, emailBodyForCustomer);
        console.log('Email sent to customer successfully.');
      } catch (error) {
        console.error('Error sending email to customer:', error);
      }

      const pushDevice = await getPushDevicesbyEmailId(appointment.customerEmail)

      const appointmentTitle = "Appointment Edited Successfully"

      if (pushDevice && pushDevice.deviceToken) {
        await sendAppointmentNotification(pushDevice.deviceToken, salon.salonName, appointment.customerName, pushDevice.deviceType, EDIT_APPOINTMENT, appointment.customerEmail, startTime, appointmentDate, appointmentTitle)
      }


      const notifications = await findNotificationUserByEmail(appointment.customerEmail);

      // Reverse the order of notifications and attach customer profile to each
      const latestnotifications = notifications.sentNotifications.reverse().map(notification => ({
        ...notification.toObject(),  // Convert Mongoose document to plain object
        salonLogo: customerSalon.salonLogo  // Attach customer details
      }));


      await io.to(`customer_${salonId}_${customerEmail}`).emit("receiveNotifications", latestnotifications);



      // Send email to the barber about the rescheduled appointment
      const emailSubjectForBarber = 'Rescheduled Appointment Details';
      const emailBodyForBarber = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Rescheduled</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 200px;
                }
                .email-content {
                    background-color: #f8f8f8;
                    padding: 20px;
                    border-radius: 10px;
                }
                ul {
                    padding-left: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-content">
                    <div class="logo">
                        <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                    </div>
                    <h1 style="text-align: center;">Rescheduled Appointment Details</h1>
                    <p>Dear ${barber.name},</p>
                    <p>You have a new rescheduled appointment. Below are the updated details:</p>
                    <ul>
                        <li><strong>Customer Name:</strong> ${appointment.customerName}</li>
                        <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                        <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                        <li><strong>New Appointment Time:</strong> ${startTime} - ${endTime}</li>
                        <li><strong>Service Estimated Time:</strong> ${totalServiceEWT} minutes</li>
                    </ul>
                    <p>Please make sure to be prepared for the appointment at the specified time.</p>
                    <p>Best regards,</p>
                    <p style="margin: 0; padding: 10px 0 5px;">
                        ${salon.salonName}<br>
                        Contact No.: ${salon.contactTel}<br>
                        EmailId: ${salon.salonEmail}
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;
      try {
        await sendQueuePositionEmail(barber.email, emailSubjectForBarber, emailBodyForBarber);
        console.log('Email sent to barber successfully.');
      } catch (error) {
        console.error('Error sending email to barber:', error);
      }

      return res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        response: existingAppointment,
      });
    }
    else {
      res.status(400).json({
        success: false,
        message: 'Barber not available for this date',
      });
    }
  } catch (error) {
    next(error);
  }
  finally {
    isLocked = false; // always release the lock
  }
};

//DESC:DELETE APPOINTMENT ====================
export const deleteAppointment = async (req, res, next) => {
  try {
    const { salonId, appointmentId } = req.body; // Assuming appointmentId is passed as a parameter

    const appointmentToDelete = await getDeletedAPpointmentById(salonId, appointmentId)

    const totalEWT = appointmentToDelete.services.reduce((sum, service) => {
      return sum + (service.barberServiceEWT || 0);
    }, 0);


    const serviceNames = appointmentToDelete.services.map(service => service.serviceName);
    console.log('Service Names:', serviceNames);


    // Find and remove the appointment by its ID
    const deletedAppointment = await deleteAppointmentById(salonId, appointmentId)


    if (!deletedAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const salon = await getSalonBySalonId(salonId)

    const pushDevice = await getPushDevicesbyEmailId(appointmentToDelete.customerEmail)

    const appointmentTitle = "Appointment Deleted Successfully"

    if (pushDevice && pushDevice.deviceToken) {
      await sendAppointmentNotification(pushDevice.deviceToken, salon.salonName, appointmentToDelete.customerName, pushDevice.deviceType, DELETE_APPOINTMENT, appointmentToDelete.customerEmail, appointmentToDelete.startTime, appointmentToDelete.appointmentDate, appointmentTitle)
    }

    const notifications = await findNotificationUserByEmail(appointmentToDelete.customerEmail);

    // Reverse the order of notifications and attach customer profile to each
    const latestnotifications = notifications.sentNotifications.reverse().map(notification => ({
      ...notification.toObject(),  // Convert Mongoose document to plain object
      salonLogo: customerSalon.salonLogo  // Attach customer details
    }));


    await io.to(`customer_${salonId}_${customerEmail}`).emit("receiveNotifications", latestnotifications);



    const barber = await getBarberByBarberId(appointmentToDelete.barberId)

    // Send email to the barber about the rescheduled appointment
    const emailSubjectForBarber = 'Deleted Appointment Details';
    const emailBodyForBarber = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Deleted</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 200px;
                }
                .email-content {
                    background-color: #f8f8f8;
                    padding: 20px;
                    border-radius: 10px;
                }
                ul {
                    padding-left: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-content">
                    <div class="logo">
                        <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                    </div>
                    <h1 style="text-align: center;">Rescheduled Appointment Details</h1>
                    <p>Dear ${barber.name},</p>
                    <p>You have a new rescheduled appointment. Below are the updated details:</p>
                    <ul>
                        <li><strong>Customer Name:</strong> ${appointmentToDelete.customerName}</li>
                        <li><strong>Service(s):</strong> ${serviceNames.join(', ')}</li>
                        <li><strong>Appointment Date:</strong> ${appointmentToDelete.appointmentDate}</li>
                        <li><strong>New Appointment Time:</strong> ${appointmentToDelete.startTime} - ${appointmentToDelete.endTime}</li>
                        <li><strong>Service Estimated Time:</strong> ${totalEWT} minutes</li>
                    </ul>
                    <p>Please make sure to be prepared for the appointment at the specified time.</p>
                    <p>Best regards,</p>
                    <p style="margin: 0; padding: 10px 0 5px;">
                        ${salon.salonName}<br>
                        Contact No.: ${salon.contactTel}<br>
                        EmailId: ${salon.salonEmail}
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;
    try {
      await sendQueuePositionEmail(barber.email, emailSubjectForBarber, emailBodyForBarber);
      console.log('Email sent to barber successfully.');
    } catch (error) {
      console.error('Error sending email to barber:', error);
    }


    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

//DESC:GET ENGAGE BARBER TIMESLOTS ====================
export const getEngageBarberTimeSlots = async (req, res, next) => {
  try {
    const { salonId, barberId, date } = req.body;

    if (!date || !barberId) {
      // If the date value is null, send a response to choose the date
      return res.status(400).json({
        success: false,
        message: 'Please choose a Date and Barber to fetch time slots'
      });
    }

    // Getting the appointments for a Specific Barber
    const appointments = await getAppointmentsByDateAndBarberId(salonId, date, barberId);

    let timeSlots = [];

    const selectedDay = moment(date, "YYYY-MM-DD").format("dddd");

    const barberBreaks = await getBarberBreakTimes(salonId, barberId, selectedDay)

    const barberReservations = await getBarberReservations(salonId, barberId, date)

    if (!appointments || appointments.length === 0) {
      // Generate time slots for the entire working hours as no appointments found
      const { appointmentSettings } = await getSalonSettings(salonId);
      const { appointmentStartTime, appointmentEndTime, intervalInMinutes } = appointmentSettings;

      //Generate the timeslots for the barber If no appointments
      const start = moment(appointmentStartTime, 'HH:mm');
      const end = moment(appointmentEndTime, 'HH:mm');

      timeSlots = await generateTimeSlots(start, end, intervalInMinutes);

      if (barberReservations) {
        timeSlots = timeSlots.map((slot) => {
          const slotTime = moment(slot.timeInterval, "HH:mm");

          // Check if the slot falls within any break time range
          const isReserved = barberReservations.some((reservedTime) => {
            const reservationStart = moment(reservedTime.startTime, "HH:mm");
            const reservationEnd = moment(reservedTime.endTime, "HH:mm");
            return slotTime.isBetween(reservationStart, reservationEnd, null, "[)");
          });

          return isReserved ? { ...slot, disabled: true } : slot;
        });
      }

      if (barberBreaks && barberBreaks.length > 0) {
        timeSlots = timeSlots.map((slot) => {
          const slotTime = moment(slot.timeInterval, "HH:mm");

          // Check if the slot falls within any break time range
          const isBreakTime = barberBreaks.some((breakTime) => {
            const breakStart = moment(breakTime.startTime, "HH:mm");
            const breakEnd = moment(breakTime.endTime, "HH:mm");
            return slotTime.isBetween(breakStart, breakEnd, null, "[)");
          });

          return isBreakTime ? { ...slot, disabled: true } : slot;
        });
      }
    } else {
      const appointmentList = appointments.map(appt => appt.appointmentList);

      // Generate time slots for the barber If have appointments
      const { appointmentSettings } = await getSalonSettings(salonId);
      const { appointmentStartTime, appointmentEndTime, intervalInMinutes } = appointmentSettings;

      const start = moment(appointmentStartTime, 'HH:mm');
      const end = moment(appointmentEndTime, 'HH:mm');

      timeSlots = await generateTimeSlots(start, end, intervalInMinutes);

      appointmentList.forEach(appointment => {
        const slotsInRange = appointment.timeSlots.split('-');
        const rangeStart = moment(slotsInRange[0], 'HH:mm');
        const rangeEnd = moment(slotsInRange[1], 'HH:mm');

        timeSlots = timeSlots.map(slot => {
          const slotTime = moment(slot.timeInterval, 'HH:mm');
          if (slotTime.isBetween(rangeStart, rangeEnd) || slotTime.isSame(rangeStart) || slotTime.isSame(rangeEnd)) {
            return { ...slot, disabled: true };
          }
          return slot;
        });
      });

      if (barberReservations) {
        timeSlots = timeSlots.map((slot) => {
          const slotTime = moment(slot.timeInterval, "HH:mm");

          // Check if the slot falls within any break time range
          const isReserved = barberReservations.some((reservedTime) => {
            const reservationStart = moment(reservedTime.startTime, "HH:mm");
            const reservationEnd = moment(reservedTime.endTime, "HH:mm");
            return slotTime.isBetween(reservationStart, reservationEnd, null, "[)");
          });

          return isReserved ? { ...slot, disabled: true } : slot;
        });
      }

      if (barberBreaks && barberBreaks.length > 0) {
        timeSlots = timeSlots.map((slot) => {
          const slotTime = moment(slot.timeInterval, "HH:mm");

          // Check if the slot falls within any break time range
          const isBreakTime = barberBreaks.some((breakTime) => {
            const breakStart = moment(breakTime.startTime, "HH:mm");
            const breakEnd = moment(breakTime.endTime, "HH:mm");
            return slotTime.isBetween(breakStart, breakEnd, null, "[)");
          });

          return isBreakTime ? { ...slot, disabled: true } : slot;
        });
      }
    }

    await io.to(`barber_${salonId}_${barberId}`).emit("timeslotsUpdated", timeSlots);

    return res.status(200).json({
      success: true,
      message: "Time slots retrieved and matched successfully",
      response: timeSlots
    });
  } catch (error) {
    //console.log(error);
    next(error);
  }
};

//DESC:GET ALL APPOINTMENTS BY SALON ID ====================
export const getAllAppointmentsBySalonId = async (req, res, next) => {
  try {
    const { salonId } = req.body;

    const appointments = await allAppointmentsBySalonId(salonId)

    if (!appointments || appointments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No appointments found for the provided salon ID',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      response: appointments.map(appointment => appointment.appointmentList),
    });
  } catch (error) {
    //console.log(error);
    next(error);
  }
};


//DESC:GET ALL APPOINTMENTS BY SALON ID AND DATE ====================
export const getAllAppointmentsBySalonIdAndDate = async (req, res, next) => {
  try {
    const { salonId, appointmentDate } = req.body;

    // Convert appointmentDate to ISO format (YYYY-MM-DD)

    const appointments = await allAppointmentsBySalonIdAndDate(salonId, appointmentDate)

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      response: appointments
    });
  } catch (error) {
    //console.log(error);
    next(error);
  }
};

//DESC:GET ALL APPOINTMENTS BY BARBERID ====================
export const getAllAppointmentsByBarberId = async (req, res, next) => {
  try {
    const { salonId, barberId } = req.body;

    const appointments = await allAppointmentsByBarberId(salonId, barberId)

    if (!appointments || appointments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No appointments found for the provided salon and barber ID',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      response: appointments.map(appointment => appointment.appointmentList),
    });
  }
  catch (error) {
    //console.log(error);
    next(error);
  }
};


//DESC:GET ALL APPOINTMENTS BY BARBER ID AND DATE ====================
export const getAllAppointmentsByBarberIdAndDate = async (req, res, next) => {
  try {
    const { salonId, barberId, appointmentDate } = req.body;

    const appointments = await allAppointmentsByBarberIdAndDate(salonId, barberId, appointmentDate)

    if (!appointments || appointments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No appointments found for the provided salon ID, barber ID, and date',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      response: appointments,
    });
  } catch (error) {
    //console.log(error);
    next(error);
  }
};

export const bookAppointmentBarbers = async (req, res, next) => {
  try {
    const { salonId, serviceIds } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return ErrorHandler('Service IDs are required and should be an array', ERROR_STATUS_CODE, res);
    }

    const barbers = await getBarbersBySalonIdForAppointments(salonId)

    if (barbers.length === 0) {
      return ErrorHandler(BOOK_APPOINTMENT_BARBER_RETRIEVE_ERROR, ERROR_STATUS_CODE, res)
    }


    // Step 2: Fetch detailed barber info first
    const filteredBarbers = [];

    for (const barber of barbers) {
      const barberDetails = await getBarberbyId(barber.barberId);

      if (
        serviceIds.every(requestedId =>
          barberDetails.barberServices.some(service => service.serviceId === requestedId)
        )) {
        filteredBarbers.push(barberDetails.toObject());
      }
    }

    if (filteredBarbers.length === 0) {
      return ErrorHandler('No barbers found for the given services', ERROR_STATUS_CODE, res);
    }

    // Format the barber details and fetch additional data using barberId
    // const formattedBarbers = await Promise.all(
    //   barbers.map(async barber => {
    //     const barberDetails = await getBarberbyId(barber.barberId); // Fetch barber details
    //     return {
    //       ...barberDetails.toObject(), // Add fetched barber details
    //     };
    //   })
    // );

    //Send only barbers whose services match
    return SuccessHandler(BOOK_APPOINTMENT_BARBER_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
      response: filteredBarbers,
    });

  }
  catch (error) {
    next(error);
  }
}


export const getallAppointmentsByCustomerEmail = async (req, res, next) => {
  try {
    const { salonId, customerEmail, status } = req.body;

    const getUpcomingAppointments = await getCustomerAppointments(salonId, customerEmail)

    const upcomingAppointments = getUpcomingAppointments.map(appointment => ({
      ...appointment,
      status: 'upcoming'
    }));

    const getCustomerHistoryAppointments = await getAppointmentsByCustomerEmail(salonId, customerEmail)

    // Combine both arrays
    let allAppointments = [...upcomingAppointments, ...getCustomerHistoryAppointments];

    if (status && status.toLowerCase() !== 'all') {
      allAppointments = allAppointments.filter(app => app.status === status);
    }

    const salon = await getSalonBySalonId(salonId);
    const salonServices = salon?.services || [];

    // 4. Enrich appointments with full service details
    allAppointments = allAppointments.map(app => {
      const enrichedServices = (app.services || []).map(serviceInApp => {
        const matched = salonServices.find(
          salonService => salonService.serviceId == serviceInApp.serviceId // allow string/number match
        );
        return matched || serviceInApp; // fallback to original if no match
      });

      return {
        ...app,
        services: enrichedServices
      };
    });


    // Sort by date ascending or descending (customize as needed)
    const sortedAppointments = allAppointments.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    await io.to(`salon_${salonId}`).emit("appointmentsUpdated", sortedAppointments);


    return SuccessHandler(CUSTOMER_APPOINTMENT_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
      response: sortedAppointments
    });
  }
  catch (error) {
    next(error);
  }
}
