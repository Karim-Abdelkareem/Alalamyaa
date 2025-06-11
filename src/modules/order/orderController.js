import asyncHandler from "express-async-handler";
import Order from "./orderModel.js";
import Cart from "../../modules/cart/cartModel.js";
import  productModel  from '../../modules/product/productModel.js';
import { AppError } from "../../utils/appError.js";
const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];

const getUserByOrder = (order) => {
  if (!order || !order.user) return null;
  return {
    id: order.user._id,
    firstName: order.user.firstName,
    lastName: order.user.lastName,
    email: order.user.email,
    phoneNumber: order.user.phoneNumber,
    profilePicture: order.user.profilePicture
  };
};

export const createOrder = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError("No order items", 400));
  }

  // Calculate total price from items
  const totalOrderPrice = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    totalOrderPrice,
  });

  await order.populate("user", "firstName lastName email phoneNumber profilePicture");
  await order.populate("items.product", "name price image description brand category");

  const orderObject = order.toObject();
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(201).json({ status: "success", data: { order: orderObject } });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("cartItems.product", "name price image description brand category")
    .sort({ createdAt: -1 });

  const ordersWithCustomers = orders.map(order => {
    const obj = order.toObject();
    obj.customer = getUserByOrder(order);
    delete obj.user;
    return obj;
  });

  res.status(200).json({ status: "success", results: orders.length, data: { orders: ordersWithCustomers } });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("cartItems.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new AppError("Not authorized to access this order", 403));
  }

  const orderObject = order.toObject();
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("cartItems.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  order.isPaid = true;
  order.paymentStatus = "paid";
  order.status = "processing";
  await order.save();

  const orderObject = order.toObject();
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("cartItems.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.status = "delivered";
  await order.save();

  const orderObject = order.toObject();
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price");
  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  const updatedOrder = await order.save();

  res.json({
    status: "success",
    data: {
      order: updatedOrder,
    },
  });
});

export const markOrderAsPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("cartItems.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = "paid";
  await order.save();

  const orderObject = order.toObject();
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (order.status !== "pending") {
    res.status(400);
    throw new Error("Can only cancel pending orders");
  }

  order.status = "cancelled";
  await order.save();

  res.json({
    status: "success",
    message: "Order cancelled successfully",
  });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  await order.deleteOne();
  res.json({
    status: "success",
    message: "Order deleted successfully",
  });
});

export const getOrdersByUserId = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;

  const orders = await Order.find({ user: userId })
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("cartItems.product", "name price image description brand category")
    .sort({ createdAt: -1 });

  const ordersWithCustomers = orders.map(order => {
    const obj = order.toObject();
    obj.customer = getUserByOrder(order);
    obj.totalItems = order.cartItems.reduce((total, item) => total + item.quantity, 0);
    delete obj.user;
    return obj;
  });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders: ordersWithCustomers,
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalOrderPrice, 0)
      }
    }
  });
});

export const updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentStatus } = req.body;

  if (!validPaymentStatuses.includes(paymentStatus)) {
    return next(new AppError("Invalid payment status", 400));
  }

  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "name price");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.paymentStatus = paymentStatus;
  
  // If payment is successful, update order status to processing
  if (paymentStatus === "paid") {
    order.status = "processing";
    order.isPaid = true;
    order.paidAt = Date.now();
  }

  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order: updatedOrder,
    },
  });
});
