import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            required: true
        },
        title: { type: String, required: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, enum: [ "INR", "USD" ], required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true }
    },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: [ "INR", "USD" ], required: true },
    paymentMethod: { type: String, enum: [ "COD" ], default: "COD" },
    status: {
        type: String,
        enum: [ "placed", "processing", "shipped", "delivered", "cancelled" ],
        default: "placed"
    }
}, { timestamps: true })

const orderModel = mongoose.model("orders", orderSchema)

export default orderModel
