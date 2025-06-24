import express from "express"
import { addCategory } from "../../controllers/common/categoryController.js";
const router = express.Router();

router.route("/add-category").post(addCategory)


export default router;