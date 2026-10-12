import { body, validationResult } from "express-validator";

export const registerValidator = [

    body("email")
        .exists()
        .withMessage("Email is required")
        .bail()
        .isEmail()
        .withMessage("Enter a valid email")
        .bail()
        .trim(),

    body("name")
        .exists()
        .withMessage("Name is required")
        .bail()
        .isString()
        .withMessage("Name must be a string")
        .bail()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name length must be 2-50 characters"),

    body("password")
        .exists()
        .withMessage("Password is required")
        .bail()
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .trim()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Invalid request",
                errors: errors.array()
            });
        }

        next();
    }
];
export const loginValidator =[
    body("email")
    .exists()
    .withMessage("Email is required to login")
    .bail()
    .isString()
    .withMessage("only strings are allowed")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Inavlid Email"),

    body("password")
    .exists()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .trim()
    .isLength({min:6})
    .withMessage("password must be 6 characters long"),

    (req,res,next)=>{
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                message:"Invalid data",
                errors:errors.array()
            })
        }
        next();
    }

    
]