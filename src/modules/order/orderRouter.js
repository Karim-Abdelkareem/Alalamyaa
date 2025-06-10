import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
} from "./orderController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Admin route for getting all orders - MUST be before /:id routes
router.route("/all")
  .get(restrictTo("admin"), getAllOrders);

// User routes
router.route("/")
  .get(getUserOrders)
  .post(createOrder);

// Specific action routes - these must come before the generic /:id route
router.route("/:id/pay")
  .patch(updateOrderToPaid);

router.route("/:id/deliver")
  .patch(restrictTo("admin"), updateOrderToDelivered);

router.route("/:id/status")
  .patch(restrictTo("admin"), updateOrderStatus);

router.route("/:id/cancel")
  .patch(cancelOrder);

// Generic /:id route - MUST come last among parameterized routes
router.route("/:id")
  .get(getOrderById)
  .delete(restrictTo("admin"), deleteOrder);

export default router;
