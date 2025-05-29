import asyncHandler from "express-async-handler";
import SubSubcategory from "./sub-subcategoryModel.js";
import { AppError } from "../../utils/appError.js";
import Category from "../category/categoryModel.js";
import Subcategory from "../subcategory/subcategoryModel.js";

export const getSubSubcategories = asyncHandler(async (req, res) => {
  const subSubcategories = await SubSubcategory.find();
  res.status(200).json({
    status: "success",
    data: {
      subSubcategories,
    },
  });
});

export const getSubSubcategory = asyncHandler(async (req, res, next) => {
  const subSubcategory = await SubSubcategory.findById(req.params.id);
  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      subSubcategory,
    },
  });
});

export const createSubSubcategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;
  const subcategory = await Subcategory.findById(req.body.subcategory);
  const category = await Category.findById(req.body.category);
  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  if (String(subcategory.category) !== String(category._id)) {
    return next(
      new AppError("Subcategory does not belong to the specified category", 400)
    );
  }

  const subSubcategory = new SubSubcategory({
    name,
    description,
    subcategory: req.body.subcategory,
    category: req.body.category,
  });
  await subSubcategory.save();

  // Update the subcategory's subSubcategories array if it exists
  if (subcategory.subSubcategories) {
    subcategory.subSubcategories.push(subSubcategory._id);
    await subcategory.save();
  }

  res.status(201).json({
    status: "success",
    data: {
      subSubcategory,
    },
  });
});

export const updateSubSubcategory = asyncHandler(async (req, res, next) => {
  const subSubcategory = await SubSubcategory.findById(req.params.id);
  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }

  const newSubSubcategory = await SubSubcategory.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      subSubcategory: newSubSubcategory,
    },
  });
});

export const deleteSubSubcategory = asyncHandler(async (req, res, next) => {
  const subSubcategory = await SubSubcategory.findByIdAndDelete(req.params.id);
  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }
  res.status(204).json({
    status: "success",
  });
});

export const changeSubSubcategoryStatus = asyncHandler(
  async (req, res, next) => {
    const subSubcategory = await SubSubcategory.findById(req.params.id);
    if (!subSubcategory) {
      return next(new AppError("Sub-subcategory not found", 404));
    }
    subSubcategory.isActive = !subSubcategory.isActive;
    await subSubcategory.save();
    res.status(200).json({
      status: "success",
      data: {
        subSubcategory: subSubcategory,
      },
    });
  }
);
