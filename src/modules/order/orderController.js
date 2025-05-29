import asyncHandler from "express-async-handler";
import Order from "./orderModel.js";
import { AppError } from "../../utils/appError.js";

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

  order.isDeliverd = true;
  order.deliverdAt = Date.now();
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
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.status = status;
  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order: updatedOrder,
    },
  });
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }


  if (
    order.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not authorized to cancel this order", 403));
  }

  if (!["pending", "processing"].includes(order.status)) {
    return next(
      new AppError("Cannot cancel order that is already shipped or delivered", 400)
    );
  }

  order.status = "cancelled";
  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order: updatedOrder,
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
