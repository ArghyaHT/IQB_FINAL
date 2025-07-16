import { findAdminByEmailandRole } from "../../../services/web/admin/adminService.js";
import { allAppointmentsByBarberId, allAppointmentsByBarberIdAndDate, allAppointmentsByMultipleBarberIds, allAppointmentsByMultipleBarberIdsAndDate, allAppointmentsBySalonId, allAppointmentsBySalonIdAndDate, cancelAppointmentByBarber, createNewAppointment, deleteAppointmentById, findAppointmentById, getAllAppointmentsByBarberIdAndSalonId, getAppointmentbySalonId, getAppointmentsByDateAndBarberId, servedOrcancelAppointment, todayAppointmentsByBarberId, updateAppointmentById } from "../../../services/web/appointments/appointmentsService.js";
import { getBarberbyId } from "../../../services/web/barber/barberService.js";
import { getSalonSettings } from "../../../services/web/salonSettings/salonSettingsService.js";
import { sendAppointmentsEmailAdmin, sendAppointmentsEmailBarber, sendAppointmentsEmailCustomer, sendQueuePositionEmail } from "../../../utils/emailSender/emailSender.js";
import moment from "moment";
import { generateTimeSlots } from "../../../utils/timeSlots.js";
import { addCancelAppointmentHistory, addCancelAppointmentHistoryByBarber, findOrCreateAppointmentHistory } from "../../../services/web/appointments/appointmentHistoryService.js";
import { RETRIEVE_TIMESLOT_SUCCESS, SELECT_BARBER_ERROR, SELECT_DATE_ERROR } from "../../../constants/web/AppointmentsConstants.js";

import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js"
import { SALON_NOT_FOUND_ERROR } from "../../../constants/web/SalonConstants.js";
import { getSalonBySalonId } from "../../../services/mobile/salonServices.js";
import { getBarberBreakTimes } from "../../../services/web/barberBreakTimes/barberBreakTimesService.js";
import { io } from "../../../utils/socket/socket.js";
import { getCustomerAppointments } from "../../../services/mobile/appointmentService.js";
import { getAppointmentsByCustomerEmail } from "../../../services/mobile/appointmentHistoryService.js";



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
            return res.status(200).json({
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
            return res.status(400).json({
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

        if (!barberId) {
            return ErrorHandler(SELECT_BARBER_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!date) {
            return ErrorHandler(SELECT_DATE_ERROR, ERROR_STATUS_CODE, res)
        }

        // Getting the appointments for a Specific Barber
        const appointments = await getAppointmentsByDateAndBarberId(salonId, date, barberId);


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

        return SuccessHandler(RETRIEVE_TIMESLOT_SUCCESS, SUCCESS_STATUS_CODE, res, { response: timeSlots })

        // res.status(200).json({
        //     message: "Time slots retrieved and matched successfully",
        //     timeSlots: timeSlots
        // });
    } catch (error) {
        next(error);
    }
};

//DESC:GET ALL APPOINTMENTS BY SALON ID ====================
export const getAllAppointmentsBySalonId = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        if (!salonId) {
            return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        const appointments = await allAppointmentsBySalonId(salonId)

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No appointments found for the provided salon ID',
                appointments: [],
            });
        }

        const fetchedAppointments = appointments.map(appointment => appointment.appointmentList)

        io.to(`salon_${salonId}`).emit("appointmentUpdated", fetchedAppointments);


        res.status(200).json({
            success: true,
            message: 'Appointments retrieved successfully',
            response: fetchedAppointments,
        });
    } catch (error) {
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
            return res.status(200).json({
                success: true,
                message: 'No appointments found for the provided salon Id, barber Id, and date',
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
        const { salonId, barberId, _id, appointmentDate } = req.body;

        // Find the appointment to be served
        const appointment = await findAppointmentById(_id, barberId, appointmentDate, salonId);

        // console.log(appointment)

        const customerEmail = appointment.appointmentList[0].customerEmail;

        if (!appointment) {
            return res.status(400).json({
                success: false,
                message: 'Appointment not found.',
            });
        }

        // Find or create the AppointmentHistory document for the salonId
        const historyEntry = await findOrCreateAppointmentHistory(salonId, appointment);

        // Remove the served appointment from the Appointment table
        await servedOrcancelAppointment(_id, barberId, appointmentDate, salonId);


        const updatedAppointments = await getAppointmentbySalonId(salonId);

        //customer appointments
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

        await io.to(`salon_${salonId}`).emit('appointmentsUpdated', updatedAppointments?.appointmentList || []);

        await io.to(`salon_${salonId}_customer_${customerEmail}`).emit('appointmentsUpdated', sortedAppointments);


        return res.status(200).json({
            success: true,
            message: 'Appointment served successfully.',
        });
    } catch (error) {
        next(error);
    }
};


//DESC:BARBER SERVED APPOINTMENT API ====================
export const customerCancelledAppointment = async (req, res, next) => {
    try {
        const { salonId, barberId, _id, appointmentDate } = req.body;

        // Find the appointment to be served
        const appointment = await findAppointmentById(_id, barberId, appointmentDate, salonId);

        const customerEmail = appointment.appointmentList[0].customerEmail;

        if (!appointment) {
            return res.status(400).json({
                success: false,
                message: 'Appointment not found.',
            });
        }

        // Find or create the AppointmentHistory document for the salonId
        const historyEntry = await addCancelAppointmentHistory(salonId, appointment);

        // Remove the served appointment from the Appointment table
        await servedOrcancelAppointment(_id, barberId, appointmentDate, salonId);

        const updatedAppointments = await getAppointmentbySalonId(salonId);

        //customer appointments
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

        await io.to(`salon_${salonId}`).emit('appointmentsUpdated', updatedAppointments?.appointmentList || []);

        await io.to(`salon_${salonId}_customer_${customerEmail}`).emit('appointmentsUpdated', sortedAppointments);

        return res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully.',
        });
    } catch (error) {
        next(error);
    }
};


export const barberCancelAppointment = async (req, res, next) => {
    try {
        const { salonId, barberId, appointmentDate, idsToCancel, subject, body } = req.body;

        if (!salonId || salonId === 0) {
            // Success response
            return ErrorHandler(
                "SalonId not present",
                ERROR_STATUS_CODE,
                res,
            );
        }

        if (!barberId || barberId === 0) {
            // Success response
            return ErrorHandler(
                "BarberId not present",
                ERROR_STATUS_CODE,
                res,
            );
        }

        if (!appointmentDate) {
            // Success response
            return ErrorHandler(
                "Appointment date not present",
                ERROR_STATUS_CODE,
                res,
            );
        }

        if (!subject || !body) {
            // Success response
            return ErrorHandler(
                "Subject or body not present",
                ERROR_STATUS_CODE,
                res,
            );
        }

        if (!Array.isArray(idsToCancel) || idsToCancel.length === 0) {
            // Return an error response indicating that 'idsToCancel' is missing or not an array
            return ErrorHandler(
                "'idsToCancel' is either missing or not a valid array.",
                ERROR_STATUS_CODE,
                res
            );
        }


        // Fetch the appointments to cancel
        // const appointmentToCancel = await appointmentsToCancel(salonId, idsToCancel);

        const barberAppointments = await getAllAppointmentsByBarberIdAndSalonId(salonId, barberId, appointmentDate);


        // Filter the appointments by matching _id directly (if they are stored as strings)
        const filteredAppointments = barberAppointments.filter(appointment =>
            idsToCancel.includes(appointment._id.toString()) // Convert _id to string for comparison
        );

        if (filteredAppointments.length === 0) {
            return ErrorHandler(
                "No matching appointments found to cancel.",
                ERROR_STATUS_CODE,
                res
            );
        }

        const cancelledAppointments = await cancelAppointmentByBarber(salonId, filteredAppointments)

        // Add canceled appointments to history
        await addCancelAppointmentHistoryByBarber(salonId, filteredAppointments);

        const salon = await getSalonBySalonId(salonId)

        for (const appointment of filteredAppointments) {

            const barberDetails = await getBarberbyId(appointment.barberId)

            const emailSubject = subject;
                    const emailBody = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Appointment Cancelled</title>
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
                        <h1 style="text-align: center;">Appointment Cancelled Details</h1>
                        <p>Dear ${appointment.customerName},</p>
                        <p>We regret to inform you that your appointment at our salon has been canceled. Below are the details of the canceled appointment:</p>
                        <ul>
                            <li><strong>Barber Name:</strong> ${barberDetails.name}</li>
                            <li><strong>Service(s):</strong> ${appointment.services.map(service => service.serviceName).join(', ')}</li>
                            <li><strong>Appointment Date:</strong> ${appointmentDate}</li>
                            <li><strong>Appointment Time:</strong> ${appointment.startTime} - ${appointment.endTime}</li>
                            <li><strong>Service Estimated Time:</strong> ${appointment.services.reduce((total, service) => total + service.barberServiceEWT, 0)} minutes</li>
                        </ul>
                        <p>We apologize for any inconvenience caused. If you'd like to reschedule your appointment or have any questions, feel free to contact the salon.</p>
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
                await sendQueuePositionEmail(appointment.customerEmail, emailSubject, emailBody);
                console.log('Email sent successfully.');
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }
        }

        const updatedAppointments = await getAppointmentbySalonId(salonId);

        await io.to(`salon_${salonId}`).emit('appointmentsUpdated', updatedAppointments?.appointmentList || []);


        //customer appointments
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


        await io.to(`salon_${salonId}_customer_${customerEmail}`).emit('appointmentsUpdated', sortedAppointments);



        // Success response
        return SuccessHandler(
            "Appointments canceled and added to history successfully.",
            SUCCESS_STATUS_CODE,
            res,
        );
    } catch (error) {
        // Handle unexpected errors
        next(error);
    }
};


export const getAllAppointmentsByMultipleBarberIds = async (req, res, next) => {
    try {
        const { salonId, barberIds } = req.body;

        const appointments = await allAppointmentsByMultipleBarberIds(salonId, barberIds)

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

export const getAllAppointmentsByMultipleBarberIdsAndDate = async (req, res, next) => {
    try {
        const { salonId, barberIds, appointmentDate } = req.body;

        const appointments = await allAppointmentsByMultipleBarberIdsAndDate(salonId, barberIds, appointmentDate)

        if (!appointments || appointments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No appointments found for the provided salon Id, barber Id, and date',
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


//DESC:GET ALL APPOINTMENTS BY BARBER ID AND DATE ====================
export const getAllAppointmentsByBarberIdForToday = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        const appointments = await todayAppointmentsByBarberId(salonId, barberId)

        if (!appointments || appointments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No appointments found for the provided salon Id, barber Id, and date',
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




