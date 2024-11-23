import { validateEmail } from "../../middlewares/validator.js";
import { allAppointmentsByBarberId, allAppointmentsByBarberIdAndDate, allAppointmentsBySalonId, allAppointmentsBySalonIdAndDate, createNewAppointment, deleteAppointmentById, getAppointmentbyId, getAppointmentsByDateAndBarberId, updateAppointment } from "../../services/mobile/appointmentService.js";
import { getBarberbyId } from "../../services/mobile/barberService.js";
import { getSalonSettings } from "../../services/mobile/salonSettingsService.js";
import { generateTimeSlots } from "../../utils/timeSlots.js";

import moment from "moment";

//Creating Appointment
export const createAppointment = async (req, res, next) => {
  try {
    const { salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime, customerEmail, customerName, customerType, methodUsed } = req.body;

// Check if salonId is missing
if (!salonId) {
  return res.status(201).json({
    success: false,
    message: 'Please provide the salon ID.',
  });
}

// Check if barberId is missing
if (!barberId) {
  return res.status(201).json({
    success: false,
    message: 'Please provide the barber ID.',
  });
}

// Check if serviceId is missing
if (!serviceId) {
  return res.status(201).json({
    success: false,
    message: 'Please provide the service ID.',
  });
}

// Check if appointmentDate is missing
if (!appointmentDate) {
  return res.status(201).json({
    success: false,
    message: 'Please provide the appointment date.',
  });
}

// Check if startTime is missing
if (!startTime) {
  return res.status(201).json({
    success: false,
    message: 'Please provide the start time.',
  });
}

// Check if customerName is missing
if (!customerName || customerName.length < 1 || customerName.length > 20) {
  return res.status(201).json({
    success: false,
    message: 'Please provide the customer name.',
  });
}

// Check if customerName length less than 1 or more than 20
if (customerName.length < 1 || customerName.length > 20) {
  return res.status(201).json({
    success: false,
    message: 'Please enter a name that is between 1 and 20 characters in length.',
  });
}

    const email = customerEmail;

    // Validate email format
    if (!email || !validateEmail(email)) {
      return res.status(201).json({
        success: false,
        message: "Invalid Email "
      });
    }

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

    const existingAppointmentList = await getAppointmentbyId(salonId);// make this call in appointmentService
    console.log(existingAppointmentList, "appointment list")
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

    if (existingAppointmentList) {
      existingAppointmentList.appointmentList.push(newAppointment);
      await existingAppointmentList.save();
      res.status(200).json({
        success: true,
        message: "Appointment Confirmed",
        response: existingAppointmentList,
      });

      // const admin = await getAdminByEmail(salonId)
      // console.log(admin.email)
      // const adminEmail = admin.email;

      // // Send email for admin, barber, and customer
      // await sendAppointmentsEmailAdmin(adminEmail, startTime, customerName)

      // await sendAppointmentsEmailBarber(barber.email, barber.name, startTime)

      // await sendAppointmentsEmailCustomer(customerEmail, customerName, startTime)

    } else {
      const newAppointmentData = await createNewAppointment(salonId, newAppointment);

      const savedAppointment = await newAppointmentData.save();
      res.status(200).json({
        success: true,
        message: "Appointment Confirmed",
        response: savedAppointment,
      });
      // const admin = await getAdminByEmail(salonId)
      // console.log(admin.email)
      // const adminEmail = admin.email;

      //  // Send email for admin, barber, and customer
      //  await sendAppointmentsEmailAdmin(adminEmail, startTime, customerName);

      //  await sendAppointmentsEmailBarber(barber.email, barber.name, startTime);

      //  await sendAppointmentsEmailCustomer(customerEmail, customerName, startTime);

    }

  } catch (error) {
    console.log(error);
    next(error);
  }
};

//DESC:EDIT APPOINTMENT ====================
export const editAppointment = async (req, res, next) => {
  try {
    const { appointmentId, salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime } = req.body; // Assuming appointmentId is passed as a parameter

    // Check if required fields are missing
    if (!barberId || !serviceId || !appointmentDate || !startTime) {
      return res.status(201).json({
        success: false,
        message: 'Please fill all the fields',
      });
    }

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
      return res.status(201).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      response: existingAppointment,
    });
  } catch (error) {
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
    next(error);
  }
};