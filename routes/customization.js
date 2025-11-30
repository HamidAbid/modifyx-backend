import express from "express";
import {
  getCustomizationOptions,
  submitCustomization,
  getCustomizationHistory,
} from "../controllers/customizationController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/options/:productId", getCustomizationOptions);
router.post("/submit", auth, submitCustomization);
router.get("/history", auth, getCustomizationHistory);

export default router;
