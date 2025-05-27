// Import required packages
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import custom modules and middleware
import connectDB from "./src/config/db.js";
import { init } from "./index.routes.js";

// Initialize Express application
const app = express();

// Configure CORS middleware to allow all origins
app.use(
  cors({
    origin: "http://localhost:5173", // Allow all origins
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

// Configure middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Load environment variables from .env file
dotenv.config();

// Initialize routes
init(app);

//Database Connection
connectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
