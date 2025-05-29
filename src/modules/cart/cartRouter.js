import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
} from "./cartController.js";
import { protect } from "../../middleware/authorization.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.route("/")
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route("/:productId")
  .delete(removeFromCart)
  .patch(updateCartItemQuantity);

export default router;
