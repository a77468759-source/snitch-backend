import mongoose from "mongoose"

const cartSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "products",
                required: true
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1
            },
            size: {
                type: String,
                enum: [ "XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40" ],
                required: true
            }
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
})

const cartModel = mongoose.model("carts", cartSchema)

export default cartModel