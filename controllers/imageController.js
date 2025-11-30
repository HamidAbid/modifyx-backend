// controllers/imageController.js
import axios from "axios";
import FormData from "form-data";
import cloudinary from "../utils/cloudinary.js";

export const generateAiImage = async (req, res) => {
  const { prompt } = req.body;

  try {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("output_format", "webp");

    const response = await axios.post(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: process.env.AI_LINK,
          Accept: "image/*",
        },
        responseType: "arraybuffer",
      }
    );

    if (response.status !== 200) {
      return res.status(response.status).json({ error: "Failed to generate image" });
    }

    // Upload buffer to Cloudinary
    const uploaded = await cloudinary.uploader.upload_stream(
      { folder: "ai-generated", format: "webp" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }
        return res.json({ imageUrl: result.secure_url });
      }
    );

    uploaded.end(response.data);

  } catch (error) {
    console.error("AI Image Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// USER UPLOAD
export const uploadBouquetImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    res.json({ imageUrl: req.file.path }); // Cloudinary auto provides .path
  } catch (error) {
    console.error("Bouquet image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};
