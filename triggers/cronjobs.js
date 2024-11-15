import cron from 'node-cron';
import { updateBarberExp } from '../services/barber/barberService.js';


export const setupCronJobs = () => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata'];

    timezones.forEach((timezone) => {
        cron.schedule('0 0 1 * *', async () => {
            console.log(`Running updateBarberExp function at the beginning of every month for timezone: ${timezone}`);
            await updateBarberExp();
        }, {
            scheduled: true,
            timezone: timezone,
        });
    });
};