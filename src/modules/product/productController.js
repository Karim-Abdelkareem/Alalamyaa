import Product from "./productModel.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";

// Get all products
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find()
    .populate("category", "name description image")
    .populate("subCategory", "name description")
    .populate("subSubcategory", "name description")
    .populate("brand", "name description logoUrl websiteUrl");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

// Get product by ID
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name description image")
    .populate("subCategory", "name description")
    .populate("subSubcategory", "name description")
    .populate("brand", "name description logoUrl websiteUrl");
  // .populate("reviews");

  if (!product) return next(new AppError("No product found with that ID", 404));

  product.views = (product.views || 0) + 1;
  await product.save();

  res.status(200).json({
    status: "success",
    data: product,
  });
});

// Create product
export const createProduct = asyncHandler(async (req, res, next) => {
  // Handle file uploads
  if (req.files) {
    if (req.files.coverImage?.[0]) {
      req.body.coverImage = req.files.coverImage[0].path;
    }
  }

  // Parse variants and specifications if sent as JSON strings
  ["variants", "specifications", "variantImageCounts"].forEach((field) => {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        return res.status(400).json({
          status: "fail",
          message: `Invalid JSON in ${field}`,
        });
      }
    }
  });

  if (
    req.body.variants &&
    Array.isArray(req.body.variants) &&
    req.files?.variantImages &&
    Array.isArray(req.body.variantImageCounts)
  ) {
    let imageIndex = 0;
    req.body.variants.forEach((variant, idx) => {
      const imageCount = req.body.variantImageCounts[idx] || 0;
      const imagesForVariant = req.files.variantImages
        .slice(imageIndex, imageIndex + imageCount)
        .map((file) => file.path);

      variant.images = imagesForVariant;
      imageIndex += imageCount;
    });
  }

  const product = new Product(req.body);
  await product.save();

  res.status(201).json({
    status: "success",
    data: product,
  });
});

// Update product
export const updateProduct = asyncHandler(async (req, res, next) => {
  // Handle cover image
  if (req.body.coverImage && req.files?.coverImage?.[0]) {
    req.body.coverImage = req.files.coverImage[0].path;
  }

  // Parse JSON fields
  ["variants", "specifications", "variantImageCounts"].forEach((field) => {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        return res.status(400).json({
          status: "fail",
          message: `Invalid JSON in ${field}`,
        });
      }
    }
  });

  // Handle variant images update only if new images are uploaded
  if (
    req.body.variants &&
    Array.isArray(req.body.variants) &&
    req.files?.variantImages &&
    Array.isArray(req.body.variantImageCounts)
  ) {
    let imageIndex = 0;
    req.body.variants.forEach((variant, idx) => {
      const imageCount = req.body.variantImageCounts[idx] || 0;
      const imagesForVariant = req.files.variantImages
        .slice(imageIndex, imageIndex + imageCount)
        .map((file) => file.path);

      // Only assign images if there are new ones
      if (imagesForVariant.length > 0) {
        variant.images = imagesForVariant;
      }

      imageIndex += imageCount;
    });
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedProduct) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    // data: updatedProduct,
  });
});

// Delete product
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError("No product found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Update stock of a specific variant
export const updateVariantStock = asyncHandler(async (req, res, next) => {
  const { variantIndex, stock } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product || !product.variants?.[variantIndex]) {
    return next(new AppError("Variant not found", 404));
  }

  product.variants[variantIndex].stock = stock;
  await product.save();

  res.status(200).json({
    status: "success",
    data: product,
  });
});

// Update price of a specific variant
export const updateVariantPrice = asyncHandler(async (req, res, next) => {
  const { variantIndex, price, discountPrice } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product || !product.variants?.[variantIndex]) {
    return next(new AppError("Variant not found", 404));
  }

  product.variants[variantIndex].price = price;
  if (discountPrice !== undefined) {
    product.variants[variantIndex].discountPrice = discountPrice;
  }

  await product.save();

  res.status(200).json({
    status: "success",
    data: product,
  });
});

// Get products by category
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ category: req.params.categoryId })
    .populate("category")
    .populate("subCategory")
    .populate("subSubcategory")
    .populate("brand")
    .populate("reviews");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});
