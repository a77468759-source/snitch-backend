import express from "express"
import authRoutes from "../routes/user.route.js"
import cookieParser from "cookie-parser"
import productRoutes from "../routes/product.route.js"
import cartRoutes from "../routes/carts.route.js"
import orderRoutes from "../routes/orders.route.js"


const app = express()
const defaultClientOrigins = "http://localhost:5173,https://snitch-frontend-three.vercel.app"
const clientOrigins = (process.env.CLIENT_ORIGINS ?? defaultClientOrigins)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean)

app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
  const origin = req.get("Origin")?.replace(/\/+$/, "")
  if (origin && clientOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization")
    res.setHeader("Vary", "Origin")
  }

  if (req.method === "OPTIONS") {
    if (!origin || !clientOrigins.includes(origin)) return res.sendStatus(403)
    return res.sendStatus(204)
  }

  next()
})

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)

export default app