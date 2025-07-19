import asyncHandler from "express-async-handler";
import Category from "./categoryModel.js";
import { AppError } from "../../utils/appError.js";

// Helper function to get localized response based on Accept-Language header
const getLocalizedResponse = (req, category) => {
  const lang = req.headers["accept-language"]?.startsWith("ar") ? "ar" : "en";

  if (Array.isArray(category)) {
    return category.map((cat) => cat.getLocalized(lang));
  }

  return category.getLocalized(lang);
};

// Helper function to validate bilingual input
const validateBilingualInput = (data, fieldName) => {
  if (!data) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  // Handle case where data might be a string (JSON string)
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new AppError(
        `${fieldName} must be a valid JSON object with 'en' and 'ar' properties`,
        400
      );
    }
  }

  if (typeof data !== "object" || Array.isArray(data) || data === null) {
    throw new AppError(
      `${fieldName} must be an object with 'en' and 'ar' properties. Received: ${typeof data}`,
      400
    );
  }

  if (!data.en || typeof data.en !== "string" || data.en.trim() === "") {
    throw new AppError(
      `${fieldName} must have a valid English (en) value`,
      400
    );
  }

  if (!data.ar || typeof data.ar !== "string" || data.ar.trim() === "") {
    throw new AppError(`${fieldName} must have a valid Arabic (ar) value`, 400);
  }

  return data; // Return the parsed data
};

// GET /api/categories
export const getAllCategories = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;

  let query = {};
  if (!includeInactive || includeInactive !== "true") {
    query.isActive = true;
  }

  const categories = await Category.find(query)
    .populate({
      path: "subcategories",
      select: "-category",
      populate: {
        path: "subSubcategories",
        select: "-subcategory -category",
      },
    })
    .sort("order");

  // إرجاع جميع اللغات كما هي من قاعدة البيانات
  return res.status(200).json({
    status: "success",
    results: categories.length,
    data: categories,
  });
});

// GET /api/categories/active
export const getActiveCategories = asyncHandler(async (req, res) => {
  const { lang } = req.query;
  const categories = await Category.findActive().populate({
    path: "subcategories",
    match: { isActive: true },
    populate: {
      path: "subSubcategories",
      match: { isActive: true },
    },
  });

  // If specific language requested, return localized data
  if (lang && (lang === "en" || lang === "ar")) {
    const localizedCategories = categories.map((cat) => cat.getLocalized(lang));
    return res.status(200).json({
      status: "success",
      results: categories.length,
      data: localizedCategories,
    });
  }

  const localizedCategories = getLocalizedResponse(req, categories);

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: localizedCategories,
  });
});

// GET /api/categories/slug/:slug
export const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const category = await Category.findBySlug(req.params.slug).populate({
    path: "subcategories",
    match: { isActive: true },
    populate: {
      path: "subSubcategories",
      match: { isActive: true },
    },
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // If specific language requested, return localized data
  if (lang && (lang === "en" || lang === "ar")) {
    const localizedCategory = category.getLocalized(lang);
    return res.status(200).json({
      status: "success",
      data: localizedCategory,
    });
  }

  const localizedCategory = getLocalizedResponse(req, category);

  res.status(200).json({
    status: "success",
    data: localizedCategory,
  });
});

// GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const category = await Category.findById(req.params.id).populate({
    path: "subcategories",
    populate: {
      path: "subSubcategories",
    },
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // If specific language requested, return localized data
  if (lang && (lang === "en" || lang === "ar")) {
    const localizedCategory = category.getLocalized(lang);
    return res.status(200).json({
      status: "success",
      data: localizedCategory,
    });
  }

  // For admin purposes, return full bilingual data
  if (req.user && req.user.role === "admin") {
    return res.status(200).json({
      status: "success",
      data: category,
    });
  }

  const localizedCategory = getLocalizedResponse(req, category);

  res.status(200).json({
    status: "success",
    data: localizedCategory,
  });
});

// POST /api/categories
export const createCategory = asyncHandler(async (req, res, next) => {
  let { name, description, metaTitle, metaDescription, ...otherFields } =
    req.body;

  // Validate and parse required bilingual fields
  try {
    name = validateBilingualInput(name, "Name");
    description = validateBilingualInput(description, "Description");
  } catch (error) {
    return next(error);
  }

  // Validate and parse optional bilingual fields if provided
  if (metaTitle) {
    try {
      metaTitle = validateBilingualInput(metaTitle, "Meta Title");
    } catch (error) {
      return next(error);
    }
  }

  if (metaDescription) {
    try {
      metaDescription = validateBilingualInput(
        metaDescription,
        "Meta Description"
      );
    } catch (error) {
      return next(error);
    }
  }

  const categoryData = {
    name,
    description,
    ...otherFields,
  };

  if (metaTitle) categoryData.metaTitle = metaTitle;
  if (metaDescription) categoryData.metaDescription = metaDescription;

  const category = new Category(categoryData);
  const saved = await category.save();

  res.status(201).json({
    status: "success",
    data: {
      category: saved,
    },
  });
});

// PATCH /api/categories/:id
export const updateCategory = asyncHandler(async (req, res, next) => {
  let { name, description, metaTitle, metaDescription, ...otherFields } =
    req.body;

  // Validate and parse bilingual fields if they are being updated
  if (name) {
    try {
      name = validateBilingualInput(name, "Name");
    } catch (error) {
      return next(error);
    }
  }

  if (description) {
    try {
      description = validateBilingualInput(description, "Description");
    } catch (error) {
      return next(error);
    }
  }

  if (metaTitle) {
    try {
      metaTitle = validateBilingualInput(metaTitle, "Meta Title");
    } catch (error) {
      return next(error);
    }
  }

  if (metaDescription) {
    try {
      metaDescription = validateBilingualInput(
        metaDescription,
        "Meta Description"
      );
    } catch (error) {
      return next(error);
    }
  }

  const updateData = { ...otherFields };
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (metaTitle) updateData.metaTitle = metaTitle;
  if (metaDescription) updateData.metaDescription = metaDescription;

  const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});

// DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Check if category has subcategories
  if (category.subcategories && category.subcategories.length > 0) {
    return next(
      new AppError(
        "Cannot delete category with subcategories. Please delete subcategories first.",
        400
      )
    );
  }

  await category.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Category deleted successfully",
  });
});

// PATCH /api/categories/order
export const updateCategoryOrder = asyncHandler(async (req, res, next) => {
  const { orders } = req.body; // [{ id, order }]

  if (!orders || !Array.isArray(orders)) {
    return next(new AppError("Orders array is required", 400));
  }

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
export const toggleCategoryStatus = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError("Category not found", 404));
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

// GET /api/categories/search
export const searchCategories = asyncHandler(async (req, res, next) => {
  const { q, lang } = req.query;

  if (!q) {
    return next(new AppError("Search query is required", 400));
  }

  const searchLang =
    lang && (lang === "en" || lang === "ar")
      ? lang
      : req.headers["accept-language"]?.startsWith("ar")
      ? "ar"
      : "en";

  const searchQuery = {
    $and: [
      { isActive: true },
      {
        $or: [
          { [`name.${searchLang}`]: { $regex: q, $options: "i" } },
          { [`description.${searchLang}`]: { $regex: q, $options: "i" } },
        ],
      },
    ],
  };

  const categories = await Category.find(searchQuery)
    .populate({
      path: "subcategories",
      match: { isActive: true },
    })
    .sort("order")
    .limit(20);

  const localizedCategories = categories.map((cat) =>
    cat.getLocalized(searchLang)
  );

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: localizedCategories,
  });
});
