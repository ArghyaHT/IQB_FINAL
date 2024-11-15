import express from "express";
import { addIcons, getAllIcons } from "../../../controllers/web/icons/iconsController.js";

const router = express.Router();

//ADD ICONS
router.route("/addIcons").post(addIcons)

//GET ALL ICONS
router.route("/getAllIcons").get(getAllIcons)

export default router;