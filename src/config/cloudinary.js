import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resource_type = "image";
    let folder = "alalmiaa/images";

    if (file.mimetype.startsWith("video/")) {
      resource_type = "video";
      folder = "alalmiaa/videos";
    }

    return {
      folder,
      resource_type,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "avi"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({ storage });

export { cloudinary, upload };
