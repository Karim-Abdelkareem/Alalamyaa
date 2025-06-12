import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
import Cart from "./cartModel.js";
import Product from "../product/productModel.js";

export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images stock",
  });

  if (!cart) {
    // If no cart exists, create an empty one
    const newCart = new Cart({
      user: userId,
      items: [],
      totalPrice: 0,
      discount: 0
    });
    await newCart.save();
    return res.json({
      status: "success",
      data: {
        items: [],
        totalPrice: 0,
        discount: 0,
        totalPriceAfterDiscount: 0
      }
    });
  }

  // Calculate totalPriceAfterDiscount
  const totalPriceAfterDiscount = cart.totalPrice - (cart.totalPrice * cart.discount / 100);

  res.json({
    status: "success",
    data: {
      items: cart.items,
      totalPrice: cart.totalPrice,
      discount: cart.discount,
      totalPriceAfterDiscount
    }
  });
});

export const addToCart = asyncHandler(async (req, res, next) => {
  const { items } = req.body;

  // Validate input
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Items array is required", 400));
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ 
      user: req.user._id, 
      items: [],
      totalPrice: 0,
      discount: 0
    });
  }

  // Process each item
  for (const item of items) {
    const { product, quantity, price } = item;

    // Validate item data
    if (!product || !quantity || !price) {
      return next(new AppError("Product, quantity, and price are required for each item", 400));
    }

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return next(new AppError(`Product with ID ${product} not found`, 404));
    }

    // Check stock
    if (productExists.stock < quantity) {
      return next(new AppError(`Not enough stock available for product ${product}`, 400));
    }

    // Update or add item
    const existingItem = cart.items.find(
      (cartItem) => cartItem.product.toString() === product
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = price; // Update price to latest
    } else {
      cart.items.push({
        product,
        quantity,
        price
      });
    }
  }

  await cart.save();
  
  // Populate product details
  cart = await cart.populate({
    path: "items.product",
    select: "name price images stock"
  });

  const totalPriceAfterDiscount = cart.totalPrice - (cart.totalPrice * cart.discount / 100);

  res.status(201).json({
    status: "success",
    data: {
      items: cart.items,
      totalPrice: cart.totalPrice,
      discount: cart.discount,
      totalPriceAfterDiscount
    }
  });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = checkAuth(req);
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );
  await cart.save();

  res.status(200).json({
    status: "success",
    data: {
      items: cart.items,
      totalPrice: cart.totalPrice,
      discount: cart.discount,
      totalPriceAfterDiscount
    }
  });
});

export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const userId = checkAuth(req);
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError("Valid quantity is required", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Not enough stock available", 400);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.find(
    (item) => item.product.toString() === req.params.productId
  );
  if (!item) {
    return next(new AppError("Item not found in cart", 404));
  }

  const totalPriceAfterDiscount = cart.totalPrice - (cart.totalPrice * cart.discount / 100);

  res.json({
    status: "success",
    data: {
      items: cart.items,
      totalPrice: cart.totalPrice,
      discount: cart.discount,
      totalPriceAfterDiscount
    }
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const userId = checkAuth(req);
  
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  await cart.clearCart();
  res.json({
    status: "success",
    data: {
      items: [],
      totalPrice: 0,
      discount: 0,
      totalPriceAfterDiscount: 0
    }
  });
});

export const getAllCarts = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this resource', 403));
  }

  const carts = await Cart.find()
    .populate('user', 'firstName lastName email phoneNumber')
    .populate('items.product', 'name price images stock')
    .sort({ createdAt: -1 });

  // Calculate totals for each cart
  const cartsWithTotals = carts.map(cart => {
    const cartObj = cart.toObject();
    cartObj.totalPriceAfterDiscount = cart.totalPrice - (cart.totalPrice * cart.discount / 100);
    cartObj.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return cartObj;
  });

  res.status(200).json({
    status: 'success',
    results: carts.length,
    data: { 
      carts: cartsWithTotals,
      summary: {
        totalCarts: carts.length,
        totalActiveCarts: carts.filter(cart => cart.items.length > 0).length,
        totalItems: carts.reduce((sum, cart) => sum + cart.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
      }
    }
  });
});

// Delete a cart by ID (admin only)
export const deleteCartById = asyncHandler(async (req, res, next) => {
  const { cartId } = req.params;
  const cart = await Cart.findByIdAndDelete(cartId);
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }
  res.status(204).json({ status: 'success', data: null });
});

// Update a cart by ID (admin only)
export const updateCartById = asyncHandler(async (req, res, next) => {
  const { cartId } = req.params;
  const updatedCart = await Cart.findByIdAndUpdate(cartId, req.body, { new: true });
  if (!updatedCart) {
    return next(new AppError('Cart not found', 404));
  }
  res.status(200).json({ status: 'success', data: updatedCart });
});
