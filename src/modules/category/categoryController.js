import asyncHandler from "express-async-handler";
import Category from "./categoryModel.js";

// GET /api/categories
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate({
    path: "subcategories",
    select: "-category",
    populate: {
      path: "subSubcategories",
      select: "-subcategory -category",
    },
  });

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: categories,
  });
});

// GET /api/categories/active
export const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findActive();

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: categories,
  });
});

// GET /api/categories/slug/:slug
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate({
    path: "subcategories",
    populate: {
      path: "subSubcategories",
    },
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    status: "success",
    data: category,
  });
});

// GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate({
    path: "subcategories",
    populate: {
      path: "subSubcategories",
    },
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    status: "success",
    data: category,
  });
});

// POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  const category = new Category({
    ...req.body,
    parent: req.body.parent || null,
  });

  const saved = await category.save();

  res.status(201).json({
    status: "success",
    data: {
      category: saved,
    },
  });
});

// PATCH /api/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});

// DELETE /api/categories/:id
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

  res.status(200).json({
    status: "success",
    message: "Category deleted successfully",
  });
});

// PATCH /api/categories/order
export const updateCategoryOrder = asyncHandler(async (req, res) => {
  const { orders } = req.body; // [{ id, order }]
  const updates = orders.map((item) =>
    Category.findByIdAndUpdate(item.id, { order: item.order }, { new: true })
  );
  await Promise.all(updates);

  res.status(200).json({
    status: "success",
    message: "Categories order updated successfully",
  });
});

// PATCH /api/categories/:id/toggle
export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});
