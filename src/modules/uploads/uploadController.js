import { cloudinary } from "../../config/cloudinary.js";
import expressAsyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
export const uploadImage = expressAsyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError("No files uploaded", 400));
  }
  const uploadedReasults = req.files.map((file) => ({
    url: file.path,
    public_id: file.filename,
    altText: {
      en: "",
      ar: "",
    },
  }));
  res.status(200).json({
    status: "success",
    message: "Files Uploaded Successfully",
    files: uploadedReasults,
  });
});

export const deleteFile = expressAsyncHandler(async (req, res, next) => {
  const { public_id } = req.body;
  if (!public_id)
    return next(new AppError("public_id is required for file deletion."), 400);
  const resource_type = public_id.includes("alalmiaa/videos/")
    ? "video"
    : "image";
  const result = await cloudinary.uploader.destroy(public_id, {
    resource_type: resource_type,
  });
  if (result.result === "ok") {
    res.status(200).json({ message: "File deleted successfully!", public_id });
  } else {
    return next(new AppError("Failed to delete file", 404));
  }
});
