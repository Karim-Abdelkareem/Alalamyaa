import Subcategory from "./subcategoryModel.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
import Category from "../category/categoryModel.js";

export const getAllSubcategories = asyncHandler(async (req, res) => {
  const subcategories = await Subcategory.find();
  res.status(200).json({
    status: "success",
    results: subcategories.length,
    data: {
      subcategories,
    },
  });
});

export const getSubcategoryById = asyncHandler(async (req, res, next) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      subcategory,
    },
  });
});

export const createSubcategory = asyncHandler(async (req, res, next) => {
  const { category, name, description } = req.body;

  const existingSubcategory = await Subcategory.findOne({
    name,
  });
  if (existingSubcategory) {
    return next(new AppError("Subcategory with this name already exists", 400));
  }
  if (!category) {
    return next(new AppError("Category ID is required", 400));
  }
  const foundCategory = await Category.findById(category);
  if (!foundCategory) {
    return next(new AppError("Category not found", 404));
  }

  const newSubcategory = new Subcategory(req.body);
  await newSubcategory.save();

  foundCategory.subcategories.push(newSubcategory._id);
  await foundCategory.save();

  res.status(201).json({
    status: "success",
    data: {
      subcategory: newSubcategory,
    },
  });
});

export const updateSubcategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  const subcategory = await Subcategory.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true, runValidators: true }
  );

  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      subcategory,
    },
  });
});

export const deleteSubcategory = asyncHandler(async (req, res, next) => {
  const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  const category = await Category.findOne({ subcategories: subcategory._id });
  if (category) {
    category.subcategories.pull(subcategory._id);
    await category.save();
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const changeSubcategoryStatus = asyncHandler(async (req, res, next) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  subcategory.isActive = !subcategory.isActive;
  await subcategory.save();

  res.status(200).json({
    status: "success",
    data: {
      subcategory,
    },
  });
});
