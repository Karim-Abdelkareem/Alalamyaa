import express from "express";
import * as subcategoryController from "./subcategoryController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";

const router = express.Router();

router
  .route("/")
  .get(protect, subcategoryController.getAllSubcategories)
  .post(protect, restrictTo("admin"), subcategoryController.createSubcategory);

router
  .route("/:id")
  .get(protect, restrictTo("admin"), subcategoryController.getSubcategoryById)
  .patch(protect, restrictTo("admin"), subcategoryController.updateSubcategory)
  .delete(
    protect,
    restrictTo("admin"),
    subcategoryController.deleteSubcategory
  );

router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  subcategoryController.changeSubcategoryStatus
);

export default router;
