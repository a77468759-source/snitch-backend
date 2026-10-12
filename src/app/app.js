import express from "express"
import authRoutes from "../routes/user.route.js"
import cookieParser from "cookie-parser"
import productRoutes from "../routes/product.route.js"
import cartRoutes from "../routes/carts.route.js"
import orderRoutes from "../routes/orders.route.js"


const app = express()

app.use(express.json())
app.use(cookieParser())


app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)

export default app