import fs from "fs";
import path from "path";

export const logMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const { method, url, headers, body } = req;

    // Capture response details
    const originalSend = res.send;
    res.send = function (data) {
        const endTime = Date.now();
        const log = `Time: ${new Date().toISOString()}
Request:
  Method: ${method}
  URL: ${url}
  Headers: ${JSON.stringify(headers)}
  Body: ${JSON.stringify(body)}

Response:
  Status: ${res.statusCode}
  Duration: ${endTime - startTime}ms
  Body: ${data}
----------------------------`;

        // Append log to the logger file
        fs.appendFileSync("logger.log", log + "\n");

        // Call the original `send` method
        return originalSend.apply(this, arguments);
    };

    next();
};

export const downloadLogger = async (req, res, next) => {
    try {
        const loggerFilePath = path.resolve("logger.log"); // Absolute path to logger file

        // Check if the logger file exists
        await fs.promises.access(loggerFilePath);

        // Set HTTP headers for file download
        res.setHeader("Content-disposition", 'attachment; filename="logger.log"');
        res.setHeader("Content-type", "text/plain");

        // Stream the logger file to the response
        const fileStream = fs.createReadStream(loggerFilePath);
        fileStream.pipe(res);
    } catch (err) {
        if (err.code === "ENOENT") {
            return res.status(404).json({ success: false, message: "Logger file not found" });
        }
        next(err);
    }
};
