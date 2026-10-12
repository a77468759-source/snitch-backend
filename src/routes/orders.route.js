import { body, param, validationResult } from "express-validator"
import { Router } from "express"
import { cancelOrder, createOrder, listOrders } from "../controller/orders.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"

const router = Router()
const requiredAddressFields = [ "name", "phone", "address", "city", "state", "postalCode" ]

router.get("/", authenticate, listOrders)
router.post("/:orderId/cancel", authenticate, [
    param("orderId").isMongoId().withMessage("Order ID must be a valid Mongo ID")
], (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation failed", errors: errors.array() })
    }
    next()
}, cancelOrder)

router.post("/", authenticate, [
    ...requiredAddressFields.map(field =>
        body(`shippingAddress.${field}`)
            .isString()
            .withMessage(`${field} is required`)
            .bail()
            .trim()
            .notEmpty()
            .withMessage(`${field} is required`)
            .isLength({ max: 200 })
            .withMessage(`${field} is too long`)
    ),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() })
        }
        next()
    }
], createOrder)

export default router
