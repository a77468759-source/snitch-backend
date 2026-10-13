
import express from "express";
import cors from "cors";
import authRoutes from "../routes/user.route.js";
import cookieParser from "cookie-parser";
import productRoutes from "../routes/product.route.js";
import cartRoutes from "../routes/carts.route.js";
import orderRoutes from "../routes/orders.route.js";

const app = express();

const defaultClientOrigins = [
  "http://localhost:5173",
  "https://snitch-frontend-19ue.vercel.app",
  "https://snitch-frontend-three.vercel.app",
];

const clientOrigins = (
  process.env.CLIENT_ORIGINS ||
  defaultClientOrigins.join(",")
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

export default app;
