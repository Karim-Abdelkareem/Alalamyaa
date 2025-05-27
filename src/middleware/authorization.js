import User from "../modules/user/userModel.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { AppError } from "../utils/appError.js";
import { promisify } from "util";

export const protect = asyncHandler(async (req, res, next) => {
  let { authorization } = req.headers;
  if (!authorization) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }
  const decodedToken = await promisify(jwt.verify)(
    authorization,
    process.env.JWT_SECRET
  );
  const user = await User.findById(decodedToken.id);
  if (!user) {
    return next(new AppError("User does not exist!", 404));
  }
  req.user = user;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
