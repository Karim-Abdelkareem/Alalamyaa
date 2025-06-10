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

export const addToCart = asyncHandler(async (req, res) => {
  const userId = checkAuth(req);
  const { productId, quantity } = req.body;

  // Validate input
  if (!productId || !quantity) {
    throw new AppError("Product ID and quantity are required", 400);
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Check stock
  if (product.stock < quantity) {
    throw new AppError("Not enough stock available", 400);
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  await cart.save();
  cart = await cart.populate({
    path: "items.product",
    select: "name price images stock",
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
