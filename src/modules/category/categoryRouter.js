import express from 'express';
import * as categoryController from './categoryController.js';
import { protect, restrictTo } from "../../middleware/authorization.js";

const router = express.Router();

router
  .route("/")
  .get(protect, categoryController.getAllCategories)
  .post(protect, restrictTo("admin"), categoryController.createCategory);

router
  .route("/slug/:slug")
  .get(protect, categoryController.getCategoryBySlug);

router
  .route("/:id")
  .get(protect, categoryController.getCategoryById)
  .patch(protect, restrictTo("admin"), categoryController.updateCategory)
  .delete(protect, restrictTo("admin"), categoryController.deleteCategory);

router
  .route("/order")
  .patch(protect, restrictTo("admin"), categoryController.updateCategoryOrder);

router
  .route("/:id/toggle-status")
  .patch(protect, restrictTo("admin"), categoryController.toggleCategoryStatus);

export default router;
