import { findAdminByEmailandRole } from "../../../services/web/admin/adminService.js";
import { allAppointmentsByBarberId, allAppointmentsByBarberIdAndDate, allAppointmentsBySalonId, allAppointmentsBySalonIdAndDate, createNewAppointment, deleteAppointmentById, findAppointmentById, getAppointmentbySalonId, getAppointmentsByDateAndBarberId, servedAppointment, updateAppointmentById } from "../../../services/web/appointments/appointmentsService.js";
import { getBarberbyId } from "../../../services/web/barber/barberService.js";
import { getSalonSettings } from "../../../services/web/salonSettings/salonSettingsService.js";
import { sendAppointmentsEmailAdmin, sendAppointmentsEmailBarber, sendAppointmentsEmailCustomer } from "../../../utils/emailSender/emailSender.js";
import moment from "moment";
import { generateTimeSlots } from "../../../utils/timeSlots.js";
import { findOrCreateAppointmentHistory } from "../../../services/web/appointments/appointmentHistoryService.js";
import { RETRIEVE_TIMESLOT_SUCCESS, SELECT_BARBER_ERROR, SELECT_DATE_ERROR } from "../../../constants/web/AppointmentsConstants.js";

import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import {SuccessHandler} from "../../../middlewares/SuccessHandler.js"
import { SALON_NOT_FOUND_ERROR } from "../../../constants/web/SalonConstants.js";


//DESC:CREATE APPOINTMENT ====================
export const createAppointment = async (req, res, next) => {
    try {
        const { salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime, customerEmail, customerName, customerType, methodUsed } = req.body;
    
        // // Check if required fields are missing
        // if (!salonId || !barberId || !serviceId || !appointmentDate || !startTime || !customerName) {
        //   return res.status(400).json({
        //     message: 'Please fill all the fields',
        //   });
        // }
    
        // const email = customerEmail;
    
        // // Validate email format
        // if (!email || !validateEmail(email)) {
        //   return res.status(400).json({
        //     success: false,
        //     message: "Invalid Email "
        //   });
        // }
    
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
    
        //   const adminEmail = await Admin.findOne({ salonId }).select("email")
    
        //   // Prepare email data for admin, barber, and customer
        //   const adminEmailData = {
        //     email: adminEmail, // Replace with the admin's email address
        //     subject: 'New Appointment Created',
        //     html: `
        //     <h2>Hello Admin!</h2>
        //     <p>A new appointment has been created at ${startTime} by ${customerName}.</p>
        //     <!-- Add more details here -->
        //   `,
        //   };
    
        //   const barberEmailData = {
        //     email: barber.email, // Replace with the barber's email address
        //     subject: 'New Appointment Created',
        //     html: `
        //     <h2>Hello ${barber.name}!</h2>
        //     <p>You have a new appointment scheduled at ${startTime}.</p>
        //     <!-- Add more details here -->
        //   `,
        //   };
    
        //   const customerEmailData = {
        //     email: customerEmail, // Replace with the customer's email address
        //     subject: 'Appointment Confirmation',
        //     html: `
        //     <h2>Hello ${customerName}!</h2>
        //     <p>Your appointment has been confirmed at ${startTime}.</p>
        //     <!-- Add more details here -->
        //   `,
        //   };
    
        //   // Combine email data objects into an array
        //   const emailDataArray = [adminEmailData, barberEmailData, customerEmailData];
    
        //   // Send emails to admin, barber, and customer
        //   sendAppointmentsEmail(emailDataArray);
        } else {
          const newAppointmentData = await createNewAppointment(salonId, newAppointment)
          const savedAppointment = await newAppointmentData.save();
          res.status(200).json({
            success: true,
            message: "Appointment Confirmed",
            response: savedAppointment,
          });
        //   const adminEmail = await Admin.findOne({ salonId }).select("email")
    
    
        //   // Prepare email data for admin, barber, and customer
        //   const adminEmailData = {
        //     email: adminEmail, // Replace with the admin's email address
        //     subject: 'New Appointment Created',
        //     html: `
        //           <h2>Hello Admin!</h2>
        //           <p>A new appointment has been created at ${startTime} by ${customerName}.</p>
        //           <!-- Add more details here -->
        //         `,
        //   };
    
        //   const barberEmailData = {
        //     email: barber.email, // Replace with the barber's email address
        //     subject: 'New Appointment Created',
        //     html: `
        //     <h2>Hello ${barber.name}!</h2>
        //           <p>You have a new appointment scheduled at ${startTime}.</p>
        //           <!-- Add more details here -->
        //         `,
        //   };
    
        //   const customerEmailData = {
        //     email: customerEmail, // Replace with the customer's email address
        //     subject: 'Appointment Confirmation',
        //     html: `
        //     <h2>Hello ${customerName}!</h2>
        //           <p>Your appointment has been confirmed at ${startTime}.</p>
        //           <!-- Add more details here -->
        //         `,
        //   };
        //   // Combine email data objects into an array
        //   const emailDataArray = [adminEmailData, barberEmailData, customerEmailData];
    
        //   // Send emails to admin, barber, and customer
        //   sendAppointmentsEmail(emailDataArray);
    
        }
    
      } catch (error) {
        //console.log(error);
        next(error);
      }
};

//DESC:EDIT APPOINTMENT ====================
export const editAppointment = async (req, res, next) => {
    try {
        const { appointmentId, salonId, barberId, serviceId, appointmentDate, appointmentNotes, startTime } = req.body; // Assuming appointmentId is passed as a parameter

        // Fetch barber information
        const barber = await getBarberbyId(barberId)
        // Calculate total serviceEWT for all provided serviceIds
        let totalServiceEWT = 0;
        let serviceIds = "";
        if (barber && barber.barberServices) {
            // Convert single serviceId to an array if it's not already an array
            const services = Array.isArray(serviceId) ? serviceId : [serviceId];

            services.forEach(id => {
                const service = barber.barberServices.find(service => service.serviceId === id);
                if (service) {
                    totalServiceEWT += service.barberServiceEWT || 0;

                    if (serviceIds) {
                        serviceIds += "-";
                    }
                    serviceIds += service.serviceId.toString();
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

        const updateFields = {
            barberId,
            serviceIds,
            appointmentDate,
            appointmentNotes,
            startTime,
            endTime,
        }


        // Fetch the appointment by its ID
        const existingAppointment = await updateAppointmentById(salonId, appointmentId, updateFields)

        if (!existingAppointment) {
            return res.status(404).json({
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
        //console.log(error);
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
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Appointment deleted successfully',
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC:GET ENGAGE BARBER TIMESLOTS ====================
export const getEngageBarberTimeSlots = async (req, res, next) => {
    try {
        const { salonId, barberId, date } = req.body;

        if(!barberId){
            return ErrorHandler(SELECT_BARBER_ERROR, ERROR_STATUS_CODE, res)
        }

        if(!date) {
            return ErrorHandler(SELECT_DATE_ERROR, ERROR_STATUS_CODE, res)
        }


        // if (!date || !barberId) {
        //     // If the date value is null, send a response to choose the date
        //     return res.status(400).json({
        //         message: 'Please choose a Date and Barber to fetch time slots'
        //     });
        // }

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

        return SuccessHandler(RETRIEVE_TIMESLOT_SUCCESS, SUCCESS_STATUS_CODE, res, {response: timeSlots})

        // res.status(200).json({
        //     message: "Time slots retrieved and matched successfully",
        //     timeSlots: timeSlots
        // });
    }catch (error) {
        //console.log(error);
        next(error);
    }
};


//DESC:GET ALL APPOINTMENTS BY SALON ID ====================
export const getAllAppointmentsBySalonId = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        if(!salonId){
            return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE,res)
        }

        const appointments = await allAppointmentsBySalonId(salonId)

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No appointments found for the provided salon ID',
                appointments: [],
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
            return res.status(404).json({
                success: false,
                message: 'No appointments found for the provided salon and barber ID',
                appointments: [],
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
            return res.status(404).json({
                success: false,
                message: 'No appointments found for the provided salon ID, barber ID, and date',
                response: [],
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

//DESC:BARBER SERVED APPOINTMENT API ====================
export const barberServedAppointment = async (req, res, next) => {
    try {
        const { salonId, barberId, serviceId, _id, appointmentDate } = req.body;

        // Find the appointment to be served
        const appointment = await findAppointmentById(_id, serviceId, barberId, appointmentDate, salonId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found.',
            });
        }

          // Find or create the AppointmentHistory document for the salonId
          const historyEntry = await findOrCreateAppointmentHistory(salonId, appointment);

        // Remove the served appointment from the Appointment table
        await servedAppointment(_id, serviceId, barberId, appointmentDate, salonId);

        return res.status(200).json({
            success: true,
            message: 'Appointment served successfully.',
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};


