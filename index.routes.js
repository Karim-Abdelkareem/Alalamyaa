import express from "express";
import { AppError } from "./src/utils/appError.js";
import globalErrorHandler from "./src/middleware/globalErrorHandler.js";
import authRouter from "./src/modules/auth/authRouter.js";
import brandRouter from "./src/modules/brand/brandRouter.js";
import userRouter from "./src/modules/user/userRouter.js";
import categoryRouter from "./src/modules/category/categoryRouter.js";
import subcategoryRouter from "./src/modules/subcategory/subcategoryRouter.js";
import productRouter from "./src/modules/product/productRouter.js";
import subsubcategoryRouter from "./src/modules/sub-subcategory/sub-subcategoryRouter.js";
import cartRouter from "./src/modules/cart/cartRouter.js";
import orderRouter from "./src/modules/order/orderRouter.js";
import uploadRoutes from "./src/modules/uploads/uploadRouter.js";

const init = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  app.get("/api/check-auth", (req, res) => {
    if (req.cookies.access_token) {
      res.json({ isAuthenticated: true });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/brand", brandRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/subcategory", subcategoryRouter);
  app.use("/api/subsubcategory", subsubcategoryRouter);
  app.use("/api/product", productRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/upload", uploadRoutes);
  app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
  });
  // Error handling middleware
  app.use(globalErrorHandler);
};

export default init;
