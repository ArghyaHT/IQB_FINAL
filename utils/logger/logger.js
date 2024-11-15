import winston, { createLogger,format,transports } from "winston"
import fs from "fs"

// const { recreateLoggerCronJob } = require('../triggers/cronJobs.js');

export const recreateLoggerFile = () => {
    const filePath = 'logger.log';

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        // Create the file
        fs.writeFileSync(filePath, '');
    }
};

const createLoggerInstance = () => {
    recreateLoggerFile();

    return createLogger({
        format: format.combine(
            format.timestamp(),
            format.printf(info => {
                const spaces = '  '; // Number of spaces you want to add
                const json = JSON.stringify(info, null, spaces);
                return `${info.timestamp} ${json}\n\n`;
            })
        ),
        transports: [
            new transports.File({ filename: 'logger.log' })
        ]
    });
}

const logger = createLoggerInstance();

export default logger;