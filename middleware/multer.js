// middleware/multer.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from '../utils/cloudinary.js'

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bouquets",   // Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

export const upload = multer({ storage });
