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
// router.use(protect);

// User routes
router.route("/")
  .get(protect, getUserOrders)
  .post(protect, createOrder);

router.route("/:id")
  .get(getOrderById)
  .delete(restrictTo("admin"), deleteOrder);

router.route("/:id/pay")
  .patch(updateOrderToPaid);

router.route("/:id/deliver")
  .patch(restrictTo("admin"), updateOrderToDelivered);

router.route("/:id/status")
  .patch(restrictTo("admin"), updateOrderStatus);

router.route("/:id/cancel")
  .patch(cancelOrder);

// Admin routes
router.route("/all")
  .get(restrictTo("admin"), getAllOrders);

export default router;
