import { NEW_QUEUE_ADD } from "../../constants/mobile/NotificationConstants.js";
import { getBarberByBarberId } from "../../services/kiosk/barber/barberService.js";
import { addNewQueue, findSalonQueueList } from "../../services/kiosk/queue/queueService.js";
import { getPushDevicesbyEmailId } from "../../services/mobile/pushDeviceTokensService.js";
import { getSalonBySalonId } from "../../services/mobile/salonServices.js";
import { sendQueueNotification } from "../pushNotifications/pushNotifications.js";

export const addCustomerToQueue = async (salonId, newQueue, barberId, customerEmail, customerName) => {
    let existingQueue = await findSalonQueueList(salonId);

    let customerEWT = 0;
    let qPosition = 0;

    if (!existingQueue) {
        // If the queue doesn't exist, create a new one with the new customer
        newQueue.qPosition = 1;
        newQueue.customerEWT = 0; // Initialize customerEWT for the first VIP service
        const savedInQueue = await addNewQueue(salonId, newQueue);
        return {
            queue: savedInQueue,
            customerEWT: newQueue.customerEWT,
            qPosition: newQueue.qPosition
        };
    }

    const isVipServiceRequested = newQueue.services.some(service => service.vipService);

    if (isVipServiceRequested) {
        // Handle VIP service case
        let vipPosition = 1; // Initialize position for VIP service
        let accumulatedEWT = 0; // Initialize accumulated waiting time
        let firstVipQueue = null; // Store the first VIP service queue entry
        existingQueue.queueList.forEach(queueEntry => {
            if (queueEntry.barberId === newQueue.barberId && queueEntry.services.some(service => service.vipService)) {
                vipPosition++; // Increment the position for existing VIP service requests
                if (!firstVipQueue) {
                    firstVipQueue = queueEntry; // Store the first VIP service queue entry
                } else {
                    accumulatedEWT += queueEntry.customerEWT; // Accumulate waiting time of previous VIP customers
                }
            }
        });

        // Add the VIP service customer to the appropriate position in the queue
        newQueue.qPosition = vipPosition;
        existingQueue.queueList.splice(vipPosition - 1, 0, newQueue); // Insert at the correct position

        // Update customerEWT for the requested VIP service
        if (firstVipQueue) {
            newQueue.customerEWT = firstVipQueue.customerEWT + accumulatedEWT; // Set customerEWT to the waiting time of the first VIP service plus accumulatedEWT
        }

        // Assuming 'response' contains the response object you provided
        let lastVipEntry = null;
        let beforeLastVipEntry = null;

        existingQueue.queueList.forEach(queueEntry => {
            if (queueEntry.services.some(service => service.vipService)) {
                beforeLastVipEntry = lastVipEntry;
                lastVipEntry = queueEntry;
            }
        });

        if (beforeLastVipEntry) {
            // Add serviceEWT and customerEWT of before-last VIP entry to last VIP entry
            lastVipEntry.customerEWT += beforeLastVipEntry.serviceEWT + beforeLastVipEntry.customerEWT;
            // Calculate customerEWT and queue position for VIP service
            customerEWT = lastVipEntry.customerEWT;
        }

        qPosition = newQueue.qPosition;

        // Adjust positions for existing non-VIP service requests
        existingQueue.queueList.forEach(queueEntry => {
            if (queueEntry.barberId === newQueue.barberId && !queueEntry.services.some(service => service.vipService)) {
                queueEntry.qPosition++; // Increment the queue position for non-VIP service requests
                queueEntry.customerEWT += newQueue.serviceEWT; // Update waiting time for regular customers
            }
        });

    } else {
        // Handle non-VIP service case
        let currentPosition = 1;
        existingQueue.queueList.forEach(queueEntry => {
            if (queueEntry.barberId === newQueue.barberId) {
                currentPosition++;
            }
        });

        newQueue.qPosition = currentPosition;
        qPosition = currentPosition;

        const barber = await getBarberByBarberId(barberId);

        const initialCustomerEWT = barber.barberEWT;

        customerEWT = initialCustomerEWT - newQueue.serviceEWT


        existingQueue.queueList.push(newQueue);
    }


    // Save the updated queue
    existingQueue = await existingQueue.save();

    // 1. finding the token from the database using customer email
    // 2. Token must be present here
    // 3. Prepare the token head and message body 
    // 4. Send it to the customer in the expo url.

    const salon = await getSalonBySalonId(salonId)

    const pushDevice = await getPushDevicesbyEmailId(customerEmail)

    if(pushDevice.deviceToken){
        await sendQueueNotification(pushDevice.deviceToken, salon.salonName, qPosition, customerName, pushDevice.deviceType , NEW_QUEUE_ADD )
    }

    return {
        queue: existingQueue,
        customerEWT,
        qPosition
    };
};