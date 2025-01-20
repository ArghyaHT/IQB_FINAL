import cron from 'node-cron';
import { updateCustomerCancelCount } from '../services/mobile/customerService.js';
import { checkAppointmentExpireDate, checkQueueingExpireDate } from '../services/web/admin/salonService.js';
import { checkSalonPaymentExpiryDate } from '../services/web/salonPayments/salonPaymentService.js';

// Function to update customer records
export const updateCustomers = (next) => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata'];

    // For each timezone, schedule a cron job that runs at midnight
    timezones.forEach((timezone) => {
        cron.schedule('0 0 * * *', async () => {
            try {
                await updateCustomerCancelCount()
            } catch (error) {
                next(error);
            }
        }, {
            scheduled: true,
            timezone: timezone  // Set the timezone for the cron job
        });
    });
};

export const checkTrailPeriod = (next) => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata'];

    // For each timezone, schedule a cron job that runs at midnight
    timezones.forEach((timezone) => {
        cron.schedule('0 0 * * *', async () => {
            try {
                await updateCustomerCancelCount()
            } catch (error) {
                next(error);
            }
        }, {
            scheduled: true,
            timezone: timezone  // Set the timezone for the cron job
        });
    });

}

export const checkQueuingAndAppointmentExpire = (next) => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata'];

    // For each timezone, schedule a cron job that runs at midnight
    timezones.forEach((timezone) => {
        cron.schedule('0 0 * * *', async () => {
            try {
                await checkQueueingExpireDate()
                await checkAppointmentExpireDate()
            } catch (error) {
                next(error);
            }
        }, {
            scheduled: true,
            timezone: timezone  // Set the timezone for the cron job
        });
    });

}

export const checkPaymentsExpiry = (next) => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata'];

    // For each timezone, schedule a cron job that runs at midnight
    timezones.forEach((timezone) => {
        cron.schedule('* * * * *', async () => {
            try {
                console.log(`[${new Date().toISOString()}] Cron job started for timezone: ${timezone}`);
                await checkSalonPaymentExpiryDate();
                console.log(`[${new Date().toISOString()}] Cron job successfully executed for timezone: ${timezone}`);
            } catch (error) {
                next(error);
            }
        }, {
            scheduled: true,
            timezone: timezone  // Set the timezone for the cron job
        });
    });

}

