import User from "../modules/user/userModel.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { AppError } from "../utils/appError.js";
import { promisify } from "util";

export const protect = asyncHandler(async (req, res, next) => {
  // Get token from either cookie or Authorization header
  let token;

  if (req.cookies.access_token) {
    token = req.cookies.access_token;
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decodedToken = await promisify(jwt.verify)(
    token,
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

export const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
});

export const isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check if it's there
  if (req.cookies.access_token) {
    try {
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.access_token,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // // 4) Check if user changed password after the token was issued
      // if (currentUser.changedPasswordAfter(decoded.iat)) {
      //   return next();
      // }
      // Grant access to protected routes
      req.user = currentUser;
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};