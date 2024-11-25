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

//DESC:SINGLE JOIN QUEUE ================
export const singleJoinQueue = async (req, res, next) => {
    try {
        const { salonId, name, customerEmail, joinedQType, mobileNumber, methodUsed, barberName, barberId, services } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: "Please set the salon to online to join the queue." });
        }

        if (name.length < 1 || name.length > 20) {
            return res.status(400).json({ success: false, message: "Please enter a name that is between 1 and 20 characters in length." });
        }

        // // Parse the mobileNumber if it's provided
        // let parsedMobileNumber;
        // if (mobileNumber !== undefined && mobileNumber.trim() !== '') {
        //     parsedMobileNumber = parseInt(mobileNumber);
        // } else {
        //     parsedMobileNumber = null; // Store null for empty mobile number
        // }

        // // Validate mobile number format if parsed successfully
        // if (parsedMobileNumber !== null && parsedMobileNumber.toString().length !== 10) {
        //     return res.status(400).json({ success: false, message: "Mobile number should be 10 digit" });
        // }


        const isVipServiceRequested = services.some(service => service.vipService);

        let totalServiceEWT = 0;
        for (const service of services) {
            totalServiceEWT += service.barberServiceEWT || service.serviceEWT;
        }

        let existingQueue;

        if (barberName === "anybarber" && barberId === 0) {

            // Handle auto-join logic for any barber
            const availableBarber = await availableBarberAutoJoin(salonId, services.map(service => service.serviceId), totalServiceEWT);

            if (!availableBarber) {
                return res.status(400).json({
                    success: false,
                    message: 'No barbers available to provide the services.',
                });
            }

            if (availableBarber.isOnline === false || availableBarber.isClockedIn === false || availableBarber.isActive === false) {
                return res.status(400).json({ success: false, message: "The Barber is unable to take queue" });
            }

            existingQueue = await findSalonQueueList(salonId);

            const time = moment().local().format('HH:mm:ss');

            const salon = await getSalonBySalonId(salonId);

            const timeZoneData = salon.timeZone;

            const timeZoneParts = timeZoneData.split('+');

            // Extracting the data after '+'
            const offset = timeZoneParts[1];

            // Parse offset into hours and minutes
            const [offsetHours, offsetMinutes] = offset.split(':').map(Number);

            // Add offset to the time
            const adjustedTime = moment(time, 'HH:mm:ss').add(offsetHours, 'hours').add(offsetMinutes, 'minutes').format('HH:mm:ss');

            const newQueue = {
                customerName: name,
                customerEmail,
                joinedQ: true,
                joinedQType,
                // qPosition: isVipServiceRequested ? 1 : availableBarber.queueCount,
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime,
                methodUsed,
                mobileNumber: mobileNumber,
                barberName: availableBarber.name,
                barberId: availableBarber.barberId,
                services: services.map(service => ({
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    servicePrice: service.servicePrice,
                    vipService: service.vipService
                })),
                serviceEWT: totalServiceEWT,
                serviceType: isVipServiceRequested ? "VIP" : "Regular",
                customerEWT: isVipServiceRequested ? 0 : (availableBarber.barberEWT - totalServiceEWT),
            };


            existingQueue = await addCustomerToQueue(salonId, newQueue, barberId);

            // Extract customer's waiting time and queue position from the result
            const { queue, customerEWT, qPosition } = existingQueue;

            const formattedDate = moment(newQueue.dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

            const emailSubject = `${salon.salonName}: ${formattedDate} - Your Queue Information`;
            const emailBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Salon Queue Details</title>
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
                    <p>Dear ${name},</p>
                    <p>Thank you for joining the queue at our salon. Here are your queue details:</p>
                    <ul>
                        <li>Customer Name: ${name}</li>
                        <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                        <li>Service Type: ${newQueue.serviceType}</li>
                        <li>Barber Name: ${barberName}</li>
                        <li>Service Estimated Waiting time: ${newQueue.serviceEWT} mins</li>
                        <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                        <li>Queue Position: ${qPosition}</li>
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
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }

        } else {

            const getBarber = await getBarberByBarberId(barberId);

            if (getBarber.isClockedIn === false) {
                return res.status(400).json({ success: false, message: "The Barber is unable to take queue" });
            }

            // Handle when a specific barber is provided
            const updatedBarber = await updateBarberEWT(salonId, barberId, totalServiceEWT);

            if (!updatedBarber) {
                return res.status(400).json({
                    success: false,
                    message: "The barber is not online",
                });
            }

            existingQueue = await findSalonQueueList(salonId);

            const time = moment().local().format('HH:mm:ss');

            const salon = await getSalonBySalonId(salonId);


            const timeZoneData = salon.timeZone;

            const timeZoneParts = timeZoneData.split('+');

            // Extracting the data after '+'
            const offset = timeZoneParts[1];

            // Parse offset into hours and minutes
            const [offsetHours, offsetMinutes] = offset.split(':').map(Number);

            // Add offset to the time
            const adjustedTime = moment(time, 'HH:mm:ss').add(offsetHours, 'hours').add(offsetMinutes, 'minutes').format('HH:mm:ss');

            const newQueue = {
                customerName: name,
                customerEmail,
                joinedQ: true,
                joinedQType,
                // qPosition: isVipServiceRequested ? 1 : updatedBarber.queueCount,
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime,
                methodUsed,
                barberName,
                mobileNumber: mobileNumber,
                barberId,
                services: services.map(service => ({
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    servicePrice: service.servicePrice,
                    vipService: service.vipService
                })),
                serviceEWT: totalServiceEWT,
                serviceType: isVipServiceRequested ? "VIP" : "Regular",
                customerEWT: isVipServiceRequested ? 0 : (updatedBarber.barberEWT - totalServiceEWT),
            };

            existingQueue = await addCustomerToQueue(salonId, newQueue, barberId);

            // Extract customer's waiting time and queue position from the result
            const { queue, customerEWT, qPosition } = existingQueue;

            const formattedDate = moment(newQueue.dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

            const emailSubject = `${salon.salonName}: ${formattedDate} - Your Queue Information`;
            const emailBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salon Queue Details</title>
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
            <p>Dear ${name},</p>
            <p>Thank you for joining the queue at our salon. Here are your queue details:</p>
            <ul>
                <li>Customer Name: ${name}</li>
                <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                <li>Service Type: ${newQueue.serviceType}</li>
                <li>Barber Name: ${barberName}</li>
                <li>Service Estimated Waiting time: ${newQueue.serviceEWT} mins</li>
                <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                <li>Queue Position: ${qPosition}</li>
            </ul>
            <p>Please feel free to contact us if you have any questions or need further assistance at the below mentioned.</p>
            <p>Best regards,</p>
            <p style="margin: 0; padding: 10px 0 5px;">
            ${salon.salonName}<br>
            Contact No.: ${salon.contactTel}<br>
            EmailId: ${salon.salonEmail}
        </p>
        </p>
        </div>
    </div>
</body>
</html>
`;

            try {
                await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Joined Queue",
            response: existingQueue,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GROUP JOIN QUEUE ================
export const groupJoinQueue = async (req, res, next) => {
    try {
        const { salonId, groupInfo } = req.body;


        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: "Please make the salon online to join queue" });
        }

        // if (!salon.mobileBookingAvailability && groupInfo.some(group => group.methodUsed === "App")) {
        //     return res.status(201).json({ success: false, message: "Can't join the queue from app at this moment" });
        // }

        // Initialize existingQueue as null
        let existingQueue = null;

        // Retrieve the existing queue for the salon
        existingQueue = await findSalonQueueList(salonId)

        // If no existing queue is found, create a new one
        if (!existingQueue) {
            existingQueue = await addGroupJoin(salonId)
        }

        // Iterate through each group member
        for (const member of groupInfo) {
            let totalServiceEWT = 0;

            const parshedMobileNumber = parseInt(groupInfo.mobileNumber)

            // Validate mobile number format (assuming it should be exactly 10 digits)
            if (parshedMobileNumber && !/^\d{12}$/.test(parshedMobileNumber)) {
                return res.status(400).json({ success: false, message: "Invalid mobile number format. It should be 10 digits." });
            }
            for (const service of member.services) {
                totalServiceEWT += service.barberServiceEWT || service.serviceEWT;
            }

            const isVipServiceRequested = member.services.some(service => service.vipService);

            // Update the barberEWT and queueCount for the Barber
            const updatedBarber = await updateBarberEWT(salonId, member.barberId, totalServiceEWT)
            if (!updatedBarber) {
                res.status(400).json({
                    success: false,
                    message: "The barber Is not online",
                });
            }

            const time = moment().local().format('HH:mm:ss');

            const salon = await getSalonBySalonId(salonId);


            const timeZoneData = salon.timeZone;

            const timeZoneParts = timeZoneData.split('+');

            // Extracting the data after '+'
            const offset = timeZoneParts[1];

            // Parse offset into hours and minutes
            const [offsetHours, offsetMinutes] = offset.split(':').map(Number);

            // Add offset to the time
            const adjustedTime = moment(time, 'HH:mm:ss').add(offsetHours, 'hours').add(offsetMinutes, 'minutes').format('HH:mm:ss');


            // Generate a unique groupJoinCode by combining qPosition and barberId
            const groupJoinCode = `${updatedBarber.queueCount}-${member.barberId}`;

            // Create queue entry data for the group member
            const newQueue = {
                customerName: member.name,
                customerEmail: member.customerEmail,
                joinedQ: true,
                joinedQType: "Group-Join",
                qPosition: updatedBarber.queueCount,
                barberName: member.barberName,
                mobileNumber: member.mobileNumber,
                barberId: member.barberId,
                services: member.services.map(service => ({
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    servicePrice: service.servicePrice,
                    vipService: service.vipService
                })),
                serviceEWT: totalServiceEWT,
                serviceType: isVipServiceRequested ? "VIP" : "Regular",
                customerEWT: isVipServiceRequested ? 0 : (updatedBarber.barberEWT - totalServiceEWT),
                qgCode: groupJoinCode,
                methodUsed: member.methodUsed, // Customize or set the method used as needed
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime
            };


            existingQueue = await addCustomerToQueue(salonId, newQueue);

            const emailSubject = 'Your Queue Information';
            const emailBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salon Queue Details</title>
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
            <p>Dear ${member.name},</p>
            <p>Thank you for joining the queue at our salon. Here are your queue details:</p>
            <ul>
                <li>Customer Name: ${member.name}</li>
                <li>Service Name: ${member.services.map(service => service.serviceName).join(', ')}</li>
                <li>Service Type: ${member.services.some(service => service.vipService === true) ? 'VIP' : 'Regular'}</li>
                <li>Barber Name: ${member.barberName}</li>
                <li>Service Estimated Waiting time: ${totalServiceEWT} mins</li>
                <li>Your Estimated Waiting time: ${isVipServiceRequested ? 0 : (updatedBarber.barberEWT - totalServiceEWT)} mins</li>
                <li>Queue Position: ${isVipServiceRequested ? 1 : updatedBarber.queueCount}</li>
            </ul>
            <p>Please feel free to contact us if you have any questions or need further assistance at the below mentioned.</p>
            <p>Best regards,</p>
            <p style="margin: 0; padding: 10px 0 5px;">
            ${salon.salonName}<br>
            Contact No.: ${salon.contactTel}<br>
            EmailId: ${salon.salonEmail}
        </p>
        </p>
        </div>
    </div>
</body>
</html>
`;

            try {
                await sendQueuePositionEmail(member.customerEmail, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Group Joined Queue",
            response: existingQueue,
        });


    } catch (error) {
        //console.log(error);
        next(error);
    }
};



//DESC:GET SALON QUEUELIST ================
export const getQueueListBySalonId = async (req, res, next) => {

    try {
        const salonId = parseInt(req.query.salonId, 10);

        // Check if the salon exists in the database
        if (salonId) {
            const salonExists = await checkSalonExists(salonId); // Assuming checkSalonExists is a function that checks if the salon exists
            if (salonExists === null) {
                return res.status(400).json({
                    success: false,
                    message: "Salon does not exist.",
                });
            }

            //To find the queueList according to salonId and sort it according to qposition
            const getSalon = await getSalonQlist(salonId)

            if (getSalon.length > 0) {
                // Access the sorted queueList array from the result
                const sortedQueueList = getSalon[0].queueList;

                // res.status(200).json({
                //     success: true,
                //     message: "QList By Salon Id retrieved",
                //     response: sortedQueueList,
                // });
                await responseHandler(res, 200, "QList By Salon Id retrieved", true, sortedQueueList)
            } else {
                res.status(200).json({
                    success: false,
                    message: "No queuelist to show",
                    response: []
                });
            }

        } else {
            // res.status(400).json({
            //     success: false,
            //     message: "Failed to fetch queuelist",
            //     response: []
            // });
            await errorApiHandler(res, 201, "No queuelist found.", false)
        }

    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:BARBER SERVED API ================
export const barberServedQueue = async (req, res, next) => {
    try {
        let { salonId, barberId, barberEmail, adminEmail, services, _id } = req.body;

        // Convert email to lowercase
        if (adminEmail) {
            adminEmail = adminEmail.toLowerCase();
        }
        else {
            barberEmail = barberEmail.toLowerCase();
        }

        if (adminEmail && !validateEmail(adminEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin email"
            });
        }

        if (barberEmail && !validateEmail(barberEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid barber email"
            });
        }

        if (adminEmail) {

            const foundUser = await findAdminByEmailAndSalonId(adminEmail, salonId);

            if (!foundUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin not found'
                })
            }

            const updatedByBarberEmail = foundUser.email;

            const updatedByBarberName = foundUser.name;

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
                            await addQueueHistory(salonId, element, updatedByBarberEmail, updatedByBarberName)
                        } else {
                            salon.queueList.push({
                                ...element.toObject(), // Convert Mongoose document to plain object
                                updatedByBarberEmail: updatedByBarberEmail,
                                updatedByBarberName: updatedByBarberName,
                                isAdmin: true
                            });
                            await salon.save();
                        }
                        // Update the status to "served" for the served queue in JoinedQueueHistory
                        await updateServed(salonId, element._id);

                        const salonDetails = await getSalonBySalonId(salonId);
                        // Construct email subject and body for the customer being served
                        const servedEmailSubject = '🎉 Served Successfully! 🎉';
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
                            await sendQueuePositionEmail(element.customerEmail, servedEmailSubject, servedEmailBody);
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

                    if (customers && customers.length > 0) {
                        for (const customer of customers) {
                            if (customer.queueList && Array.isArray(customer.queueList)) {
                                for (const queueItem of customer.queueList) {
                                    const salon = await getSalonBySalonId(salonId);
                                    const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                                    const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                                    const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                                    const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                        await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                                    } catch (error) {
                                        console.error('Error sending email:', error);
                                        // Handle error if email sending fails
                                    }
                                }
                            }
                        }
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Customer serve successfully.',
                    });
                }
            }
            return res.status(404).json({
                success: false,
                message: 'Queue position is not 1.',
            });

        }
        else {
            const foundUser = await findBarberByBarberEmailAndSalonId(barberEmail, salonId);

            if (!foundUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Unauthorized Barber'
                })
            }

            const updatedByBarberEmail = foundUser.email;

            const updatedByBarberName = foundUser.name;

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
                            await addQueueHistory(salonId, element, updatedByBarberEmail, updatedByBarberName)
                        } else {
                            salon.queueList.push({
                                ...element.toObject(), // Convert Mongoose document to plain object
                                updatedByBarberEmail: updatedByBarberEmail,
                                updatedByBarberName: updatedByBarberName
                            });
                            await salon.save();
                        }
                        // Update the status to "served" for the served queue in JoinedQueueHistory
                        await updateServed(salonId, element._id);

                        const salonDetails = await getSalonBySalonId(salonId);
                        // Construct email subject and body for the customer being served
                        const servedEmailSubject = '🎉 Served Successfully! 🎉';
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
                            await sendQueuePositionEmail(element.customerEmail, servedEmailSubject, servedEmailBody);
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

                    if (customers && customers.length > 0) {
                        for (const customer of customers) {
                            if (customer.queueList && Array.isArray(customer.queueList)) {
                                for (const queueItem of customer.queueList) {
                                    const salon = await getSalonBySalonId(salonId);
                                    const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                                    const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                                    const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                                    const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                        await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                                    } catch (error) {
                                        console.error('Error sending email:', error);
                                        // Handle error if email sending fails
                                    }
                                }
                            }
                        }
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Customer served from the queue successfully.',
                    });
                }
            }

            return res.status(404).json({
                success: false,
                message: 'Queue position is not 1.',
            });
        }

    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC:CANCEL QUEUE ================
export const cancelQueue = async (req, res, next) => {
    try {
        let { salonId, barberEmail, adminEmail, barberId, _id } = req.body;

        if (adminEmail) {
            adminEmail = adminEmail.toLowerCase();
        } else {
            barberEmail = barberEmail.toLowerCase();
        }

        if (barberEmail && !validateEmail(barberEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        if (adminEmail && !validateEmail(adminEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        let foundUser, updatedByBarberEmail, updatedByBarberName;

        if (adminEmail) {
            foundUser = await findAdminByEmailAndSalonId(adminEmail, salonId);
            if (!foundUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
            
            updatedByBarberEmail = foundUser.email;
            updatedByBarberName = foundUser.name;
        } else {
            foundUser = await findBarberByBarberEmailAndSalonId(barberEmail, salonId);
            if (!foundUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Unauthorized Barber'
                });
            }
            updatedByBarberEmail = foundUser.email;
            updatedByBarberName = foundUser.name;
        }

        const updatedQueue = await findSalonQueueList(salonId);

        if (!updatedQueue) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found for the given salon ID',
            });
        }

        const canceledQueueIndex = updatedQueue.queueList.findIndex(queue => queue._id.toString() === _id);
        if (canceledQueueIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found with the given _id',
            });
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
            salon = await addQueueHistoryWhenCanceled(salonId, canceledQueue, updatedByBarberEmail, updatedByBarberName);
        } else {
            salon.queueList.push({
                ...canceledQueue.toObject(),
                updatedByBarberEmail,
                updatedByBarberName,
                isAdmin: !!adminEmail
            });
            await salon.save();
        }

        await statusCancelQ(salonId, _id);

        const salonDetails = await getSalonBySalonId(salonId);
        const servedEmailSubject = 'Sorry Your Queue Has Been Canceled 🚫';
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
                    .logo img { max-width: 200px; }
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
            await sendQueuePositionEmail(canceledQueue.customerEmail, servedEmailSubject, servedEmailBody);
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

                        const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                    .logo img { max-width: 200px; }
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
                            await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                        } catch (error) {
                            console.error('Error sending email to the customer:', error);
                        }
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Customer cancel successfully.",
            updatedQueueList: updatedQueue.queueList
        });
    } catch (error) {
        next(error);
    }
};
//DESC:GET AVAILABLE BARBERS FOR QUEUE ================
export const getAvailableBarbersForQ = async (req, res, next) => {
    try {
        const { salonId } = req.query;

        //To find the available barbers for the queue
        const availableBarbers = await getBarbersForQ(salonId);

        if (!availableBarbers) {
            res.status(201).json({
                success: false,
                message: 'No available Barbers found at this moment.'
            });
        }
        else {
            res.status(200).json({
                success: true,
                message: 'All Barbers retrieved',
                response: availableBarbers
            });
        }
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}


//DESC:GET AVAILABLE BARBERS By MULTIPLE SERVICE IDS ================
export const getBarberByMultipleServiceId = async (req, res, next) => {
    try {
        const { salonId, serviceIds } = req.query; // Assuming serviceIds are passed as query parameters, e.g., /barbers?serviceIds=1,2,3

        if (!serviceIds) {
            return res.status(400).json({ error: 'Service IDs are required' });
        }

        const serviceIdsArray = serviceIds.split(',').map((id) => Number(id)); // Split string into an array of service IDs

        const barbers = await getBarbersWithMulServiceId(salonId, serviceIdsArray);

        if (!barbers || barbers.length === 0) {
            return res.status(404).json({
                success: false,
                response: 'No barbers found for the provided Services'
            });
        }

        return res.status(200).json({
            success: true,
            message: "Barbers retrieved for the particular Services",
            response: barbers
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC:GET Q LIST BY BARBER ID ================
export const getQlistbyBarberId = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        const qList = await qListByBarberId(salonId, barberId)

        const approvedBarber = await getBarberByBarberId(barberId);

        if(approvedBarber.isApproved === false){

            return res.status(201).json({
                success: false,
                message:'Queue list not found for the specified barber and salon ID',
                queueList: []
            });
        }


        if (!qList || qList.length === 0) {
            return res.status(201).json({
                success: false,
                message: 'Queue list not found for the specified barber and salon ID',
                queueList: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Queue list retrieved successfully for the specified barber',
            queueList: qList[0].queueList // Extracting the queue list from the result
        });
    } catch (error) {
        //console.log(error);
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
        //console.log(error);
        next(error);
    }
};