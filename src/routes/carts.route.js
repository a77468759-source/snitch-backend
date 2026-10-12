import { Router } from 'express';
import { body, param, validationResult } from "express-validator"
import { addToCartValidator } from "../validators/cart.validaor.js"
import { authenticate } from "../middleware/auth.middleware.js"
import { addToCart, clearCart, getCart, mergeGuestCart, removeCartItem, updateCartItem } from "../controller/carts.controller.js"

const router = Router();


router.post("/", authenticate, addToCartValidator, addToCart)
router.post("/merge", authenticate, [
    body("items").isArray({ max: 100 }),
    body("items.*.productId").isMongoId(),
    body("items.*.size").isString().isIn([ "XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40" ]),
    body("items.*.quantity").isInt({ min: 1, max: 99 }),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() })
        }
        next()
    }
], mergeGuestCart)
router.get("/", authenticate, getCart)
router.patch("/", authenticate, [
    body("productId").isMongoId(),
    body("size").isString().isIn([ "XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40" ]),
    body("quantity").isInt({ min: 1 }),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() })
        }
        next()
    }
], updateCartItem)
router.delete("/item", authenticate, [
    body("productId").isMongoId(),
    body("size").isString().isIn([ "XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40" ]),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() })
        }
        next()
    }
], removeCartItem)
router.delete("/item/:productId/:size", authenticate, [
    param("productId").isMongoId(),
    param("size").isString().isIn([ "XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40" ]),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() })
        }
        next()
    }
], removeCartItem)
router.delete("/", authenticate, clearCart)


export default router