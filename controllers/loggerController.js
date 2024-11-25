import fs from "fs";
import path from  "path"

export const downloadLogger = async (req, res, next) => {
    try {
        const loggerFilePath = 'logger.log'; // Path relative to the script

        // Check if the logger file exists
        await fs.access(loggerFilePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Logger file not found');
                return res.status(404).send('Logger file not found');
            }

            // Set HTTP headers for file download
            res.setHeader('Content-disposition', 'attachment; filename="logger.log"');
            res.setHeader('Content-type', 'text/plain');

            // Stream the logger file to the response
            const fileStream = fs.createReadStream(loggerFilePath);
            fileStream.pipe(res);
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}
