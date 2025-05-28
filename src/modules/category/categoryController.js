import asyncHandler from "express-async-handler";
import Category from "./categoryModel.js";

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate(
    "subcategories",
    "-category"
  );
  res.status(200).json(categories);
});

export const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findActive();
  res.status(200).json(categories);
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate(
    "subcategories"
  );
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const newCategory = new Category({
    ...req.body,
    parent: req.body.parent || null,
  });
  const saved = await newCategory.save();
  res.status(201).json({
    status: "success",
    data: {
      category: saved,
    },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({
    status: "success",
    data: {
      category,
    },
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const hasSubcategories = await Category.exists({ parent: req.params.id });
  if (hasSubcategories) {
    res.status(400);
    throw new Error(
      "Cannot delete category with subcategories. Please delete subcategories first."
    );
  }

  await category.deleteOne();
  res.json({
    status: "success",
    message: "Category deleted successfully",
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "subcategories"
  );
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({
    status: "success",
    data: {
      category,
    },
  });
});

export const updateCategoryOrder = asyncHandler(async (req, res) => {
  const { orders } = req.body; // Array of { id, order } objects
  const updates = orders.map((item) =>
    Category.findByIdAndUpdate(item.id, { order: item.order }, { new: true })
  );
  await Promise.all(updates);
  res.json({
    status: "success",
    message: "Categories order updated successfully",
  });
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  category.isActive = !category.isActive;
  await category.save();

  res.json({
    status: "success",
    data: {
      category,
    },
  });
});
