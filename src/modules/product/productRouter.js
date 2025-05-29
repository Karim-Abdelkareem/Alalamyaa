import express from "express";
import * as productController from "./productController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";
import { upload } from "../../config/cloudinary.js";

const router = express.Router();

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/category/:categoryId", productController.getProductsByCategory);

// Protected routes (admin only)
router.route("/").post(
  protect,
  restrictTo("admin"),
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 15 },
  ]),
  productController.createProduct
);

router
  .route("/:id")
  .patch(
    protect,
    restrictTo("admin"),
    upload.fields([
      { name: "coverImage", maxCount: 1 },
      { name: "images", maxCount: 15 },
    ]),
    productController.updateProduct
  )
  .delete(protect, restrictTo("admin"), productController.deleteProduct);

// Special admin routes for stock and price management
router.patch(
  "/:id/stock",
  protect,
  restrictTo("admin"),
  productController.updateStock
);

router.patch(
  "/:id/price",
  protect,
  restrictTo("admin"),
  productController.updatePrice
);

export default router;
