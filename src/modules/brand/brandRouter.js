import express from "express";
import * as brandController from "./brandController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";
import { upload } from "../../config/cloudinary.js";

const router = express.Router();

// Define routes for brand management
router
  .route("/")
  .post(
    protect,
    restrictTo("admin"),
    upload.single("logoUrl"),
    brandController.createBrand
  ) // Create a new brand
  .get(brandController.getBrands); // Get all brands

router
  .route("/:id")
  .get(brandController.getBrandById) // Get a single brand by ID
  .patch(
    protect,
    restrictTo("admin"),
    upload.single("logoUrl"),
    brandController.updateBrand
  ) // Update a brand by ID
  .delete(protect, restrictTo("admin"), brandController.deleteBrand); // Delete a brand by ID

router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  brandController.changeBrandStatus
); // Update brand status

// Export the router to be used in other parts of the application
export default router;
