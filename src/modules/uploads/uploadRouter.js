import express from "express";
import { upload } from "../../config/cloudinary.js";
import { uploadImage, deleteFile } from "./uploadController.js";

const router = express.Router();

router.post("/", upload.array("files", 10), uploadImage);

router.delete("/", deleteFile);

export default router;
