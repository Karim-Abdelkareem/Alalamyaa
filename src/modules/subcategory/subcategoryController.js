import Subcategory from "./subcategoryModel.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
import Category from "../category/categoryModel.js";

// Helper function to get localized response based on Accept-Language header
const getLocalizedResponse = (req, subcategory) => {
  const lang = req.headers['accept-language']?.startsWith('ar') ? 'ar' : 'en';
  
  if (Array.isArray(subcategory)) {
    return subcategory.map(sub => sub.getLocalized(lang));
  }
  
  return subcategory.getLocalized(lang);
};

// Helper function to validate bilingual input
const validateBilingualInput = (data, fieldName) => {
  if (!data) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  
  // Handle case where data might be a string (JSON string)
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new AppError(`${fieldName} must be a valid JSON object with 'en' and 'ar' properties`, 400);
    }
  }
  
  if (typeof data !== 'object' || Array.isArray(data) || data === null) {
    throw new AppError(`${fieldName} must be an object with 'en' and 'ar' properties. Received: ${typeof data}`, 400);
  }
  
  if (!data.en || typeof data.en !== 'string' || data.en.trim() === '') {
    throw new AppError(`${fieldName} must have a valid English (en) value`, 400);
  }
  
  if (!data.ar || typeof data.ar !== 'string' || data.ar.trim() === '') {
    throw new AppError(`${fieldName} must have a valid Arabic (ar) value`, 400);
  }
  
  return data; // Return the parsed data
};

export const getAllSubcategories = asyncHandler(async (req, res) => {
  const { lang, includeInactive, category } = req.query;
  
  let query = {};
  if (!includeInactive || includeInactive !== 'true') {
    query.isActive = true;
  }
  if (category) {
    query.category = category;
  }

  const subcategories = await Subcategory.find(query)
    .populate('category', 'name description')
    .populate('subSubcategories')
    .sort('order');

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubcategories = subcategories.map(sub => sub.getLocalized(lang));
    return res.status(200).json({
      status: "success",
      results: subcategories.length,
      data: localizedSubcategories,
    });
  }

  const localizedSubcategories = getLocalizedResponse(req, subcategories);

  res.status(200).json({
    status: "success",
    results: subcategories.length,
    data: localizedSubcategories,
  });
});

export const getSubcategoryById = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const subcategory = await Subcategory.findById(req.params.id)
    .populate('category', 'name description')
    .populate('subSubcategories');

  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubcategory = subcategory.getLocalized(lang);
    return res.status(200).json({
      status: "success",
      data: localizedSubcategory,
    });
  }

  // For admin purposes, return full bilingual data
  if (req.user && req.user.role === 'admin') {
    return res.status(200).json({
      status: "success",
      data: subcategory,
    });
  }

  const localizedSubcategory = getLocalizedResponse(req, subcategory);

  res.status(200).json({
    status: "success",
    data: localizedSubcategory,
  });
});

export const getSubcategoryBySlug = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const subcategory = await Subcategory.findBySlug(req.params.slug)
    .populate('category', 'name description')
    .populate('subSubcategories');

  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubcategory = subcategory.getLocalized(lang);
    return res.status(200).json({
      status: "success",
      data: localizedSubcategory,
    });
  }

  const localizedSubcategory = getLocalizedResponse(req, subcategory);

  res.status(200).json({
    status: "success",
    data: localizedSubcategory,
  });
});

export const getSubcategoriesByCategory = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const { categoryId } = req.params;

  const subcategories = await Subcategory.findByCategory(categoryId)
    .populate('subSubcategories');

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubcategories = subcategories.map(sub => sub.getLocalized(lang));
    return res.status(200).json({
      status: "success",
      results: subcategories.length,
      data: localizedSubcategories,
    });
  }

  const localizedSubcategories = getLocalizedResponse(req, subcategories);

  res.status(200).json({
    status: "success",
    results: subcategories.length,
    data: localizedSubcategories,
  });
});

export const createSubcategory = asyncHandler(async (req, res, next) => {
  let { category, name, description, metaTitle, metaDescription, ...otherFields } = req.body;

  // Validate required fields
  if (!category) {
    return next(new AppError("Category ID is required", 400));
  }

  const foundCategory = await Category.findById(category);
  if (!foundCategory) {
    return next(new AppError("Category not found", 404));
  }

  // Validate and parse required bilingual fields
  try {
    name = validateBilingualInput(name, 'Name');
    description = validateBilingualInput(description, 'Description');
  } catch (error) {
    return next(error);
  }

  // Validate and parse optional bilingual fields if provided
  if (metaTitle) {
    try {
      metaTitle = validateBilingualInput(metaTitle, 'Meta Title');
    } catch (error) {
      return next(error);
    }
  }

  if (metaDescription) {
    try {
      metaDescription = validateBilingualInput(metaDescription, 'Meta Description');
    } catch (error) {
      return next(error);
    }
  }

  const subcategoryData = {
    category,
    name,
    description,
    ...otherFields
  };

  if (metaTitle) subcategoryData.metaTitle = metaTitle;
  if (metaDescription) subcategoryData.metaDescription = metaDescription;

  const newSubcategory = new Subcategory(subcategoryData);
  await newSubcategory.save();

  // Add subcategory to parent category
  foundCategory.subcategories.push(newSubcategory._id);
  await foundCategory.save();

  res.status(201).json({
    status: "success",
    data: newSubcategory,
  });
});

export const updateSubcategory = asyncHandler(async (req, res, next) => {
  let { name, description, metaTitle, metaDescription, ...otherFields } = req.body;

  // Validate and parse bilingual fields if they are being updated
  if (name) {
    try {
      name = validateBilingualInput(name, 'Name');
    } catch (error) {
      return next(error);
    }
  }

  if (description) {
    try {
      description = validateBilingualInput(description, 'Description');
    } catch (error) {
      return next(error);
    }
  }

  if (metaTitle) {
    try {
      metaTitle = validateBilingualInput(metaTitle, 'Meta Title');
    } catch (error) {
      return next(error);
    }
  }

  if (metaDescription) {
    try {
      metaDescription = validateBilingualInput(metaDescription, 'Meta Description');
    } catch (error) {
      return next(error);
    }
  }

  const updateData = { ...otherFields };
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (metaTitle) updateData.metaTitle = metaTitle;
  if (metaDescription) updateData.metaDescription = metaDescription;

  const subcategory = await Subcategory.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: subcategory,
  });
});

export const deleteSubcategory = asyncHandler(async (req, res, next) => {
  const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
  if (!subcategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  // Remove subcategory from parent category
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
    data: subcategory,
  });
});

// Search subcategories
export const searchSubcategories = asyncHandler(async (req, res, next) => {
  const { q, lang, category } = req.query;
  
  if (!q) {
    return next(new AppError("Search query is required", 400));
  }

  const searchLang = lang && (lang === 'en' || lang === 'ar') ? lang : 
    (req.headers['accept-language']?.startsWith('ar') ? 'ar' : 'en');

  const searchQuery = {
    $and: [
      { isActive: true },
      {
        $or: [
          { [`name.${searchLang}`]: { $regex: q, $options: 'i' } },
          { [`description.${searchLang}`]: { $regex: q, $options: 'i' } }
        ]
      }
    ]
  };

  if (category) {
    searchQuery.$and.push({ category: category });
  }

  const subcategories = await Subcategory.find(searchQuery)
    .populate('category', 'name')
    .populate('subSubcategories')
    .sort('order')
    .limit(20);

  const localizedSubcategories = subcategories.map(sub => sub.getLocalized(searchLang));

  res.status(200).json({
    status: "success",
    results: subcategories.length,
    data: localizedSubcategories,
  });
});
