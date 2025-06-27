import express from "express";
import {
  getAllOrders,
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  updatePaymentStatus,
} from "./orderController.js";
import { protect, admin } from "../../middleware/authorization.js";

const router = express.Router();

router.use(protect); 

// User routes - these routes are accessible to authenticated users
router.route("/myorders").get(getUserOrders);
router.route("/").post(createOrder);

// Admin routes - these routes require admin privileges
// IMPORTANT: Admin routes with specific paths must come BEFORE parameterized routes
router.route("/admin").get(admin, getAllOrders);

// Parameterized routes - these must come AFTER specific routes
router.route("/:id").get(getOrderById).patch(updateOrder);
router.route("/:id/cancel").patch(cancelOrder);
router.route("/:id/status").patch(admin, updateOrderStatus);
router.route("/:id/payment").patch(admin, updatePaymentStatus);
router.route("/:id").delete(admin, deleteOrder);

export default router;
