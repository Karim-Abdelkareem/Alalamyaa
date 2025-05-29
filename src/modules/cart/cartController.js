import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
import Cart from "./cartModel.js";

export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images stock",
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.stock < quantity) {
    return next(new AppError("Not enough stock available", 400));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    item => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price
    });
  }

  await cart.save();
  cart = await cart.populate({
    path: "items.product",
    select: "name price images stock",
  });

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.items = cart.items.filter(
    item => item.product.toString() !== req.params.productId
  );
  await cart.save();

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  const product = await Product.findById(req.params.productId);
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

  const item = cart.items.find(
    item => item.product.toString() === req.params.productId
  );
  if (!item) {
    return next(new AppError("Item not found in cart", 404));
  }

  item.quantity = quantity;
  await cart.save();

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});
