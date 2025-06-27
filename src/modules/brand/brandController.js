import asyncHandler from "express-async-handler";
import Brand from "./brandModel.js";
import { AppError } from "../../utils/appError.js";

// Create a new brand
export const createBrand = asyncHandler(async (req, res) => {
  const { name, description, websiteUrl } = req.body;
  const logoUrl = req.file?.path;

  // Validate that at least one language is provided for name
  if (!name || (!name.en && !name.ar)) {
    throw new AppError("Brand name is required in at least one language (en or ar)", 400);
  }

  // Validate that required fields are provided
  if (!logoUrl || !websiteUrl) {
    throw new AppError("Logo and website URL are required", 400);
  }

  // Prepare description with default empty values if not provided
  const brandDescription = description || { en: "", ar: "" };
  if (typeof brandDescription === 'string') {
    throw new AppError("Description should be an object with 'en' and/or 'ar' properties", 400);
  }

  const brand = new Brand({
    name,
    description: brandDescription,
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

  // Find the existing brand first
  const existingBrand = await Brand.findById(id);
  if (!existingBrand) {
    throw new AppError("Brand not found", 404);
  }

  // Prepare update object
  const updateData = {};

  // Handle name update
  if (name) {
    if (!name.en && !name.ar) {
      throw new AppError("Brand name is required in at least one language (en or ar)", 400);
    }
    updateData.name = name;
  }

  // Handle description update
  if (description) {
    if (typeof description === 'string') {
      throw new AppError("Description should be an object with 'en' and/or 'ar' properties", 400);
    }
    updateData.description = description;
  }

  // Handle other fields
  if (logoUrl) updateData.logoUrl = logoUrl;
  if (websiteUrl) updateData.websiteUrl = websiteUrl;
  if (status) {
    if (!["active", "inactive"].includes(status)) {
      throw new AppError("Status must be either 'active' or 'inactive'", 400);
    }
    updateData.status = status;
  }

  const brand = await Brand.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

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
