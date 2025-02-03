import { availableBarberAutoJoin, decreaseBarberEWTWhenQCancel, getBarberByBarberId, getBarbersForQ, getBarbersWithMulServices, updateBarberEWT } from "../../services/mobile/barberService.js";
import { findSalonQueueList, getSalonQlist, qListByBarberId } from "../../services/mobile/joinQueueService.js";
import { allSalonServices, getSalonBySalonId } from "../../services/mobile/salonServices.js";
import { sendQueuePositionEmail } from "../../utils/emailSender/emailSender.js";
import moment from "moment";
import { addCustomerToQueue } from "../../utils/queue/queueUtils.js";
import { findCustomerByCustomerEmailAndSalonId } from "../../services/mobile/customerService.js";
import { addQueueHistoryWhenCanceled, findSalonQueueListHistory, statusCancelQ } from "../../services/mobile/queueHistoryService.js";
import { validateEmail } from "../../middlewares/validator.js";
import { findCustomersToMail } from "../../services/web/queue/joinQueueService.js";

//DESC:SINGLE JOIN QUEUE ================
export const singleJoinQueue = async (req, res, next) => {
    try {
        const { salonId, name, customerEmail, joinedQType, mobileNumber, mobileCountryCode, methodUsed, barberName, barberId, services } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(201).json({ success: false, message: "Please make the salonOnline to join queue" });
        }

        if (salon.mobileBookingAvailability === false && methodUsed === "App") {
            return res.status(201).json({ success: false, message: "Cant Join the queue from App at this moment" });
        }

        // Parse the mobileNumber if it's provided
        let parsedMobileNumber;
        if (mobileNumber !== undefined && mobileNumber.trim() !== '') {
            parsedMobileNumber = parseInt(mobileNumber);
        } else {
            parsedMobileNumber = null; // Store null for empty mobile number
        }

        // Validate mobile number format if parsed successfully
        if (parsedMobileNumber !== null && parsedMobileNumber.toString().length !== 10) {
            return res.status(201).json({ success: false, message: "Invalid mobile number format" });
        }


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
                return res.status(201).json({
                    success: false,
                    message: 'No single barber provides the services.',
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
                // qPosition: isVipServiceRequested ? 1 : availableBarber.queueCount,
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime,
                methodUsed: methodUsed,
                mobileCountryCode,
                mobileNumber: parsedMobileNumber,
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


            existingQueue = await addCustomerToQueue(salonId, newQueue, barberId, customerEmail, name);


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
                        <p>Dear ${name},</p>
                        <p>Thank you for joining the queue at our salon. Here are your queue details:</p>
                        <ul>
                            <li>Customer Name: ${name}</li>
                            <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                            <li>Service Type: ${services.some(service => service.vipService === true) ? 'VIP' : 'Regular'}</li>
                            <li>Barber Name: ${barberName}</li>
                            <li>Service Estimated Waiting time: ${totalServiceEWT}</li>
                            <li>Your Estimated Waiting time: ${isVipServiceRequested ? 0 : (availableBarber.barberEWT - totalServiceEWT)} mins</li>
                            <li>Queue Position: ${isVipServiceRequested ? 1 : availableBarber.queueCount}</li>
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

        } else {
            // Handle when a specific barber is provided
            const updatedBarber = await updateBarberEWT(salonId, barberId, totalServiceEWT);

            if (!updatedBarber) {
                return res.status(201).json({
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
                mobileCountryCode,
                mobileNumber: parsedMobileNumber,
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

            existingQueue = await addCustomerToQueue(salonId, newQueue, barberId, customerEmail, name );

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
                <p>Dear ${name},</p>
                <p>Thank you for joining the queue at our salon. Here are your queue details:</p>
                <ul>
                    <li>Customer Name: ${name}</li>
                    <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                    <li>Service Type: ${services.some(service => service.vipService === true) ? 'VIP' : 'Regular'}</li>
                    <li>Barber Name: ${barberName}</li>
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
                await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                console.log('Email sent successfully.');
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Joined Queue successfully ",
            response: existingQueue,
        });
    }

    catch (error) {
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
            return res.status(201).json({ success: false, message: "The salon is offline." });
        }

        if (!salon.mobileBookingAvailability && groupInfo.some(group => group.methodUsed === "App")) {
            return res.status(201).json({ success: false, message: "Can't join the queue from app at this moment" });
        }

        // Initialize existingQueue as null
        let existingQueue = null;

        // Retrieve the existing queue for the salon
        existingQueue = await findSalonQueueList(salonId)

        // If no existing queue is found, create a new one
        if (!existingQueue) {
            existingQueue = await addGroupJoin(salonId)
        }

        const generateGcCode = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let gcCode = '';
            for (let i = 0; i < 6; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                gcCode += characters[randomIndex];
            }
            return gcCode;
        };

        const gcCode = generateGcCode()

        // Iterate through each group member
        for (const member of groupInfo) {
            let totalServiceEWT = 0;

            const parshedMobileNumber = parseInt(groupInfo.mobileNumber)
            // Validate mobile number format (assuming it should be exactly 10 digits)
            if (parshedMobileNumber && !/^\d{10}$/.test(parshedMobileNumber)) {
                return res.status(201).json({ success: false, message: "Invalid mobile number format. It should be 10 digits." });
            }
            for (const service of member.services) {
                totalServiceEWT += service.barberServiceEWT || service.serviceEWT;
            }

            const isVipServiceRequested = member.services.some(service => service.vipService);

            // Update the barberEWT and queueCount for the Barber
            const updatedBarber = await updateBarberEWT(salonId, member.barberId, totalServiceEWT)
            if (!updatedBarber) {
                res.status(201).json({
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


            // Create queue entry data for the group member
            const newQueue = {
                customerName: member.name,
                customerEmail: member.customerEmail,
                joinedQ: true,
                joinedQType: "Group-Join",
                qPosition: updatedBarber.queueCount,
                barberName: member.barberName,
                mobileCountryCode: member.mobileCountryCode,
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
                qgCode: gcCode,
                methodUsed: member.methodUsed, // Customize or set the method used as needed
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime
            };


            existingQueue = await addCustomerToQueue(salonId, newQueue, member.barberId, member[0].customerEmail, member[0].name);

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
                console.log('Email sent successfully.');
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

//DESC:CANCEL QUEUE ================
export const cancelQueueByCustomer = async (req, res, next) => {
    try {
        let { salonId, customerEmail, barberId, _id } = req.body;

        // Convert email to lowercase
        customerEmail = customerEmail.toLowerCase();

        if (!customerEmail) {
            return res.status(201).json({
                success: false,
                message: "Please ensure the email field is filled correctly."
            });
        }

        if (!validateEmail(customerEmail)) {
            return res.status(201).json({
                success: false,
                message: "Invalid Email "
            });
        }


        const foundUser = await findCustomerByCustomerEmailAndSalonId(customerEmail, salonId);

        if (!foundUser) {
            return res.status(201).json({
                success: false,
                message: 'Customer not found'
            })
        }

        if (foundUser.cancellationCount >= 1 && moment(foundUser.updatedAt).isSame(moment(), 'day')) {
            return res.status(201).json({
                success: false,
                message: 'Cant cancel queue anymore for today'
            })
        }

        const updatedQueue = await findSalonQueueList(salonId)

        if (!updatedQueue) {
            return res.status(201).json({
                success: false,
                message: 'Queue not found for the given salon ID',
            });
        }

        const canceledQueueIndex = updatedQueue.queueList.findIndex(queue => queue._id.toString() === _id);

        if (canceledQueueIndex === -1) {
            return res.status(201).json({
                success: false,
                message: 'Queue not found with the given _id',
            });
        }

        const canceledServiceEWT = updatedQueue.queueList[canceledQueueIndex].serviceEWT;

        // Remove the canceled queue from the queue list
        const canceledQueue = updatedQueue.queueList.splice(canceledQueueIndex, 1)[0];

        // Decrement qPosition for subsequent queues and adjust customerEWT
        updatedQueue.queueList.forEach(queue => {
            if (queue.qPosition > canceledQueue.qPosition) {
                queue.qPosition -= 1;
                queue.customerEWT -= canceledServiceEWT;
            }
        });

        await updatedQueue.save();

        //Updating the barber
        const updatedBarber = decreaseBarberEWTWhenQCancel(salonId, barberId, canceledServiceEWT);

        // Increment the cancellation count
        foundUser.cancellationCount += 1;

        foundUser.save();

        //Adding the cancelled queue to the joinqueuehistory with status cancelled
        let salon = await findSalonQueueListHistory(salonId);

        if (!salon) {
            salon = await addQueueHistoryWhenCanceled(salonId, canceledQueue)
        } else {
            salon.queueList.push({
                ...canceledQueue.toObject(), // Convert Mongoose document to plain object
                isCustomer: true
            });
            await salon.save();
        }

        await salon.save();

        // Update the status to "cancelled" for the canceled queue in JoinedQueueHistory
        salon = await statusCancelQ(salonId, _id)

        const customers = await findCustomersToMail(salonId, barberId)

        if (customers && customers.length > 0) {
            for (const customer of customers) {
                if (customer.queueList && Array.isArray(customer.queueList)) {
                    for (const queueItem of customer.queueList) {

                        const salon = await getSalonBySalonId(salonId);

                        const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                        const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

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
                            console.log('Email sent successfully.');
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
            message: 'Queue canceled successfully',
            updatedQueueList: updatedQueue.queueList,
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

        //To find the queueList according to salonId and sort it according to qposition
        const getSalon = await getSalonQlist(salonId)

        if (getSalon.length > 0) {
            // Access the sorted queueList array from the result
            const sortedQueueList = getSalon[0].queueList;

            res.status(200).json({
                success: true,
                message: "Queue list of the salon retrieved successfully.",
                response: sortedQueueList,
            });
        } else {
            res.status(201).json({
                success: false,
                message: "Salon not found",
            });
        }

    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET AVAILABLE BARBERS FOR QUEUE ================
export const getAvailableBarbersForQ = async (req, res, next) => {
    try {
        const { salonId } = req.query;

        const anybarberServices = await allSalonServices(salonId);

        //To find the available barbers for the queue
        const availableBarbers = await getBarbersForQ(salonId);

        if (availableBarbers.length === 0) {
            res.status(201).json({
                success: false,
                message: 'No available Barbers found at this moment.'
            });
        }
        else {

            // Find the barber with the minimum barberEwt
            let minEwtBarber = availableBarbers[0];
            for (let i = 1; i < availableBarbers.length; i++) {
                if (availableBarbers[i].barberEWT < minEwtBarber.barberEWT) {
                    minEwtBarber = availableBarbers[i];
                }
            }

            let anybarber = {
                name: "anybarber",
                email: "anybarber@gmail.com",
                barberId: 0,
                queueCount: minEwtBarber.queueCount,
                role: minEwtBarber.role,
                barberEWT: minEwtBarber.barberEWT,
                isClockedIn: minEwtBarber.isClockedIn,
                isOnline: minEwtBarber.isClockedIn,
                isDeleted: minEwtBarber.isDeleted,
                isApproved: minEwtBarber.isApproved,
                isActive: minEwtBarber.isActive,
                barberServices: anybarberServices.map(service => ({
                    ...service.toObject(),
                    barberServiceEWT: service.serviceEWT // renaming serviceEWT to barberServiceEWT
                })),
            }

            // Insert anybarber at the beginning of availableBarbers array
            availableBarbers.unshift(anybarber);

            return res.status(200).json({
                success: true,
                message: 'All Barbers retrieved successfully',
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
export const getBarberByServices = async (req, res, next) => {
    try {
        const { salonId, serviceIds } = req.body; // Assuming serviceIds are passed as query parameters, e.g., /barbers?serviceIds=1,2,3

        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(201).json({ success: false, message: 'Please ensure that the request includes valid service IDs.' });
        }

        const barbers = await getBarbersWithMulServices(salonId, serviceIds);

        if (!barbers || barbers.length === 0) {
            return res.status(201).json({
                success: false,
                message: 'No barbers were found for the services specified in the request.'
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

//DESC:GET ALL BARBER SERVICES BY BARBERID ===================
export const getBarberServicesByBarberId = async (req, res, next) => {
    try {
        const { barberId, salonId } = req.body;

        let barberServices = []

        if (barberId === 0) {
            barberServices = await allSalonServices(salonId)
        }
        else {
            const barbers = await getBarberByBarberId(barberId)

            barberServices = barbers.barberServices;

            if (!barbers) {
                return res.status(201).json({
                    success: false,
                    message: "No barbers found for the geiven BarberId"
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Barber services retrieved",
            response: barberServices
        });
    }
    catch (error) {
        next(error);
    }

}

//DESC:GET Q LIST BY BARBER ID ================
export const getQlistbyBarberId = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        const qList = await qListByBarberId(salonId, barberId)

        if (!qList || qList.length === 0) {
            return res.status(201).json({
                success: false,
                message: 'No queue list was found for the specified barber and salon ID.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Queue list retrieved successfully for the specified barber',
            response: qList[0].queueList // Extracting the queue list from the result
        });
    } catch (error) {
        next(error);
    }
};


