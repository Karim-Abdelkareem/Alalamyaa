import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/appError.js";
import Cart from "./cartModel.js";


// Helper function to check authentication
const checkAuth = (req) => {
  if (!req.user || !req.user._id) {
    throw new AppError("User not authenticated", 401);
  }
  return req.user._id;
};

export const getCart = asyncHandler(async (req, res) => {
  const userId = checkAuth(req);
  
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name description price images stock'
    })
    .exec();

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

  // Add item to cart
  await cart.addItem(productId, quantity, product.price);
  
  // Populate product details
  await cart.populate({
    path: 'items.product',
    select: 'name description price images stock'
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

  await cart.removeItem(productId);
  await cart.populate({
    path: 'items.product',
    select: 'name description price images stock'
  });

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

  await cart.updateItemQuantity(productId, quantity);
  await cart.populate({
    path: 'items.product',
    select: 'name description price images stock'
  });

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
