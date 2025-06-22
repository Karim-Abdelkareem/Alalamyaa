// import Product from "./productModel.js";
// import asyncHandler from "express-async-handler";
// import { AppError } from "../../utils/appError.js";

// // Get all products
// export const getAllProducts = asyncHandler(async (req, res, next) => {
//   const products = await Product.find()
//     .populate("category", "name en ar description") // Include localized names
//     .populate("subCategory", "name en ar description")
//     .populate("subSubcategory", "name en ar description")
//     .populate("brand", "name description logoUrl websiteUrl");

//   res.status(200).json({
//     status: "success",
//     results: products.length,
//     data: products,
//   });
// });

// // Get product by ID
// export const getProductById = asyncHandler(async (req, res, next) => {
//   const product = await Product.findById(req.params.id)
//     .populate("category", "name description image")
//     .populate("subCategory", "name description")
//     .populate("subSubcategory", "name description")
//     .populate("brand", "name description logoUrl websiteUrl");
//   // .populate("reviews");

//   if (!product) return next(new AppError("No product found with that ID", 404));

//   product.views = (product.views || 0) + 1;
//   await product.save();

//   res.status(200).json({
//     status: "success",
//     data: product,
//   });
// });

// // Create product
// export const createProduct = asyncHandler(async (req, res, next) => {
//   const productData = req.body;

//   // Handle optional fields
//   if (productData.subCategory === "") productData.subCategory = null;
//   if (productData.subSubcategory === "") productData.subSubcategory = null;

//   // Ensure unit fields are properly formatted
//   if (productData.specifications) {
//     productData.specifications.forEach((spec) => {
//       if (!spec.unit) {
//         spec.unit = { en: "", ar: "" };
//       } else {
//         spec.unit.en = spec.unit.en || "";
//         spec.unit.ar = spec.unit.ar || "";
//       }
//     });
//   }

//   // Validate required fields
//   if (
//     !productData.name ||
//     !productData.name.en ||
//     !productData.details ||
//     !productData.details.en
//   ) {
//     return res.status(400).json({
//       message: "Product name (English) and details (English) are required.",
//     });
//   }
//   if (!productData.category) {
//     return res.status(400).json({ message: "Product category is required." });
//   }
//   if (!productData.brand) {
//     return res.status(400).json({ message: "Product brand is required." });
//   }
//   if (!Array.isArray(productData.images) || productData.images.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "At least one main product image is required." });
//   }

//   // Validate images
//   productData.images.forEach((img) => {
//     if (!img.url || !img.altText || !img.altText.en) {
//       return res
//         .status(400)
//         .json({ message: "Each image must have a URL and English altText." });
//     }
//   });

//   // Validate variants and generate temporary SKUs
//   if (productData.variants && productData.variants.length > 0) {
//     const usedSKUs = new Set();
//     const tempId = Date.now().toString(36).slice(-6); // Generate a temp ID

//     for (const variantType of productData.variants) {
//       if (
//         !variantType.name ||
//         !variantType.name.en ||
//         !Array.isArray(variantType.options) ||
//         variantType.options.length === 0
//       ) {
//         return res.status(400).json({
//           message:
//             "Each variant type must have a name and at least one option.",
//         });
//       }

//       for (const option of variantType.options) {
//         if (!option.value || !option.value.en) {
//           return res.status(400).json({
//             message: "Each variant option must have a value (English).",
//           });
//         }
//         if (typeof option.price !== "number" || option.price < 0) {
//           return res.status(400).json({
//             message: "Variant option price must be a non-negative number.",
//           });
//         }
//         if (typeof option.stock !== "number" || option.stock < 0) {
//           return res.status(400).json({
//             message: "Variant option stock must be a non-negative number.",
//           });
//         }
//         // Validate embedded color data
//         if (option.colorName && !option.colorHex && !option.colorSwatchImage) {
//           return res.status(400).json({
//             message:
//               "If colorName is provided, either colorHex or colorSwatchImage must be provided for variant option.",
//           });
//         }
//         // Validate variant images
//         if (option.variantImages && Array.isArray(option.variantImages)) {
//           option.variantImages.forEach((img) => {
//             if (!img.url || !img.altText || !img.altText.en) {
//               return res.status(400).json({
//                 message:
//                   "Each variant image must have a URL and English altText.",
//               });
//             }
//           });
//         }

//         // Generate temporary SKU if missing
//         if (!option.sku) {
//           const randomSuffix = Math.random().toString(36).slice(2, 8);
//           option.sku = `TEMP-${tempId}-${randomSuffix}`;
//         }

//         // Check for duplicate SKUs
//         if (usedSKUs.has(option.sku)) {
//           return res.status(400).json({
//             message: `Duplicate SKU found: ${option.sku}. SKUs must be unique.`,
//           });
//         }
//         usedSKUs.add(option.sku);
//       }
//     }
//   }

//   try {
//     const newProduct = new Product(productData);
//     const savedProduct = await newProduct.save();
//     const populatedProduct = await Product.findById(savedProduct._id)
//       .populate("category subCategory subSubcategory brand")
//       .lean();
//     res.status(201).json({
//       message: "Product created successfully!",
//       product: populatedProduct,
//     });
//   } catch (error) {
//     // Handle duplicate key error specifically
//     if (
//       error.code === 11000 &&
//       error.keyPattern &&
//       error.keyPattern["variants.options.sku"]
//     ) {
//       return res.status(400).json({
//         message:
//           "Duplicate SKU detected. Please ensure all variant SKUs are unique.",
//         details: error.keyValue,
//       });
//     }

//     // Handle other errors
//     // console.error("Product creation error:", error);
//     res.status(500).json({
//       message: "Failed to create product",
//       error: error.message,
//     });
//   }
// });

// // Update product
// export const updateProduct = asyncHandler(async (req, res, next) => {
//   // Handle cover image
//   if (req.body.coverImage && req.files?.coverImage?.[0]) {
//     req.body.coverImage = req.files.coverImage[0].path;
//   }

//   // Parse JSON fields
//   ["variants", "specifications", "variantImageCounts"].forEach((field) => {
//     if (req.body[field] && typeof req.body[field] === "string") {
//       try {
//         req.body[field] = JSON.parse(req.body[field]);
//       } catch {
//         return res.status(400).json({
//           status: "fail",
//           message: `Invalid JSON in ${field}`,
//         });
//       }
//     }
//   });

//   // Handle variant images update only if new images are uploaded
//   if (
//     req.body.variants &&
//     Array.isArray(req.body.variants) &&
//     req.files?.variantImages &&
//     Array.isArray(req.body.variantImageCounts)
//   ) {
//     let imageIndex = 0;
//     req.body.variants.forEach((variant, idx) => {
//       const imageCount = req.body.variantImageCounts[idx] || 0;
//       const imagesForVariant = req.files.variantImages
//         .slice(imageIndex, imageIndex + imageCount)
//         .map((file) => file.path);

//       // Only assign images if there are new ones
//       if (imagesForVariant.length > 0) {
//         variant.images = imagesForVariant;
//       }

//       imageIndex += imageCount;
//     });
//   }

//   const updatedProduct = await Product.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     {
//       new: true,
//       runValidators: true,
//     }
//   );

//   if (!updatedProduct) {
//     return next(new AppError("No product found with that ID", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     // data: updatedProduct,
//   });
// });

// // Delete product
// export const deleteProduct = asyncHandler(async (req, res, next) => {
//   const product = await Product.findByIdAndDelete(req.params.id);
//   if (!product) return next(new AppError("No product found with that ID", 404));

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

// // Update stock of a specific variant
// export const updateVariantStock = asyncHandler(async (req, res, next) => {
//   const { variantIndex, stock } = req.body;
//   const product = await Product.findById(req.params.id);

//   if (!product || !product.variants?.[variantIndex]) {
//     return next(new AppError("Variant not found", 404));
//   }

//   product.variants[variantIndex].stock = stock;
//   await product.save();

//   res.status(200).json({
//     status: "success",
//     data: product,
//   });
// });

// // Update price of a specific variant
// export const updateVariantPrice = asyncHandler(async (req, res, next) => {
//   const { variantIndex, price, discountPrice } = req.body;
//   const product = await Product.findById(req.params.id);

//   if (!product || !product.variants?.[variantIndex]) {
//     return next(new AppError("Variant not found", 404));
//   }

//   product.variants[variantIndex].price = price;
//   if (discountPrice !== undefined) {
//     product.variants[variantIndex].discountPrice = discountPrice;
//   }

//   await product.save();

//   res.status(200).json({
//     status: "success",
//     data: product,
//   });
// });

// // Get products by category
// export const getProductsByCategory = asyncHandler(async (req, res, next) => {
//   const products = await Product.find({ category: req.params.categoryId })
//     .populate("category")
//     .populate("subCategory")
//     .populate("subSubcategory")
//     .populate("brand")
//     .populate("reviews");

//   res.status(200).json({
//     status: "success",
//     results: products.length,
//     data: products,
//   });
// });
import Product from "./productModel.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";

// Get all products
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find()
    .populate("category", "name en ar description")
    .populate("subCategory", "name en ar description")
    .populate("subSubcategory", "name en ar description")
    .populate("brand", "name description logoUrl websiteUrl");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

// Get product by ID
export const getProductById = asyncHandler(async (req, res, next) => {
  // console.log("Product ID:");
  const product = await Product.findById(req.params.id)
    .populate("category", "name description image")
    .populate("subCategory", "name description")
    .populate("subSubcategory", "name description")
    .populate("brand", "name description logoUrl websiteUrl");

  if (!product) return next(new AppError("No product found with that ID", 404));
  if (req.user.role !== "admin") {
    product.views = (product.views || 0) + 1;
    await product.save();
  }
  res.status(200).json({
    status: "success",
    data: product,
  });
});

// Create product
export const createProduct = asyncHandler(async (req, res, next) => {
  const productData = req.body;

  // Handle optional fields
  if (productData.subCategory === "") productData.subCategory = null;
  if (productData.subSubcategory === "") productData.subSubcategory = null;

  // Ensure unit fields are properly formatted
  if (productData.specifications) {
    productData.specifications.forEach((spec) => {
      if (!spec.unit) {
        spec.unit = { en: "", ar: "" };
      } else {
        spec.unit.en = spec.unit.en || "";
        spec.unit.ar = spec.unit.ar || "";
      }
    });
  }

  // Validate required fields
  if (
    !productData.name ||
    !productData.name.en ||
    !productData.details ||
    !productData.details.en
  ) {
    return res.status(400).json({
      message: "Product name (English) and details (English) are required.",
    });
  }
  if (!productData.category) {
    return res.status(400).json({ message: "Product category is required." });
  }
  if (!productData.brand) {
    return res.status(400).json({ message: "Product brand is required." });
  }
  if (!Array.isArray(productData.images) || productData.images.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one main product image is required." });
  }

  // Validate images
  productData.images.forEach((img) => {
    if (!img.url || !img.altText || !img.altText.en) {
      return res
        .status(400)
        .json({ message: "Each image must have a URL and English altText." });
    }
  });

  // Validate variants and generate temporary SKUs
  if (productData.variants && productData.variants.length > 0) {
    const usedSKUs = new Set();
    const tempId = Date.now().toString(36).slice(-6); // Generate a temp ID

    for (const variantType of productData.variants) {
      if (
        !variantType.name ||
        !variantType.name.en ||
        !Array.isArray(variantType.options) ||
        variantType.options.length === 0
      ) {
        return res.status(400).json({
          message:
            "Each variant type must have a name and at least one option.",
        });
      }

      for (const option of variantType.options) {
        if (!option.value || !option.value.en) {
          return res.status(400).json({
            message: "Each variant option must have a value (English).",
          });
        }
        if (typeof option.price !== "number" || option.price < 0) {
          return res.status(400).json({
            message: "Variant option price must be a non-negative number.",
          });
        }
        if (typeof option.stock !== "number" || option.stock < 0) {
          return res.status(400).json({
            message: "Variant option stock must be a non-negative number.",
          });
        }
        // Validate embedded color data
        if (option.colorName && !option.colorHex && !option.colorSwatchImage) {
          return res.status(400).json({
            message:
              "If colorName is provided, either colorHex or colorSwatchImage must be provided for variant option.",
          });
        }
        // Validate variant images
        if (option.variantImages && Array.isArray(option.variantImages)) {
          option.variantImages.forEach((img) => {
            if (!img.url || !img.altText || !img.altText.en) {
              return res.status(400).json({
                message:
                  "Each variant image must have a URL and English altText.",
              });
            }
          });
        }

        // Generate temporary SKU if missing
        if (!option.sku) {
          const randomSuffix = Math.random().toString(36).slice(2, 8);
          option.sku = `TEMP-${tempId}-${randomSuffix}`;
        }

        // Check for duplicate SKUs
        if (usedSKUs.has(option.sku)) {
          return res.status(400).json({
            message: `Duplicate SKU found: ${option.sku}. SKUs must be unique.`,
          });
        }
        usedSKUs.add(option.sku);
      }
    }
  }

  try {
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate("category subCategory subSubcategory brand")
      .lean();
    res.status(201).json({
      message: "Product created successfully!",
      product: populatedProduct,
    });
  } catch (error) {
    // Handle duplicate key error specifically
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern["variants.options.sku"]
    ) {
      return res.status(400).json({
        message:
          "Duplicate SKU detected. Please ensure all variant SKUs are unique.",
        details: error.keyValue,
      });
    }

    res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
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
