// routes/image.js
import express from "express";
import { upload } from "../middleware/multer.js";
import {
  generateAiImage,
  uploadBouquetImage,
} from "../controllers/imageController.js";

const router = express.Router();

router.post("/generate-ai", generateAiImage);
router.post("/upload", upload.single("image"), uploadBouquetImage);

export default router;
