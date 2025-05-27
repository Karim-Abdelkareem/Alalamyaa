import express from "express";
import * as userController from "./userController.js";
import { protect, restrictTo } from "../../middleware/authorization.js";

const userRouter = express.Router();

userRouter
  .route("/")
  .post(userController.createUser)
  .get(protect, restrictTo("admin"), userController.getAllUsers);

userRouter
  .route("/:id")
  .get(protect, userController.getUserById)
  .patch(protect, restrictTo("admin"), userController.updateUser)
  .delete(protect, restrictTo("admin"), userController.deleteUser);

userRouter.route("profile/me").get(protect, userController.getMe);

export default userRouter;
