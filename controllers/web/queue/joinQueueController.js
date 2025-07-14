import { validateEmail } from "../../../middlewares/validator.js";
import { checkSalonExists, getSalonBySalonId } from "../../../services/web/admin/salonService.js";
import { availableBarberAutoJoin, decreaseBarberEWT, decreaseBarberEWTWhenQCancel, findBarberByBarberEmailAndSalonId, getBarberByBarberId, getBarbersForQ, getBarbersWithMulServiceId, updateBarberEWT } from "../../../services/web/barber/barberService.js";
import { addQueueHistory, addQueueHistoryWhenCanceled, findSalonQueueListHistory, qhistoryByCustomer, statusCancelQ, updateServed } from "../../../services/web/queue/joinQueueHistoryService.js";
import { addGroupJoin, addNewQueue, findCustomersToMail, findSalonQueueList, getSalonQlist, qListByBarberId } from "../../../services/web/queue/joinQueueService.js";
import { sendQueuePositionChangedEmail, sendQueuePositionEmail } from "../../../utils/emailSender/emailSender.js";
import { addCustomerToQueue } from "../../../utils/queue/queueUtils.js";
import bcrypt from "bcrypt";

import moment from "moment";
import { errorApiHandler, responseHandler } from "../../../utils/response/response.js";
import { findAdminByEmailAndSalonId } from "../../../services/web/admin/adminService.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SALON_NOT_FOUND_ERROR } from "../../../constants/web/SalonConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { ADMIN_NOT_EXIST_ERROR, INVALID_EMAIL_ERROR } from "../../../constants/web/adminConstants.js";
import { NO_SALON_CONNECTED_ERROR, QUEUE_CANCEL_SUCCESS, QUEUE_NOT_FOUND_BY_ID_ERROR, QUEUE_NOT_FOUND_ERROR, QUEUE_POSITION_ERROR, QUEUE_SERVE_SUCCESS, QUEUELIST_BARBER_ERROR, QUEUELIST_EMPTY_FOR_BARBER_SUCCESS, RETRIVE_EMPTY_QUEUELIST_SUCCESS, RETRIVE_QUEUELIST_SUCCESS } from "../../../constants/web/QueueConstants.js";
import { BARBER_EXISTS_ERROR } from "../../../constants/web/BarberConstants.js";
import SalonQueueList from "../../../models/salonQueueListModel.js";
import { findBarberByEmailAndRole, getAllSalonBarbersForTV } from "../../../services/kiosk/barber/barberService.js";
import { getPushDevicesbyEmailId } from "../../../services/mobile/pushDeviceTokensService.js";
import { NEW_QUEUE_ADD, NEW_QUEUE_UPDATED, QUEUE_POSITION_CHANGE } from "../../../constants/mobile/NotificationConstants.js";
import { sendQueueNotification, sendQueueUpdateNotification } from "../../../utils/pushNotifications/pushNotifications.js";
import { io } from "../../../utils/socket/socket.js";


//DESC:GET SALON QUEUELIST ================
export const getQueueListBySalonId = async (req, res, next) => {
    try {
        const salonId = parseInt(req.query.salonId, 10);


        if (Number(salonId) === 0) {
            return ErrorHandler(NO_SALON_CONNECTED_ERROR, ERROR_STATUS_CODE, res)
        }

        const salonExists = await checkSalonExists(salonId); // Assuming checkSalonExists is a function that checks if the salon exists

        if (!salonExists) {
            return ErrorHandler(SALON_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        //To find the queueList according to salonId and sort it according to qposition
        const getSalon = await getSalonQlist(salonId)


        if (getSalon) {
            getSalon.sort((a, b) => a.qPosition - b.qPosition); // Ascending order
        }

        const sortedQlist = getSalon;

        io.to(`salon_${salonId}`).emit("queueUpdated", sortedQlist);

        //     io.to(`salon_${salonId}`).emit("queueUpdated", {
        //     success: true,
        //     status: SUCCESS_STATUS_CODE,
        //     message: RETRIVE_QUEUELIST_SUCCESS,
        //     response: sortedQlist
        // });

        return SuccessHandler(RETRIVE_QUEUELIST_SUCCESS, SUCCESS_STATUS_CODE, res, { response: sortedQlist })

    }
    catch (error) {
        next(error);
    }
}

//DESC:BARBER SERVED API ================
export const barberServedQueue = async (req, res, next) => {
    try {
        let { salonId, barberId, servedByEmail, barberEmail, adminEmail, services, _id } = req.body;


        if (adminEmail && !validateEmail(adminEmail)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }


        if (barberEmail && !validateEmail(barberEmail)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        // Convert email to lowercase
        if (adminEmail) {
            adminEmail = adminEmail.toLowerCase();
        }
        else {
            barberEmail = barberEmail.toLowerCase();
        }

        if (adminEmail) {
            const foundUser = await findAdminByEmailAndSalonId(adminEmail, salonId);

            if (!foundUser) {
                return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
            }

            const updatedByBarberEmail = foundUser.email;

            const servedBybarber = await findBarberByEmailAndRole(servedByEmail)

            const servedByBarberEmail = servedByEmail

            const queue = await findSalonQueueList(salonId);

            let currentServiceEWT = 0;
            let updatedQueueList = [];

            if (queue && queue.queueList && queue.queueList.length > 0) {
                for (const element of queue.queueList) {

                    // Check if all requested services match the services in the queue element
                    const allServicesMatch = services.every(requestedService => {
                        return element.services.some(queueService => queueService.serviceId === requestedService.serviceId);
                    });

                    if (
                        element.qPosition === 1 &&
                        allServicesMatch &&
                        element.barberId === barberId &&
                        element._id.toString() === _id
                    ) {
                        currentServiceEWT = element.serviceEWT;
                        const salon = await findSalonQueueListHistory(salonId);

                        if (!salon) {
                            await addQueueHistory(salonId, element, updatedByBarberEmail, servedByBarberEmail, servedBybarber.barberId, servedBybarber.name, true)
                        } else {
                            salon.queueList.push({
                                ...element.toObject(), // Convert Mongoose document to plain object
                                servedByBarberEmail: servedByBarberEmail,
                                updatedByBarberEmail: updatedByBarberEmail,
                                barberName: servedBybarber.name,
                                barberId: servedBybarber.barberId,
                                isAdmin: true
                            });
                            await salon.save();
                        }
                        // Update the status to "served" for the served queue in JoinedQueueHistory
                        await updateServed(salonId, element._id);


                        const salonDetails = await getSalonBySalonId(salonId);
                        // Construct email subject and body for the customer being served
                        const servedEmailSubject = `${salonDetails.salonName}-🎉 Served Successfully! 🎉`;
                        const servedEmailBody = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>You have been served!</title>
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
                                    background-color: #f8f8f8;
                                    border-radius: 10px;
                                }
                                .header {
                                    text-align: center;
                                    color: #333;
                                    margin-bottom: 20px;
                                }
                                .details {
                                    margin-bottom: 20px;
                                }
                                .details ul {
                                    list-style-type: none;
                                    padding: 0;
                                }
                                .details li {
                                    margin-bottom: 5px;
                                }
                                .visit {
                                    text-align: center;
                                    margin-top: 20px;
                                    font-weight: bold;
                                    color: #007bff;
                                    font-size: 20px; /* Adjust the font size as needed */
                                }
                                .logo {
                                    text-align: center;
                                    margin-bottom: 20px;
                                }
                                 .logo img {
                                    max-width: 200px;
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
                                    }
                            </style>
                        </head>
                        <body>
                        
                            <div class="container">
                                <div class="logo">
                                    <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                                </div>
                                <h1 class="header">🎉 You have been served successfully! 🎉</h1>
                                <div class="details">
                                    <p>Dear ${element.customerName},</p>
                                    <p>We are excited to inform you that you have been served successfully. Here are the details:</p>
                                    <ul>
                                        <li>Salon Name: ${salonDetails.salonName}</li>
                                        <li>Barber Name: ${element.barberName}</li>
                                        <li>Service Time: ${element.serviceEWT} mins(approx.)</li>
                                    </ul>
                                </div>
                                <div class="visit">
                                    <p>DO VISIT AGAIN</p>
                                </div>
                                <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                <p>Best regards,<br>
                                ${salonDetails.salonName}<br>
                                Contact No.: ${salonDetails.contactTel}<br>
                                EmailId: ${salonDetails.salonEmail}</p>
                            </div>
                        </body>
                        </html>
    `;

                        // Send email to the customer who is getting served
                        try {
                            if (element.customerEmail) {
                                await sendQueuePositionEmail(element.customerEmail, servedEmailSubject, servedEmailBody);
                            }
                        } catch (error) {
                            console.error('Error sending email to the served customer:', error);
                            // Handle error if email sending fails
                        }


                    } else if (element.barberId === barberId && element._id.toString() !== _id) {
                        updatedQueueList.push({
                            ...element.toObject(),
                            qPosition: element.qPosition > 1 ? element.qPosition - 1 : element.qPosition,
                            customerEWT: element.qPosition > 1 ? element.customerEWT - currentServiceEWT : element.customerEWT,
                        });
                    } else {
                        updatedQueueList.push(element);
                    }
                }

                if (currentServiceEWT > 0) {
                    queue.queueList = updatedQueueList;
                    await queue.save();

                    const updatedBarber = await decreaseBarberEWT(salonId, barberId, currentServiceEWT)

                    const customers = await findCustomersToMail(salonId, barberId)

                    const updatedBarbers = await getAllSalonBarbersForTV(salonId); // ✅ fetch updated barbers
                    io.to(`salon_${salonId}`).emit("barberListUpdated", updatedBarbers);

                    //Live data for barber updated queue

                    const qListByBarber = await qListByBarberId(salonId, barberId)

                    const sortedQlist = qListByBarber.sort((a, b) => a.qPosition - b.qPosition)

                    const approvedBarber = await getBarberByBarberId(barberId);

                    // await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", {
                    //     salonId,
                    //     barberId,
                    //     queueList: sortedQlist,
                    //     barberName: approvedBarber.name,
                    // });

                    await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", sortedQlist);


                    if (customers && customers.length > 0) {
                        for (const customer of customers) {
                            if (customer.queueList && Array.isArray(customer.queueList)) {
                                for (const queueItem of customer.queueList) {
                                    const salon = await getSalonBySalonId(salonId);
                                    const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                                    const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                                    const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                                    const pushDevice = await getPushDevicesbyEmailId(customerEmail)
                                    console.log('Push device:', pushDevice);

                                    const titleText = "Queue position updated successfully"


                                    if (pushDevice && pushDevice.deviceToken) {
                                        await sendQueueUpdateNotification(pushDevice.deviceToken, salon.salonName, qPosition, customerName, pushDevice.deviceType, NEW_QUEUE_UPDATED, customerEmail, titleText)
                                        console.log('Notification sent successfully from addCustomerToQueue');

                                    }

                                    const emailSubject = `${salon.salonName}-Queue Position Changed (${qPosition})`;
                                    const emailBody = `
                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Queue Position Changed</title>
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
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
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
                                        <h1 style="text-align: center;">Queue Position Changed</h1>
                                        <p>Dear ${customerName},</p>
                                        <p>Your queue position has changed. Here are the updated details:</p>
                                        <ul>
                                            <li>Customer Name: ${customerName}</li>
                                            <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                            <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                            <li>Barber Name: ${barberName}</li>
                                            <li>Service Price: $${totalServicePrice}</li>
                                            <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                            <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                            <li>New Queue Position: ${qPosition}</li>
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
                                        if (customerEmail) {
                                            await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                                        }
                                    } catch (error) {
                                        console.error('Error sending email:', error);
                                        // Handle error if email sending fails
                                    }
                                }
                            }
                        }
                    }

                    return SuccessHandler(QUEUE_SERVE_SUCCESS, SUCCESS_STATUS_CODE, res)

                }
                return ErrorHandler(QUEUE_POSITION_ERROR, ERROR_STATUS_CODE, res)
            }
        }
        else {
            const foundUser = await findBarberByBarberEmailAndSalonId(barberEmail, salonId);

            if (!foundUser) {
                return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
            }

            const updatedByBarberEmail = foundUser.email;

            const servedBybarber = await findBarberByEmailAndRole(servedByEmail)

            const servedByBarberEmail = servedByEmail

            const queue = await findSalonQueueList(salonId);
            let currentServiceEWT = 0;
            let updatedQueueList = [];

            if (queue && queue.queueList && queue.queueList.length > 0) {
                for (const element of queue.queueList) {

                    // Check if all requested services match the services in the queue element
                    const allServicesMatch = services.every(requestedService => {
                        return element.services.some(queueService => queueService.serviceId === requestedService.serviceId);
                    });

                    if (
                        element.qPosition === 1 &&
                        allServicesMatch &&
                        element.barberId === barberId &&
                        element._id.toString() === _id
                    ) {
                        currentServiceEWT = element.serviceEWT;
                        const salon = await findSalonQueueListHistory(salonId);

                        if (!salon) {
                            await addQueueHistory(salonId, element, updatedByBarberEmail, servedByBarberEmail, servedBybarber.barberId, servedBybarber.name, false)
                        } else {
                            salon.queueList.push({
                                ...element.toObject(), // Convert Mongoose document to plain object
                                servedByBarberEmail: servedByBarberEmail,
                                updatedByBarberEmail: updatedByBarberEmail,
                                barberName: servedBybarber.name,
                                barberId: servedBybarber.barberId

                            });
                            await salon.save();
                        }
                        // Update the status to "served" for the served queue in JoinedQueueHistory
                        await updateServed(salonId, element._id);

                        const salonDetails = await getSalonBySalonId(salonId);
                        // Construct email subject and body for the customer being served
                        const servedEmailSubject = `${salonDetails.salonName}-🎉 Served Successfully! 🎉`;
                        const servedEmailBody = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>You have been served!</title>
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
                                    background-color: #f8f8f8;
                                    border-radius: 10px;
                                }
                                .header {
                                    text-align: center;
                                    color: #333;
                                    margin-bottom: 20px;
                                }
                                .details {
                                    margin-bottom: 20px;
                                }
                                .details ul {
                                    list-style-type: none;
                                    padding: 0;
                                }
                                .details li {
                                    margin-bottom: 5px;
                                }
                                .visit {
                                    text-align: center;
                                    margin-top: 20px;
                                    font-weight: bold;
                                    color: #007bff;
                                    font-size: 20px; /* Adjust the font size as needed */
                                }
                                .logo {
                                    text-align: center;
                                    margin-bottom: 20px;
                                }
                               .logo img {
                                    max-width: 200px;
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
                                    }
                            </style>
                        </head>
                        <body>
                        
                            <div class="container">
                                <div class="logo">
                                    <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                                </div>
                                <h1 class="header">🎉 You have been served successfully! 🎉</h1>
                                <div class="details">
                                    <p>Dear ${element.customerName},</p>
                                    <p>We are excited to inform you that you have been served successfully. Here are the details:</p>
                                    <ul>
                                        <li>Salon Name: ${salonDetails.salonName}</li>
                                        <li>Barber Name: ${element.barberName}</li>
                                        <li>Service Time: ${element.serviceEWT} mins(approx.)</li>
                                    </ul>
                                </div>
                                <div class="visit">
                                    <p>DO VISIT AGAIN</p>
                                </div>
                                <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                <p>Best regards,<br>
                                ${salonDetails.salonName}<br>
                                Contact No.: ${salonDetails.contactTel}<br>
                                EmailId: ${salonDetails.salonEmail}</p>
                            </div>
                        </body>
                        </html>
    `;

                        // Send email to the customer who is getting served
                        try {
                            if (element.customerEmail) {
                                await sendQueuePositionEmail(element.customerEmail, servedEmailSubject, servedEmailBody);
                            }
                        } catch (error) {
                            console.error('Error sending email to the served customer:', error);
                            // Handle error if email sending fails
                        }


                    } else if (element.barberId === barberId && element._id.toString() !== _id) {
                        updatedQueueList.push({
                            ...element.toObject(),
                            qPosition: element.qPosition > 1 ? element.qPosition - 1 : element.qPosition,
                            customerEWT: element.qPosition > 1 ? element.customerEWT - currentServiceEWT : element.customerEWT,
                        });
                    } else {
                        updatedQueueList.push(element);
                    }
                }

                if (currentServiceEWT > 0) {
                    queue.queueList = updatedQueueList;
                    await queue.save();

                    const updatedBarber = await decreaseBarberEWT(salonId, barberId, currentServiceEWT)

                    const enrichedQueueList = await getSalonQlist(salonId);

                    // Check if the queueList exists or if it's empty
                    if (enrichedQueueList) {
                        // Sort the queue list in ascending order based on qPosition
                        enrichedQueueList.sort((a, b) => a.qPosition - b.qPosition); // Ascending order

                        // Emit the updated queue list to the salon
                        await io.to(`salon_${salonId}`).emit("queueUpdated", enrichedQueueList);
                    }


                    const updatedBarbers = await getAllSalonBarbersForTV(salonId); // ✅ fetch updated barbers
                    io.to(`salon_${salonId}`).emit("barberListUpdated", updatedBarbers);

                    //Live data render for barber served queue
                    const qListByBarber = await qListByBarberId(salonId, barberId)

                    const sortedQlist = qListByBarber.sort((a, b) => a.qPosition - b.qPosition)

                    const approvedBarber = await getBarberByBarberId(barberId);

                    // await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", {
                    //     salonId,
                    //     barberId,
                    //     queueList: sortedQlist,
                    //     barberName: approvedBarber.name,
                    // });

                    await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", sortedQlist);


                    const customers = await findCustomersToMail(salonId, barberId)

                    if (customers && customers.length > 0) {
                        for (const customer of customers) {
                            if (customer.queueList && Array.isArray(customer.queueList)) {
                                for (const queueItem of customer.queueList) {
                                    const salon = await getSalonBySalonId(salonId);
                                    const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                                    const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                                    const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                                    const emailSubject = `${salon.salonName}-Queue Position Changed (${qPosition})`;
                                    const emailBody = `
                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Queue Position Changed</title>
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
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
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
                                        <h1 style="text-align: center;">Queue Position Changed</h1>
                                        <p>Dear ${customerName},</p>
                                        <p>Your queue position has changed. Here are the updated details:</p>
                                        <ul>
                                            <li>Customer Name: ${customerName}</li>
                                            <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                            <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                            <li>Barber Name: ${barberName}</li>
                                            <li>Service Price: $${totalServicePrice}</li>
                                            <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                            <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                            <li>New Queue Position: ${qPosition}</li>
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
                                        if (customerEmail) {
                                            await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                                        }
                                    } catch (error) {
                                        console.error('Error sending email:', error);
                                        // Handle error if email sending fails
                                    }

                                    const pushDevice = await getPushDevicesbyEmailId(customerEmail)

                                    if (pushDevice && pushDevice.deviceToken) {
                                        await sendQueueUpdateNotification(pushDevice.deviceToken, salon.salonName, qPosition, customerName, pushDevice.deviceType, QUEUE_POSITION_CHANGE, customerEmail, dateJoinedQ)
                                    }
                                }
                            }
                        }
                    }


                    return SuccessHandler(QUEUE_SERVE_SUCCESS, SUCCESS_STATUS_CODE, res)

                }
            }
            return ErrorHandler(QUEUE_POSITION_ERROR, ERROR_STATUS_CODE, res)
        }

    } catch (error) {
        next(error);
    }
};

//DESC:CANCEL QUEUE ================
export const cancelQueue = async (req, res, next) => {
    try {
        let { salonId, barberEmail, adminEmail, barberId, _id } = req.body;

        if (adminEmail && !validateEmail(adminEmail)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        if (barberEmail && !validateEmail(barberEmail)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        // Convert email to lowercase
        if (adminEmail) {
            adminEmail = adminEmail.toLowerCase();
        }
        else {
            barberEmail = barberEmail.toLowerCase();
        }

        let foundUser, updatedByBarberEmail;

        if (adminEmail) {
            foundUser = await findAdminByEmailAndSalonId(adminEmail, salonId);
            if (!foundUser) {
                return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
            }

            updatedByBarberEmail = foundUser.email;

        } else {
            foundUser = await findBarberByBarberEmailAndSalonId(barberEmail, salonId);
            if (!foundUser) {
                return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
            }
            updatedByBarberEmail = foundUser.email;
        }

        const updatedQueue = await findSalonQueueList(salonId);

        if (!updatedQueue) {
            return ErrorHandler(QUEUE_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        const canceledQueueIndex = updatedQueue.queueList.findIndex(queue => queue._id.toString() === _id);
        if (canceledQueueIndex === -1) {
            return ErrorHandler(QUEUE_NOT_FOUND_BY_ID_ERROR, ERROR_STATUS_CODE, res)
        }

        const canceledServiceEWT = updatedQueue.queueList[canceledQueueIndex].serviceEWT;
        const canceledQueue = updatedQueue.queueList.splice(canceledQueueIndex, 1)[0];

        // Update positions and waiting times for subsequent queues
        updatedQueue.queueList.forEach(queue => {
            if (queue.barberId === barberId && queue.qPosition > canceledQueue.qPosition) {
                queue.qPosition -= 1;
                queue.customerEWT -= canceledServiceEWT;
            }
        });

        await updatedQueue.save();
        await decreaseBarberEWTWhenQCancel(salonId, barberId, canceledServiceEWT);

        let salon = await findSalonQueueListHistory(salonId);
        if (!salon) {
            salon = await addQueueHistoryWhenCanceled(salonId, canceledQueue, updatedByBarberEmail);
        } else {
            salon.queueList.push({
                ...canceledQueue.toObject(),
                updatedByBarberEmail,
                isAdmin: !!adminEmail
            });
            await salon.save();
        }

        await statusCancelQ(salonId, _id);

        const enrichedQueueList = await getSalonQlist(salonId);

        // Check if the queueList exists or if it's empty
        if (enrichedQueueList) {
            // Sort the queue list in ascending order based on qPosition
            enrichedQueueList.sort((a, b) => a.qPosition - b.qPosition); // Ascending order

            // Emit the updated queue list to the salon
            await io.to(`salon_${salonId}`).emit("queueUpdated", enrichedQueueList);
        }


        const updatedBarbers = await getAllSalonBarbersForTV(salonId); // ✅ fetch updated barbers
        io.to(`salon_${salonId}`).emit("barberListUpdated", updatedBarbers);

        //Live data render for barber served queue
        const qListByBarber = await qListByBarberId(salonId, barberId)

        const sortedQlist = qListByBarber.sort((a, b) => a.qPosition - b.qPosition)

        const approvedBarber = await getBarberByBarberId(barberId);

        // await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", {
        //     salonId,
        //     barberId,
        //     queueList: sortedQlist,
        //     barberName: approvedBarber.name,
        // });

        await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", sortedQlist);


        const salonDetails = await getSalonBySalonId(salonId);
        const servedEmailSubject = `${salonDetails.salonName}-Sorry Your Queue Has Been Canceled 🚫`;
        const servedEmailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Queue Canceled</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f8f8; border-radius: 10px; }
                    .header { text-align: center; color: #333; margin-bottom: 20px; }
                    .details { margin-bottom: 20px; }
                    .details ul { list-style-type: none; padding: 0; }
                    .details li { margin-bottom: 5px; }
                    .visit { text-align: center; margin-top: 20px; font-weight: bold; color: #007bff; font-size: 20px; }
                    .logo { text-align: center; margin-bottom: 20px; }
                    .logo img {
                                    max-width: 200px;
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
                                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo"><img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo"></div>
                    <h1 class="header">Your Queue Has Been Canceled</h1>
                    <div class="details">
                        <p>Dear ${canceledQueue.customerName},</p>
                        <p>We regret to inform you that your queue has been canceled. Here are the details:</p>
                        <ul>
                            <li>Salon Name: ${salonDetails.salonName}</li>
                            <li>Barber Name: ${canceledQueue.barberName}</li>
                            <li>Service Estimated Waiting time: ${canceledQueue.serviceEWT} mins</li>
                        </ul>
                    </div>
                    <div class="visit">
                        <p>We apologize for any inconvenience caused. Please visit us again!</p>
                    </div>
                    <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                    <p>Best regards,<br>${salonDetails.salonName}<br>Contact No.: +${salonDetails.contactTel}<br>EmailId: ${salonDetails.salonEmail}</p>
                </div>
            </body>
            </html>
        `;

        try {
            if (canceledQueue.customerEmail) {
                await sendQueuePositionEmail(canceledQueue.customerEmail, servedEmailSubject, servedEmailBody);
            }
        } catch (error) {
            console.error('Error sending email to the served customer:', error);
        }

        const customers = await findCustomersToMail(salonId, barberId);
        if (customers && customers.length > 0) {
            for (const customer of customers) {
                if (customer.queueList && Array.isArray(customer.queueList)) {
                    for (const queueItem of customer.queueList) {

                        const salon = await getSalonBySalonId(salonId);
                        const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;
                        const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');
                        const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                        const emailSubject = `${salon.salonName}-Queue Position Changed (${qPosition})`;
                        const emailBody = `
                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Queue Position Changed</title>
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                    .logo { text-align: center; margin-bottom: 20px; }
                                    .logo img {
                                    max-width: 200px;
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
                                    }
                                    .email-content { background-color: #f8f8f8; padding: 20px; border-radius: 10px; }
                                    ul { padding-left: 20px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="email-content">
                                        <div class="logo"><img src=${salon?.salonLogo[0]?.url} alt="Salon Logo"></div>
                                        <h1 style="text-align: center;">Queue Position Changed</h1>
                                        <p>Dear ${customerName},</p>
                                        <p>Your queue position has changed. Here are the updated details:</p>
                                        <ul>
                                            <li>Customer Name: ${customerName}</li>
                                            <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                            <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                            <li>Barber Name: ${barberName}</li>
                                            <li>Service Price: $${totalServicePrice}</li>
                                            <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                            <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                            <li>New Queue Position: ${qPosition}</li>
                                        </ul>
                                        <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                        <p>Best regards,<br>${salon.salonName}<br>Contact No.: +${salon.contactTel}<br>EmailId: ${salon.salonEmail}</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `;

                        try {
                            if (customerEmail) {
                                await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                            }
                        } catch (error) {
                            console.error('Error sending email to the customer:', error);
                        }

                        const pushDevice = await getPushDevicesbyEmailId(customerEmail)

                        if (pushDevice && pushDevice.deviceToken) {
                            await sendQueueUpdateNotification(pushDevice.deviceToken, salon.salonName, qPosition, customerName, pushDevice.deviceType, QUEUE_POSITION_CHANGE, customerEmail)
                        }
                    }
                }
            }
        }

        return SuccessHandler(QUEUE_CANCEL_SUCCESS, SUCCESS_STATUS_CODE, res, { updatedQueueList: updatedQueue.queueList })

    } catch (error) {
        next(error);
    }
};

//DESC:GET Q LIST BY BARBER ID ================
export const getQlistbyBarberId = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        if (Number(salonId) === 0) {
            return ErrorHandler(NO_SALON_CONNECTED_ERROR, ERROR_STATUS_CODE, res)
        }

        const qListByBarber = await qListByBarberId(salonId, barberId)

        const sortedQlist = qListByBarber.sort((a, b) => a.qPosition - b.qPosition)

        const approvedBarber = await getBarberByBarberId(barberId);

        // await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", {
        //     // salonId,
        //     // barberId,
        //     queueList: sortedQlist,
        //     // barberName: approvedBarber.name,
        // });

        await io.to(`barber_${salonId}_${barberId}`).emit("barberQueueUpdated", sortedQlist);

        if (approvedBarber.isApproved === false) {

            return ErrorHandler(QUEUELIST_BARBER_ERROR, ERROR_STATUS_CODE, res,)

        }

        return SuccessHandler(QUEUELIST_EMPTY_FOR_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { queueList: sortedQlist })

    } catch (error) {
        next(error);
    }
};

//DESC:GET Q HISTORY BY CUSTOMER EMAIL ================
export const getQhistoryByCustomerEmail = async (req, res) => {
    try {
        const { customerEmail, salonId } = req.body;

        // Validate if the required fields are present in the request body
        if (!salonId || !customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters (salonId, customerEmail).',
            });
        }

        const getQHistory = await qhistoryByCustomer(salonId, customerEmail);


        res.status(200).json({
            success: true,
            message: 'Successfully retrieved queue history.',
            response: getQHistory,
        });
    } catch (error) {
        next(error);
    }
};