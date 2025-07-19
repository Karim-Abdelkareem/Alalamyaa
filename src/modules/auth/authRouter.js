
import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateUser,
} from "./authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/current-user", getCurrentUser);
router.put("/update-profile", updateUser);

export default router;
