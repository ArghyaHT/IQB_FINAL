import { validateEmail } from "../../middlewares/validator.js";
import { allAppointmentsByBarberId, allAppointmentsByBarberIdAndDate, allAppointmentsBySalonId, allAppointmentsBySalonIdAndDate, createNewAppointment, deleteAppointmentById, getAppointmentbyId, getAppointmentsByDateAndBarberId, updateAppointment } from "../../services/mobile/appointmentService.js";
import { getBarberbyId } from "../../services/mobile/barberService.js";
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

//Creating Appointment
export const createAppointment = async (req, res, next) => {
  try {
    const { salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime, customerEmail, customerName, customerType, methodUsed } = req.body;


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
      } else {
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
      res.status(400).json({
        success: true,
        message: 'Barber updated his appointment days. please refresh the page',
      });
    }
  } catch (error) {
    next(error);
  }
};

//DESC:EDIT APPOINTMENT ====================
export const editAppointment = async (req, res, next) => {
  try {
    const { appointmentId, salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime } = req.body; // Assuming appointmentId is passed as a parameter

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

      // Fetch the appointment by its ID
      const existingAppointment = await updateAppointment(salonId, appointmentId, newData)

      if (!existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        response: existingAppointment,
      });
    }
    else {
      res.status(400).json({
        success: true,
        message: 'Barber updated his appointment days. please refresh the page',
      });
    }
  } catch (error) {
    next(error);
  }
};

//DESC:DELETE APPOINTMENT ====================
export const deleteAppointment = async (req, res, next) => {
  try {
    const { salonId, appointmentId } = req.body; // Assuming appointmentId is passed as a parameter

    // Find and remove the appointment by its ID
    const deletedAppointment = await deleteAppointmentById(salonId, appointmentId)

    if (!deletedAppointment) {
      return res.status(201).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.status(200).json({
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
      return res.status(201).json({
        success: false,
        message: 'Please choose a Date and Barber to fetch time slots'
      });
    }

    // Getting the appointments for a Specific Barber
    const appointments = await getAppointmentsByDateAndBarberId(salonId, date, barberId);

    let timeSlots = [];

    if (!appointments || appointments.length === 0) {
      // Generate time slots for the entire working hours as no appointments found
      const { appointmentSettings } = await getSalonSettings(salonId);
      const { appointmentStartTime, appointmentEndTime, intervalInMinutes } = appointmentSettings;

      //Generate the timeslots for the barber If no appointments
      const start = moment(appointmentStartTime, 'HH:mm');
      const end = moment(appointmentEndTime, 'HH:mm');

      timeSlots = await generateTimeSlots(start, end, intervalInMinutes);
    } else {
      const appointmentList = appointments.map(appt => appt.appointmentList);

      // Generate time slots for the barber If have appointments
      const { appointmentSettings } = await getSalonSettings(salonId);
      const { appointmentStartTime, appointmentEndTime, intervalInMinutes } = appointmentSettings;
      console.log(appointmentSettings)

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
    }
    res.status(200).json({
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
      return res.status(201).json({
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
      return res.status(201).json({
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
      return res.status(201).json({
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
    const { salonId } = req.body;

    const barbers = await getBarbersBySalonIdForAppointments(salonId)

    if (barbers.length === 0) {
      return ErrorHandler(BOOK_APPOINTMENT_BARBER_RETRIEVE_ERROR, ERROR_STATUS_CODE, res)
    }

    // Format the barber details and fetch additional data using barberId
    const formattedBarbers = await Promise.all(
      barbers.map(async barber => {
        const barberDetails = await getBarberbyId(barber.barberId); // Fetch barber details
        return {
          ...barberDetails.toObject(), // Add fetched barber details
        };
      })
    );

    // Return the full response with the modified appointmentDays
    return SuccessHandler(BOOK_APPOINTMENT_BARBER_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, {
      response: formattedBarbers
    });

  }
  catch (error) {
    next(error);
  }
}
