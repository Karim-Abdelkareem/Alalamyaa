import asyncHandler from "express-async-handler";
import Brand from "./brandModel.js";
import { AppError } from "../../utils/appError.js";

// Create a new brand
export const createBrand = asyncHandler(async (req, res) => {
  const { name, description, websiteUrl } = req.body;
  const logoUrl = req.file?.path;
  if (!name || !description || !logoUrl || !websiteUrl) {
    throw new AppError("All fields are required", 400);
  }
  const brand = new Brand({
    name,
    description,
    logoUrl,
    websiteUrl,
  });

  await brand.save();

  res.status(201).json({
    status: "success",
    data: {
      brand,
    },
  });
});

// Get all brands
export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: brands.length,
    data: {
      brands,
    },
  });
});

// Get a single brand by ID
export const getBrandById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }
  res.status(200).json({
    status: "success",
    data: {
      brand,
    },
  });
});

// Update a brand by ID
export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, websiteUrl, status } = req.body;

  const logoUrl = req.file?.path;

  if (!name || !description || !websiteUrl || !status) {
    throw new AppError("All fields are required", 400);
  }

  const brand = await Brand.findByIdAndUpdate(
    id,
    { name, description, logoUrl, websiteUrl, status },
    { new: true, runValidators: true }
  );

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      brand,
    },
  });
});

// Delete a brand by ID
export const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

//change brand status
export const changeBrandStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["active", "inactive"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const brand = await Brand.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      brand,
    },
  });
});
