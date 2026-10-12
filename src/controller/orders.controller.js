import mongoose from "mongoose"
import cartModel from "../models/carts.model.js"
import orderModel from "../models/orders.model.js"
import productModel from "../models/products.model.js"

async function restoreStock(reservations) {
    const failures = []

    for (const reservation of reservations) {
        try {
            const result = await productModel.updateOne(
                { _id: reservation.productId, "sizes.size": reservation.size },
                { $inc: { "sizes.$.stock": reservation.quantity } }
            )
            if (result.matchedCount !== 1) {
                throw new Error(`Product ${reservation.productId} no longer has size ${reservation.size}`)
            }
        } catch (error) {
            console.error(`Could not restore stock for product ${reservation.productId}`, error)
            failures.push(error)
        }
    }

    if (failures.length) {
        throw new Error(`Could not restore stock for ${failures.length} order item(s)`)
    }
}

export async function createOrder(req, res) {
    const cart = await cartModel.findOne({ user: req.user.userId }).lean()
    if (!cart?.products.length) {
        return res.status(400).json({ message: "Your cart is empty" })
    }

    const address = req.body.shippingAddress
    const reserved = []
    const items = []

    for (const line of cart.products) {
        const product = await productModel.findOneAndUpdate(
            {
                _id: line.product,
                published: true,
                sizes: { $elemMatch: { size: line.size, stock: { $gte: line.quantity } } }
            },
            { $inc: { "sizes.$.stock": -line.quantity } },
            { new: true }
        ).lean()

        if (!product) {
            await restoreStock(reserved)
            return res.status(409).json({ message: "An item in your cart is no longer available in the requested quantity" })
        }

        reserved.push({ productId: product._id, size: line.size, quantity: line.quantity })
        items.push({
            product: product._id,
            title: product.title,
            image: product.images?.[0] ?? "",
            price: product.price.amount,
            currency: product.price.currency,
            size: line.size,
            quantity: line.quantity
        })
    }

    const currencies = new Set(items.map(item => item.currency))
    if (currencies.size !== 1) {
        await restoreStock(reserved)
        return res.status(400).json({ message: "Your cart contains different currencies; please order those items separately" })
    }

    const currency = items[0].currency
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let order
    try {
        order = await orderModel.create({
            user: req.user.userId,
            items,
            shippingAddress: address,
            total,
            currency,
            paymentMethod: "COD"
        })
        await cartModel.updateOne({ user: req.user.userId }, { $set: { products: [] } })
    } catch (error) {
        if (order) {
            try {
                const deletion = await orderModel.deleteOne({ _id: order._id, user: req.user.userId })
                if (deletion.deletedCount === 1) {
                    await restoreStock(reserved)
                } else {
                    console.error(`Could not remove incomplete order ${order._id}`)
                }
            } catch (rollbackError) {
                console.error(`Could not remove incomplete order ${order._id}`, rollbackError)
            }
        } else {
            await restoreStock(reserved)
        }
        throw error
    }

    return res.status(201).json({
        message: "Order placed successfully",
        data: { order }
    })
}

export async function listOrders(req, res) {
    const orders = await orderModel.find({
        user: req.user.userId,
        status: { $ne: "cancelled" }
    }).sort({ createdAt: -1 }).lean()
    return res.status(200).json({
        message: "Orders fetched successfully",
        data: { orders }
    })
}

export async function cancelOrder(req, res) {
    const { orderId } = req.params
    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(404).json({ message: "Order not found" })
    }

    const order = await orderModel.findOneAndUpdate(
        { _id: orderId, user: req.user.userId, status: "placed" },
        { $set: { status: "cancelled" } },
        { returnDocument: "after" }
    ).lean()

    if (!order) {
        const existingOrder = await orderModel.findOne({ _id: orderId, user: req.user.userId })
            .select("status")
            .lean()
        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" })
        }
        return res.status(409).json({
            message: `This order cannot be cancelled because its status is ${existingOrder.status}`
        })
    }

    const reservations = order.items.map(item => ({
        productId: item.product,
        size: item.size,
        quantity: item.quantity
    }))

    try {
        await restoreStock(reservations)
    } catch (error) {
        console.error(`Order ${order._id} was cancelled but its stock could not be fully restored`, error)
        return res.status(500).json({
            message: "The order was cancelled, but stock could not be fully restored. Please contact support."
        })
    }

    return res.status(200).json({
        message: "Order cancelled successfully",
        data: { order }
    })
}
