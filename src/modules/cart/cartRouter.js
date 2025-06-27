import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  updateCartItemNotes,
  applyDiscount,
  updateCartNotes,
  clearCart,
  getAllCarts,
  deleteCartById,
  updateCartById,
} from "./cartController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Admin routes
router.get("/admin", restrictTo("admin"), getAllCarts);
router.delete("/admin/:cartId", restrictTo("admin"), deleteCartById);
router.patch("/admin/:cartId", restrictTo("admin"), updateCartById);

// User cart routes
router.route("/")
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route("/notes")
  .patch(updateCartNotes);

router.route("/discount")
  .patch(applyDiscount);

router.route("/:productId")
  .delete(removeFromCart)
  .patch(updateCartItemQuantity);

router.route("/:productId/notes")
  .patch(updateCartItemNotes);

export default router;
