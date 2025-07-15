import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
import Cart from "./cartModel.js";
import Product from "../product/productModel.js";

// Helper function to get localized response based on Accept-Language header
const getLocalizedResponse = (req, cart) => {
  const lang = req.headers["accept-language"]?.startsWith("ar") ? "ar" : "en";
  const cartObj = cart.toObject();

  // Add localized display fields
  if (cart.statusDisplay) {
    cartObj.statusText = cart.statusDisplay[lang];
  }

  // Add localized discount text
  if (cart.discountText) {
    cartObj.discountMessage = cart.discountText[lang];
  }

  // Add localized notes if they exist
  if (cart.notes && cart.notes[lang]) {
    cartObj.notesText = cart.notes[lang];
  }

  // Add localized discount description if it exists
  if (cart.discountDescription && cart.discountDescription[lang]) {
    cartObj.discountDescriptionText = cart.discountDescription[lang];
  }

  return cartObj;
};

// export const getCart = asyncHandler(async (req, res, next) => {
//   let cart = await Cart.findOne({ user: req.user._id }).populate({
//     path: "items.product",
//     select: "name price images stock",
//   });

//   if (!cart) {
//     // If no cart exists, create an empty one
//     const newCart = new Cart({
//       user: req.user._id,
//       items: [],
//       totalPrice: 0,
//       discount: 0,
//     });
//     await newCart.save();
//     return res.json({
//       status: "success",
//       data: {
//         items: [],
//         totalPrice: 0,
//         discount: 0,
//         totalPriceAfterDiscount: 0,
//         discountMessage: req.headers["accept-language"]?.startsWith("ar")
//           ? "لم يتم تطبيق أي خصم"
//           : "No discount applied",
//       },
//     });
//   }

//   const localizedCart = getLocalizedResponse(req, cart);

//   res.json({
//     status: "success",
//     data: {
//       items: localizedCart.items,
//       totalPrice: localizedCart.totalPrice,
//       discount: localizedCart.discount,
//       totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
//       discountMessage: localizedCart.discountMessage,
//       statusText: localizedCart.statusText,
//       notesText: localizedCart.notesText,
//       discountDescriptionText: localizedCart.discountDescriptionText,
//     },
//   });
// });

export const getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name images variants",
  });

  if (!cart) {
    const newCart = new Cart({
      user: req.user._id,
      items: [],
    });
    await newCart.save();
    return res.json({
      status: "success",
      data: {
        items: [],
        totalPrice: 0,
      },
    });
  }

  const language = req.headers["accept-language"]?.startsWith("ar")
    ? "ar"
    : "en";

  const enrichedItems = [];
  let grandTotal = 0;

  for (const item of cart.items) {
    const product = item.product;

    // Find variant option by SKU
    let matchedOption = null;
    let matchedVariant = null;

    // Search through all variants and options
    for (const variant of product?.variants || []) {
      matchedOption = variant.options?.find((opt) => opt.sku === item.sku);
      if (matchedOption) {
        matchedVariant = variant;
        break;
      }
    }

    if (!matchedOption) continue;

    const price = matchedOption.priceAfterDiscount || matchedOption.price;
    const totalPrice = price * item.quantity;
    grandTotal += totalPrice;

    // Get all variant images for this option
    const variantImages = matchedOption.variantImages || [];

    // Get product images as fallback
    const productImages = product.images || [];

    enrichedItems.push({
      _id: item._id,
      productId: product._id,
      sku: item.sku,
      quantity: item.quantity,
      notes: item.notes,
      productName: product.name,
      // Return all variant images if available, otherwise product images
      images: variantImages.length > 0 ? variantImages : productImages,
      price,
      totalPrice,
      variant: {
        label: matchedOption.value,
        color: matchedOption.colorName,
        colorHex: matchedOption.colorHex,
        storage: matchedOption.storage,
        ram: matchedOption.ram,
        stock: matchedOption.stock,
        // Include the parent variant name
        type: matchedVariant?.name,
      },
    });
  }

  res.json({
    status: "success",
    data: {
      items: enrichedItems,
      totalPrice: grandTotal,
    },
  });
});
// export const addToCart = asyncHandler(async (req, res, next) => {
//   const { items, notes } = req.body;

//   // Validate input
//   if (!items || !Array.isArray(items) || items.length === 0) {
//     return next(new AppError("Items array is required", 400));
//   }

//   // Find or create cart
//   let cart = await Cart.findOne({ user: req.user._id });
//   if (!cart) {
//     cart = new Cart({
//       user: req.user._id,
//       items: [],
//       totalPrice: 0,
//       discount: 0
//     });
//   }

//   // Add cart-level notes if provided
//   if (notes) {
//     cart.notes = notes;
//   }

//   // Process each item
//   for (const item of items) {
//     const { product, quantity, price, notes: itemNotes } = item;

//     // Validate item data
//     if (!product || !quantity || !price) {
//       return next(new AppError("Product, quantity, and price are required for each item", 400));
//     }

//     // Check if product exists
//     const productExists = await Product.findById(product);
//     if (!productExists) {
//       return next(new AppError(`Product with ID ${product} not found`, 404));
//     }

//     // Check stock
//     if (productExists.stock < quantity) {
//       return next(new AppError(`Not enough stock available for product ${product}`, 400));
//     }

//     // Update or add item using the model method
//     await cart.addItem(product, quantity, price, itemNotes);
//   }

//   // Populate product details
//   cart = await cart.populate({
//     path: "items.product",
//     select: "name price images stock"
//   });

//   const localizedCart = getLocalizedResponse(req, cart);

//   res.status(201).json({
//     status: "success",
//     data: {
//       items: localizedCart.items,
//       totalPrice: localizedCart.totalPrice,
//       discount: localizedCart.discount,
//       totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
//       discountMessage: localizedCart.discountMessage,
//       statusText: localizedCart.statusText,
//       notesText: localizedCart.notesText
//     }
//   });
// });
export const addToCart = asyncHandler(async (req, res, next) => {
  const { items, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Items array is required", 400));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({
      user: req.user._id,
      items: [],
      totalPrice: 0,
      discount: 0,
    });
  }

  // Clean existing items without SKU
  cart.items = cart.items.filter((item) => item.sku && item.sku.trim() !== "");

  if (notes) {
    cart.notes = notes;
  }

  for (const item of items) {
    // Remove 'price' from destructuring since it's not used
    const { product, quantity, sku, notes: itemNotes } = item;

    if (!product || !quantity || !sku) {
      return next(
        new AppError(
          "Product, quantity, and SKU are required for each item",
          400
        )
      );
    }

    const productExists = await Product.findById(product);
    if (!productExists) {
      return next(new AppError(`Product with ID ${product} not found`, 404));
    }

    // Validate SKU exists in product variants
    let skuValid = false;
    for (const variant of productExists.variants) {
      if (variant.options?.some((option) => option.sku === sku)) {
        skuValid = true;
        break;
      }
    }

    if (!skuValid) {
      return next(
        new AppError(`SKU ${sku} is not valid for product ${product}`, 400)
      );
    }

    // FIX: Remove price parameter and reorder arguments
    await cart.addItem(product, quantity, itemNotes, sku);
  }

  // Populate product details
  cart = await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  const localizedCart = getLocalizedResponse(req, cart);

  res.status(201).json({
    status: "success",
    data: {
      items: localizedCart.items,
      totalPrice: localizedCart.totalPrice,
      discount: localizedCart.discount,
      totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
      discountMessage: localizedCart.discountMessage,
      statusText: localizedCart.statusText,
      notesText: localizedCart.notesText,
    },
  });
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  await cart.removeItem(productId);

  // Populate product details
  await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  const localizedCart = getLocalizedResponse(req, cart);

  res.status(200).json({
    status: "success",
    data: {
      items: localizedCart.items,
      totalPrice: localizedCart.totalPrice,
      discount: localizedCart.discount,
      totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
      discountMessage: localizedCart.discountMessage,
    },
  });
});

export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError("Valid quantity is required", 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.stock < quantity) {
    return next(new AppError("Not enough stock available", 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  await cart.updateItemQuantity(productId, quantity);

  // Populate product details
  await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  const localizedCart = getLocalizedResponse(req, cart);

  res.json({
    status: "success",
    data: {
      items: localizedCart.items,
      totalPrice: localizedCart.totalPrice,
      discount: localizedCart.discount,
      totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
      discountMessage: localizedCart.discountMessage,
    },
  });
});

// New endpoint to update item notes
export const updateCartItemNotes = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  await cart.updateItemNotes(productId, notes);

  // Populate product details
  await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  const localizedCart = getLocalizedResponse(req, cart);

  res.json({
    status: "success",
    data: {
      items: localizedCart.items,
      totalPrice: localizedCart.totalPrice,
      discount: localizedCart.discount,
      totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
    },
  });
});

// New endpoint to apply discount with description
export const applyDiscount = asyncHandler(async (req, res, next) => {
  const { discount, description } = req.body;

  if (discount < 0 || discount > 100) {
    return next(new AppError("Discount must be between 0 and 100", 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  await cart.applyDiscount(discount, description);

  // Populate product details
  await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  const localizedCart = getLocalizedResponse(req, cart);

  res.json({
    status: "success",
    data: {
      items: localizedCart.items,
      totalPrice: localizedCart.totalPrice,
      discount: localizedCart.discount,
      totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
      discountMessage: localizedCart.discountMessage,
      discountDescriptionText: localizedCart.discountDescriptionText,
    },
  });
});

// New endpoint to update cart notes
export const updateCartNotes = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.notes = notes;
  await cart.save();

  // Populate product details
  await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  const localizedCart = getLocalizedResponse(req, cart);

  res.json({
    status: "success",
    data: {
      items: localizedCart.items,
      totalPrice: localizedCart.totalPrice,
      discount: localizedCart.discount,
      totalPriceAfterDiscount: localizedCart.totalPriceAfterDiscount,
      notesText: localizedCart.notesText,
    },
  });
});

export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  await cart.clearCart();
  res.json({
    status: "success",
    data: {
      items: [],
      totalPrice: 0,
      discount: 0,
      totalPriceAfterDiscount: 0,
      discountMessage: req.headers["accept-language"]?.startsWith("ar")
        ? "لم يتم تطبيق أي خصم"
        : "No discount applied",
    },
  });
});

export const getAllCarts = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return next(new AppError("Not authorized to access this resource", 403));
  }

  const carts = await Cart.find()
    .populate("user", "firstName lastName email phoneNumber")
    .populate("items.product", "name price images stock")
    .sort({ createdAt: -1 });

  // Calculate totals for each cart with localization
  const cartsWithTotals = carts.map((cart) => {
    const localizedCart = getLocalizedResponse(req, cart);
    localizedCart.totalItems = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    return localizedCart;
  });

  res.status(200).json({
    status: "success",
    results: carts.length,
    data: {
      carts: cartsWithTotals,
      summary: {
        totalCarts: carts.length,
        totalActiveCarts: carts.filter((cart) => cart.items.length > 0).length,
        totalItems: carts.reduce(
          (sum, cart) =>
            sum +
            cart.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
          0
        ),
      },
    },
  });
});

// Delete a cart by ID (admin only)
export const deleteCartById = asyncHandler(async (req, res, next) => {
  const { cartId } = req.params;
  const cart = await Cart.findByIdAndDelete(cartId);
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }
  res.status(204).json({ status: "success", data: null });
});

// Update a cart by ID (admin only)
export const updateCartById = asyncHandler(async (req, res, next) => {
  const { cartId } = req.params;
  const updatedCart = await Cart.findByIdAndUpdate(cartId, req.body, {
    new: true,
  });
  if (!updatedCart) {
    return next(new AppError("Cart not found", 404));
  }
  res.status(200).json({ status: "success", data: updatedCart });
});
