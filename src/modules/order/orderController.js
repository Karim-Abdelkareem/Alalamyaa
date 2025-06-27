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

// Helper function to get localized response based on Accept-Language header
const getLocalizedResponse = (req, order) => {
  const lang = req.headers['accept-language']?.startsWith('ar') ? 'ar' : 'en';
  const orderObj = order.toObject();
  
  // Add localized display fields
  if (order.statusDisplay) {
    orderObj.statusText = order.statusDisplay[lang] || order.statusDisplay.en;
  }
  if (order.paymentMethodDisplay) {
    orderObj.paymentMethodText = order.paymentMethodDisplay[lang] || order.paymentMethodDisplay.en;
  }
  if (order.paymentStatusDisplay) {
    orderObj.paymentStatusText = order.paymentStatusDisplay[lang] || order.paymentStatusDisplay.en;
  }
  
  // Add localized address fields for easier frontend consumption
  if (order.shippingAddress) {
    orderObj.shippingAddressText = {
      address: order.shippingAddress.address[lang] || order.shippingAddress.address.en,
      city: order.shippingAddress.city[lang] || order.shippingAddress.city.en,
      country: order.shippingAddress.country[lang] || order.shippingAddress.country.en,
      postalCode: order.shippingAddress.postalCode
    };
  }
  
  // Add localized notes if they exist
  if (order.notes) {
    orderObj.notesText = order.notes[lang] || order.notes.en || order.notes.ar || '';
  }
  
  return orderObj;
};

// Helper function to validate localized string
const validateLocalizedString = (field, fieldName, isRequired = true) => {
  if (!field) {
    if (isRequired) {
      throw new AppError(`${fieldName} is required`, 400);
    }
    return;
  }
  
  if (typeof field !== 'object') {
    throw new AppError(`${fieldName} should be an object with 'en' and/or 'ar' properties`, 400);
  }
  
  if (isRequired && !field.en && !field.ar) {
    throw new AppError(`${fieldName} must be provided in at least one language (en or ar)`, 400);
  }
};

export const createOrder = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError("No order items", 400));
  }

  // Validate shipping address
  if (!shippingAddress) {
    return next(new AppError("Shipping address is required", 400));
  }

  const { address, city, country, postalCode } = shippingAddress;
  
  // Validate localized address fields
  try {
    validateLocalizedString(address, "Address", true);
    validateLocalizedString(city, "City", true);
    validateLocalizedString(country, "Country", true);
  } catch (error) {
    return next(error);
  }
  
  if (!postalCode) {
    return next(new AppError("Postal code is required", 400));
  }

  // Validate notes if provided
  if (notes) {
    try {
      validateLocalizedString(notes, "Notes", false);
    } catch (error) {
      return next(error);
    }
  }

  // Calculate total price from items
  const totalOrderPrice = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const orderData = {
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    totalOrderPrice,
  };

  // Add notes if provided
  if (notes) {
    orderData.notes = notes;
  }

  const order = await Order.create(orderData);

  await order.populate("user", "firstName lastName email phoneNumber profilePicture");
  await order.populate("items.product", "name price image description brand category");

  const orderObject = getLocalizedResponse(req, order);
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(201).json({ status: "success", data: { order: orderObject } });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price image description brand category")
    .sort({ createdAt: -1 });

  const ordersWithCustomers = orders.map(order => {
    const obj = getLocalizedResponse(req, order);
    obj.customer = getUserByOrder(order);
    delete obj.user;
    return obj;
  });

  res.status(200).json({ status: "success", results: orders.length, data: { orders: ordersWithCustomers } });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new AppError("Not authorized to access this order", 403));
  }

  const orderObject = getLocalizedResponse(req, order);
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  order.paymentStatus = "paid";
  order.status = "processing";
  await order.save();

  const orderObject = getLocalizedResponse(req, order);
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  order.status = "delivered";
  await order.save();

  const orderObject = getLocalizedResponse(req, order);
  orderObject.customer = getUserByOrder(order);
  delete orderObject.user;

  res.status(200).json({ status: "success", data: { order: orderObject } });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter object
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.userId) {
    filter.user = req.query.userId;
  }

  // Get total count for pagination
  const totalOrders = await Order.countDocuments(filter);
  
  // Get orders with pagination
  const orders = await Order.find(filter)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price image description brand category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Transform orders with localized response and customer info
  const ordersWithCustomers = orders.map(order => {
    const obj = getLocalizedResponse(req, order);
    obj.customer = getUserByOrder(order);
    obj.totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
    delete obj.user;
    return obj;
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalOrders / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders: ordersWithCustomers,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage,
        hasPrevPage,
        limit
      },
      summary: {
        totalRevenue: orders.reduce((sum, order) => sum + order.totalOrderPrice, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalOrderPrice, 0) / orders.length : 0
      }
    }
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  order.status = status;
  const updatedOrder = await order.save();

  const localizedOrder = getLocalizedResponse(req, updatedOrder);

  res.json({
    status: "success",
    data: {
      order: localizedOrder,
    },
  });
});

export const markOrderAsPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price image description brand category");

  if (!order) return next(new AppError("Order not found", 404));

  order.paymentStatus = "paid";
  await order.save();

  const orderObject = getLocalizedResponse(req, order);
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
    .populate("items.product", "name price image description brand category")
    .sort({ createdAt: -1 });

  const ordersWithCustomers = orders.map(order => {
    const obj = getLocalizedResponse(req, order);
    obj.customer = getUserByOrder(order);
    obj.totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
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
    .populate("user", "firstName lastName email phoneNumber profilePicture")
    .populate("items.product", "name price");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.paymentStatus = paymentStatus;
  
  // If payment is successful, update order status to processing
  if (paymentStatus === "paid") {
    order.status = "processing";
  }

  const updatedOrder = await order.save();

  const localizedOrder = getLocalizedResponse(req, updatedOrder);

  res.status(200).json({
    status: "success",
    data: {
      order: localizedOrder,
    },
  });
});

// Add new endpoint to update order notes
export const updateOrderNotes = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check authorization
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new AppError("Not authorized to update this order", 403));
  }

  // Validate notes if provided
  if (notes) {
    try {
      validateLocalizedString(notes, "Notes", false);
    } catch (error) {
      return next(error);
    }
  }

  order.notes = notes;
  const updatedOrder = await order.save();

  const localizedOrder = getLocalizedResponse(req, updatedOrder);

  res.json({
    status: "success",
    data: {
      order: localizedOrder,
    },
  });
});

// Comprehensive update order function
export const updateOrder = asyncHandler(async (req, res, next) => {
  const { 
    items, 
    shippingAddress, 
    status, 
    paymentMethod, 
    paymentStatus, 
    notes,
    isActive 
  } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check authorization
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new AppError("Not authorized to update this order", 403));
  }

  // Validate order status for certain updates
  if (req.user.role !== "admin") {
    // Non-admin users can only update certain fields and only for pending/processing orders
    if (order.status === "shipped" || order.status === "delivered") {
      return next(new AppError("Cannot update order that has been shipped or delivered", 400));
    }
    
    if (order.status === "cancelled") {
      return next(new AppError("Cannot update cancelled order", 400));
    }

    // Non-admin users cannot update status or payment status
    if (status && req.user.role !== "admin") {
      return next(new AppError("Only admin can update order status", 403));
    }
    
    if (paymentStatus && req.user.role !== "admin") {
      return next(new AppError("Only admin can update payment status", 403));
    }
  }

  // Update items if provided
  if (items && Array.isArray(items)) {
    if (items.length === 0) {
      return next(new AppError("Order must have at least one item", 400));
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.product || !item.quantity || !item.price) {
        return next(new AppError("Each item must have product, quantity, and price", 400));
      }
      if (item.quantity <= 0) {
        return next(new AppError("Item quantity must be greater than 0", 400));
      }
      if (item.price < 0) {
        return next(new AppError("Item price cannot be negative", 400));
      }
    }
    
    order.items = items;
    
    // Recalculate total order price
    order.totalOrderPrice = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  // Update shipping address if provided
  if (shippingAddress) {
    const { address, city, country, postalCode } = shippingAddress;
    
    // Validate localized address fields
    try {
      if (address) validateLocalizedString(address, "Address", true);
      if (city) validateLocalizedString(city, "City", true);
      if (country) validateLocalizedString(country, "Country", true);
    } catch (error) {
      return next(error);
    }
    
    if (postalCode !== undefined && !postalCode) {
      return next(new AppError("Postal code is required", 400));
    }

    // Update shipping address fields
    if (address) order.shippingAddress.address = address;
    if (city) order.shippingAddress.city = city;
    if (country) order.shippingAddress.country = country;
    if (postalCode) order.shippingAddress.postalCode = postalCode;
  }

  // Update status if provided (admin only)
  if (status && req.user.role === "admin") {
    if (!validStatuses.includes(status)) {
      return next(new AppError("Invalid status", 400));
    }
    order.status = status;
  }

  // Update payment method if provided
  if (paymentMethod) {
    const validPaymentMethods = ["cash", "credit_card", "bank_transfer"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return next(new AppError("Invalid payment method", 400));
    }
    order.paymentMethod = paymentMethod;
  }

  // Update payment status if provided (admin only)
  if (paymentStatus && req.user.role === "admin") {
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return next(new AppError("Invalid payment status", 400));
    }
    order.paymentStatus = paymentStatus;
    
    // If payment is successful, update order status to processing
    if (paymentStatus === "paid" && order.status === "pending") {
      order.status = "processing";
    }
  }

  // Update notes if provided
  if (notes !== undefined) {
    if (notes) {
      try {
        validateLocalizedString(notes, "Notes", false);
      } catch (error) {
        return next(error);
      }
    }
    order.notes = notes;
  }

  // Update isActive if provided (admin only)
  if (isActive !== undefined && req.user.role === "admin") {
    order.isActive = isActive;
  }

  const updatedOrder = await order.save();

  // Populate the order with related data
  await updatedOrder.populate("user", "firstName lastName email phoneNumber profilePicture");
  await updatedOrder.populate("items.product", "name price image description brand category");

  const orderObject = getLocalizedResponse(req, updatedOrder);
  orderObject.customer = getUserByOrder(updatedOrder);
  delete orderObject.user;

  res.status(200).json({
    status: "success",
    data: {
      order: orderObject,
    },
  });
});
