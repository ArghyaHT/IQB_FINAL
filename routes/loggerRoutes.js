import express from "express"
import { downloadLogger } from "../controllers/loggerController.js";


const router = express.Router();

router.route("/download-logger").get(downloadLogger)

export default router;