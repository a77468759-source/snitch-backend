import cartModel from "../models/carts.model.js"
import productModel from "../models/products.model.js"



export async function addToCart(req, res) {

    const { productId, quantity, size } = req.body


    const product = await productModel.findOne({ _id: productId, published: true })

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    const selectedSize = product.sizes.find(s => s.size === size)

    if (!selectedSize) {
        return res.status(400).json({
            message: "Invalid size"
        })
    }

    if (selectedSize.stock < quantity) {
        return res.status(400).json({
            message: "Insufficient stock"
        })
    }



    const cart = (await cartModel.findOne({ user: req.user.userId }))
        ?? await cartModel.create({ user: req.user.userId })



    const productInCart = cart.products.find(p => (p.product.toString() === productId) && (p.size === size))

    if (productInCart) {

        if ((productInCart.quantity + quantity) > selectedSize.stock) {
            return res.status(400).json({
                message: "Insufficient stock"
            })
        }

        await cartModel.updateOne(
            { user: req.user.userId, products: { $elemMatch: { product: productId, size } } },
            {
                $inc: {
                    "products.$.quantity": quantity
                }
            }
        )

        return res.status(200).json({
            message: "Product quantity updated in cart"
        })
    }

    await cartModel.findOneAndUpdate(
        { user: req.user.userId },
        {
            $push: {
                products: {
                    product: productId,
                    quantity: quantity,
                    size: size
                }
            }
        }
    )

    return res.status(200).json({
        message: "Product added to cart"
    })
}


export async function getCart(req, res) {
    const cart = await cartModel.findOne({ user: req.user.userId }).populate("products.product").lean()

    return res.status(200).json({
        message: "Cart retrieved successfully",
        data: {
            cart: cart ?? { products: [] }
        }
    });
}

export async function updateCartItem(req, res) {
    const { productId, size, quantity } = req.body
    const cart = await cartModel.findOne({ user: req.user.userId })
    const line = cart?.products.find(item => item.product.toString() === productId && item.size === size)

    if (!line) {
        return res.status(404).json({ message: "Cart item not found" })
    }

    const product = await productModel.findById(productId).lean()
    const selectedSize = product?.sizes.find(item => item.size === size)
    if (!selectedSize || selectedSize.stock < quantity) {
        return res.status(400).json({ message: "Requested quantity is unavailable" })
    }

    await cartModel.updateOne(
        { user: req.user.userId, products: { $elemMatch: { product: productId, size } } },
        { $set: { "products.$.quantity": quantity } }
    )
    return res.status(200).json({ message: "Cart updated successfully" })
}

export async function removeCartItem(req, res) {
    const { productId, size } = req.params.productId ? req.params : req.body
    const result = await cartModel.updateOne(
        {
            user: req.user.userId,
            products: { $elemMatch: { product: productId, size } }
        },
        { $pull: { products: { product: productId, size } } }
    )

    if (result.modifiedCount !== 1) {
        return res.status(404).json({ message: "Cart item not found" })
    }

    return res.status(200).json({ message: "Product removed from cart" })
}

export async function clearCart(req, res) {
    await cartModel.updateOne({ user: req.user.userId }, { $set: { products: [] } })
    return res.status(200).json({ message: "Cart cleared successfully" })
}

export async function mergeGuestCart(req, res) {
    const cart = await cartModel.findOne({ user: req.user.userId })
    const merged = new Map()

    for (const line of cart?.products ?? []) {
        merged.set(`${line.product}:${line.size}`, {
            product: line.product,
            size: line.size,
            quantity: line.quantity
        })
    }

    for (const line of req.body.items) {
        const key = `${line.productId}:${line.size}`
        const existing = merged.get(key)
        merged.set(key, {
            product: line.productId,
            size: line.size,
            quantity: line.quantity + (existing?.quantity ?? 0)
        })
    }

    const products = [...merged.values()]
    for (const line of products) {
        const product = await productModel.findOne({ _id: line.product, published: true }).lean()
        const size = product?.sizes.find(item => item.size === line.size)
        if (!size || size.stock < line.quantity) {
            return res.status(409).json({ message: "A cart item is no longer available in the requested quantity" })
        }
    }

    const updatedCart = await cartModel.findOneAndUpdate(
        { user: req.user.userId },
        { $set: { products } },
        { new: true, upsert: true }
    ).populate("products.product").lean()

    return res.status(200).json({
        message: "Guest cart merged successfully",
        data: { cart: updatedCart }
    })
}