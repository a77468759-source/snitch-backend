import { body, validationResult } from 'express-validator';

export const addToCartValidator = [

    body("productId")
        .exists()
        .withMessage("Product ID is required")
        .bail()
        .isString()
        .withMessage("Product ID must be a string")
        .bail()
        .isMongoId()
        .withMessage("Product ID must be a valid Mongo ID"),
    body("quantity")
        .exists()
        .withMessage("Quantity is required")
        .bail()
        .isInt({ min: 1 })
        .withMessage("Quantity must be an integer greater than 0"),
    body("size")
        .exists()
        .withMessage("Size is required")
        .bail()
        .isString()
        .withMessage("Size must be a string")
        .bail()
        .isIn([ "XS", "S", "M", "L", "XL", "XXL","28","30","32","34","36","38","40" ])
        .withMessage("size can be one of these XS, S, M, L, XL, XXL,28,30,32,34,36,38,40"),
    (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array()
            });
        }

        next();
    }


]


