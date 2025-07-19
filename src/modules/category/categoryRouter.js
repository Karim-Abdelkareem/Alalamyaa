import express from "express";
import * as categoryController from "./categoryController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";

const router = express.Router();

// Public or Protected Access
router.get("/", categoryController.getAllCategories);
router.get("/active", protect, categoryController.getActiveCategories);
router.get("/slug/:slug", protect, categoryController.getCategoryBySlug);
router.get("/:id", protect, categoryController.getCategoryById);

// Admin Only Routes
router.post(
  "/",
  protect,
  restrictTo("admin"),
  categoryController.createCategory
);
router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  categoryController.updateCategory
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  categoryController.deleteCategory
);
router.patch(
  "/order",
  protect,
  restrictTo("admin"),
  categoryController.updateCategoryOrder
);
router.patch(
  "/:id/toggle-status",
  protect,
  restrictTo("admin"),
  categoryController.toggleCategoryStatus
);

export default router;
