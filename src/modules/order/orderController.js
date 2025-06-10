import asyncHandler from "express-async-handler";
import Order from "./orderModel.js";
import { AppError } from "../../utils/appError.js";

const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    cartItems,
    shippingAddress,
    paymentMethod,
    totalOrderPrice,
  } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return next(new AppError("No order items", 400));
  }

  const order = await Order.create({
    user: req.user._id,
    cartItems,
    shippingAddress,
    paymentMethod,
    totalOrderPrice,
  });

  // Populate for consistent response
  await order.populate("user", "firstName lastName email");
  await order.populate("cartItems.product", "name price");

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check if the order belongs to the logged-in user or if user is admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not authorized to access this order", 403));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

export const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.isPaid = true;
  order.paymentStatus = "paid";
  order.status = "processing";
  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order: updatedOrder,
    },
  });
});


export const updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.status = "delivered";
  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order: updatedOrder,
    },
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate("user", "id name");
  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email")
    .populate("cartItems.product", "name price");
  
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Update status
  order.status = status;
  
  // Fixed: Use correct field names
  if (status === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// Add method to mark order as paid
export const markOrderAsPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = "paid";
  
  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email")
    .populate("cartItems.product", "name price");
  
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
  
  if (orderUserId !== req.user._id.toString()) {
    return next(new AppError("You can only cancel your own orders", 403));
  }

  if (order.status === "cancelled") {
    return next(new AppError("Order is already cancelled", 400));
  }

  if (order.status === "delivered") {
    return next(new AppError("Cannot cancel delivered order", 400));
  }

  order.status = "cancelled";
  await order.save();

  res.status(200).json({
    status: "success",
    message: "Order cancelled successfully",
    data: {
      order,
    },
  });
});

export const deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  await order.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
