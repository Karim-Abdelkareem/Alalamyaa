import express from "express";
import * as subSubcategoryController from "./sub-subcategoryController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";

const router = express.Router();

router
  .route("/")
  .get(protect, subSubcategoryController.getAllSubSubcategories)
  .post(
    protect,
    restrictTo("admin"),
    subSubcategoryController.createSubSubcategory
  );

router
  .route("/:id")
  .get(
    protect,
    restrictTo("admin"),
    subSubcategoryController.getSubSubcategoryById
  )
  .patch(
    protect,
    restrictTo("admin"),
    subSubcategoryController.updateSubSubcategory
  )
  .delete(
    protect,
    restrictTo("admin"),
    subSubcategoryController.deleteSubSubcategory
  );

router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  subSubcategoryController.changeSubSubcategoryStatus
);

export default router;
