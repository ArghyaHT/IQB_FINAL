import cron from 'node-cron';
import { updateCustomerCancelCount } from '../services/mobile/customerService.js';
import { changeAllSalonOnlineStatus, checkAppointmentExpireDate, checkQueueingExpireDate } from '../services/web/admin/salonService.js';
import { checkSalonPaymentExpiryDate } from '../services/web/salonPayments/salonPaymentService.js';
import { changeAllBarberOnlineStatus } from '../services/web/barber/barberService.js';

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
                await checkSalonPaymentExpiryDate();
            } catch (error) {
                next(error);
            }
        }, {
            scheduled: true,
            timezone: timezone  // Set the timezone for the cron job
        });
    });

}


export const salonShutdown = (next) => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata'];

    // For each timezone, schedule a cron job that runs at midnight
    timezones.forEach((timezone) => {
        cron.schedule('0 0 * * *', async () => {
            try {
                await changeAllSalonOnlineStatus()
                await changeAllBarberOnlineStatus()
            } catch (error) {
                next(error);
            }
        }, {
            scheduled: true,
            timezone: timezone  // Set the timezone for the cron job
        });
    });

}




