import Product from "./productModel.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";

export const getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find()
    .populate("category")
    .populate("subCategory")
    .populate("subSubcategory")
    .populate("brand");
  // .populate("reviews");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category")
    .populate("subCategory")
    .populate("subSubcategory")
    .populate("brand")
    .populate("reviews");

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  // Increment views
  product.views += 1;
  await product.save();

  res.status(200).json({
    status: "success",
    data: product,
  });
});

export const createProduct = asyncHandler(async (req, res, next) => {
  // Handle uploaded files
  if (req.files) {
    if (req.files.coverImage && req.files.coverImage[0]) {
      req.body.coverImage = req.files.coverImage[0].path;
    }
    if (req.files.images) {
      req.body.images = req.files.images.map((file) => file.path);
    }
  }

  // Parse specs and variants if they come as JSON strings (from multipart form-data)
  if (req.body.specs && typeof req.body.specs === "string") {
    try {
      req.body.specs = JSON.parse(req.body.specs);
    } catch {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid specs JSON" });
    }
  }
  if (req.body.variants && typeof req.body.variants === "string") {
    try {
      req.body.variants = JSON.parse(req.body.variants);
    } catch {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid variants JSON" });
    }
  }

  const product = new Product(req.body);
  await product.save();

  res.status(201).json({
    status: "success",
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const updateStock = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: req.body.stock },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: product,
  });
});

export const updatePrice = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      price: req.body.price,
      priceAfterDiscount: req.body.priceAfterDiscount,
      discount: req.body.discount,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: product,
  });
});

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
