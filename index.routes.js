import { AppError } from "./src/utils/appError.js";
import globalErrorHandler from "./src/middleware/globalErrorHandler.js";
import authRouter from "./src/modules/auth/authRouter.js";
import brandRouter from "./src/modules/brand/brandRouter.js";

export const init = (app) => {
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
  app.use("/api/brand", brandRouter);
  app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
  });
  // Error handling middleware
  app.use(globalErrorHandler);
};
