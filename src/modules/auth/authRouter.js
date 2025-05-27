import express from "express";
import { register, login } from "./authController.js";

const router = express.Router();

// Define routes for user registration and login
router.post("/register", register);
router.post("/login", login);

// Export the router to be used in other parts of the application
export default router;
