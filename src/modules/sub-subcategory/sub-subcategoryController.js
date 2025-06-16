import asyncHandler from "express-async-handler";
import SubSubcategory from "./sub-subcategoryModel.js";
import { AppError } from "../../utils/appError.js";
import Category from "../category/categoryModel.js";
import Subcategory from "../subcategory/subcategoryModel.js";

// Helper function to get localized response based on Accept-Language header
const getLocalizedResponse = (req, subSubcategory) => {
  const lang = req.headers['accept-language']?.startsWith('ar') ? 'ar' : 'en';
  
  if (Array.isArray(subSubcategory)) {
    return subSubcategory.map(subSub => subSub.getLocalized(lang));
  }
  
  return subSubcategory.getLocalized(lang);
};

// Helper function to validate bilingual input
const validateBilingualInput = (data, fieldName, required = true) => {
  if (!data) {
    if (required) {
      throw new AppError(`${fieldName} is required`, 400);
    }
    return null;
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

export const getSubSubcategories = asyncHandler(async (req, res) => {
  const { lang, includeInactive, category, subcategory } = req.query;
  
  let query = {};
  if (!includeInactive || includeInactive !== 'true') {
    query.isActive = true;
  }
  if (category) {
    query.category = category;
  }
  if (subcategory) {
    query.subcategory = subcategory;
  }

  const subSubcategories = await SubSubcategory.find(query)
    .populate('category', 'name description')
    .populate('subcategory', 'name description')
    .sort('order');

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubSubcategories = subSubcategories.map(subSub => subSub.getLocalized(lang));
    return res.status(200).json({
      status: "success",
      results: subSubcategories.length,
      data: localizedSubSubcategories,
    });
  }

  const localizedSubSubcategories = getLocalizedResponse(req, subSubcategories);

  res.status(200).json({
    status: "success",
    results: subSubcategories.length,
    data: localizedSubSubcategories,
  });
});

export const getSubSubcategory = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const subSubcategory = await SubSubcategory.findById(req.params.id)
    .populate('category', 'name description')
    .populate('subcategory', 'name description');

  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubSubcategory = subSubcategory.getLocalized(lang);
    return res.status(200).json({
      status: "success",
      data: localizedSubSubcategory,
    });
  }

  // For admin purposes, return full bilingual data
  if (req.user && req.user.role === 'admin') {
    return res.status(200).json({
      status: "success",
      data: subSubcategory,
    });
  }

  const localizedSubSubcategory = getLocalizedResponse(req, subSubcategory);

  res.status(200).json({
    status: "success",
    data: localizedSubSubcategory,
  });
});

export const getSubSubcategoryBySlug = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const subSubcategory = await SubSubcategory.findBySlug(req.params.slug)
    .populate('category', 'name description')
    .populate('subcategory', 'name description');

  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubSubcategory = subSubcategory.getLocalized(lang);
    return res.status(200).json({
      status: "success",
      data: localizedSubSubcategory,
    });
  }

  const localizedSubSubcategory = getLocalizedResponse(req, subSubcategory);

  res.status(200).json({
    status: "success",
    data: localizedSubSubcategory,
  });
});

export const getSubSubcategoriesByCategory = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const { categoryId } = req.params;

  const subSubcategories = await SubSubcategory.findByCategory(categoryId)
    .populate('subcategory', 'name description');

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubSubcategories = subSubcategories.map(subSub => subSub.getLocalized(lang));
    return res.status(200).json({
      status: "success",
      results: subSubcategories.length,
      data: localizedSubSubcategories,
    });
  }

  const localizedSubSubcategories = getLocalizedResponse(req, subSubcategories);

  res.status(200).json({
    status: "success",
    results: subSubcategories.length,
    data: localizedSubSubcategories,
  });
});

export const getSubSubcategoriesBySubcategory = asyncHandler(async (req, res, next) => {
  const { lang } = req.query;
  const { subcategoryId } = req.params;

  const subSubcategories = await SubSubcategory.findBySubcategory(subcategoryId);

  // If specific language requested, return localized data
  if (lang && (lang === 'en' || lang === 'ar')) {
    const localizedSubSubcategories = subSubcategories.map(subSub => subSub.getLocalized(lang));
    return res.status(200).json({
      status: "success",
      results: subSubcategories.length,
      data: localizedSubSubcategories,
    });
  }

  const localizedSubSubcategories = getLocalizedResponse(req, subSubcategories);

  res.status(200).json({
    status: "success",
    results: subSubcategories.length,
    data: localizedSubSubcategories,
  });
});

export const createSubSubcategory = asyncHandler(async (req, res, next) => {
  let { name, description, metaTitle, metaDescription, category, subcategory, ...otherFields } = req.body;

  // Validate required fields
  if (!subcategory) {
    return next(new AppError("Subcategory ID is required", 400));
  }
  if (!category) {
    return next(new AppError("Category ID is required", 400));
  }

  const foundSubcategory = await Subcategory.findById(subcategory);
  const foundCategory = await Category.findById(category);

  if (!foundSubcategory) {
    return next(new AppError("Subcategory not found", 404));
  }
  if (!foundCategory) {
    return next(new AppError("Category not found", 404));
  }

  // Verify that subcategory belongs to the specified category
  if (String(foundSubcategory.category) !== String(foundCategory._id)) {
    return next(
      new AppError("Subcategory does not belong to the specified category", 400)
    );
  }

  // Validate and parse required bilingual fields
  try {
    name = validateBilingualInput(name, 'Name');
  } catch (error) {
    return next(error);
  }

  // Validate and parse optional bilingual fields
  if (description) {
    try {
      description = validateBilingualInput(description, 'Description', false);
    } catch (error) {
      return next(error);
    }
  }

  if (metaTitle) {
    try {
      metaTitle = validateBilingualInput(metaTitle, 'Meta Title', false);
    } catch (error) {
      return next(error);
    }
  }

  if (metaDescription) {
    try {
      metaDescription = validateBilingualInput(metaDescription, 'Meta Description', false);
    } catch (error) {
      return next(error);
    }
  }

  const subSubcategoryData = {
    name,
    category,
    subcategory,
    ...otherFields
  };

  if (description) subSubcategoryData.description = description;
  if (metaTitle) subSubcategoryData.metaTitle = metaTitle;
  if (metaDescription) subSubcategoryData.metaDescription = metaDescription;

  const subSubcategory = new SubSubcategory(subSubcategoryData);
  await subSubcategory.save();

  // Add sub-subcategory to parent subcategory
  if (foundSubcategory.subSubcategories) {
    foundSubcategory.subSubcategories.push(subSubcategory._id);
    await foundSubcategory.save();
  }

  res.status(201).json({
    status: "success",
    data: subSubcategory,
  });
});

export const updateSubSubcategory = asyncHandler(async (req, res, next) => {
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
      description = validateBilingualInput(description, 'Description', false);
    } catch (error) {
      return next(error);
    }
  }

  if (metaTitle) {
    try {
      metaTitle = validateBilingualInput(metaTitle, 'Meta Title', false);
    } catch (error) {
      return next(error);
    }
  }

  if (metaDescription) {
    try {
      metaDescription = validateBilingualInput(metaDescription, 'Meta Description', false);
    } catch (error) {
      return next(error);
    }
  }

  const updateData = { ...otherFields };
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (metaTitle) updateData.metaTitle = metaTitle;
  if (metaDescription) updateData.metaDescription = metaDescription;

  const subSubcategory = await SubSubcategory.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: subSubcategory,
  });
});

export const deleteSubSubcategory = asyncHandler(async (req, res, next) => {
  const subSubcategory = await SubSubcategory.findByIdAndDelete(req.params.id);
  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }

  // Remove sub-subcategory from parent subcategory
  const subcategory = await Subcategory.findOne({ subSubcategories: subSubcategory._id });
  if (subcategory && subcategory.subSubcategories) {
    subcategory.subSubcategories.pull(subSubcategory._id);
    await subcategory.save();
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const changeSubSubcategoryStatus = asyncHandler(async (req, res, next) => {
  const subSubcategory = await SubSubcategory.findById(req.params.id);
  if (!subSubcategory) {
    return next(new AppError("Sub-subcategory not found", 404));
  }

  subSubcategory.isActive = !subSubcategory.isActive;
  await subSubcategory.save();

  res.status(200).json({
    status: "success",
    data: subSubcategory,
  });
});

// Search sub-subcategories
export const searchSubSubcategories = asyncHandler(async (req, res, next) => {
  const { q, lang, category, subcategory } = req.query;
  
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
  if (subcategory) {
    searchQuery.$and.push({ subcategory: subcategory });
  }

  const subSubcategories = await SubSubcategory.find(searchQuery)
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .sort('order')
    .limit(20);

  const localizedSubSubcategories = subSubcategories.map(subSub => subSub.getLocalized(searchLang));

  res.status(200).json({
    status: "success",
    results: subSubcategories.length,
    data: localizedSubSubcategories,
  });
});
