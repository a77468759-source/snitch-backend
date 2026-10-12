import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/user.validator.js";
import { getMe, login, logout, refresh, register } from "../controller/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register",registerValidator,register)

router.post("/login",loginValidator,login)
router.get("/refresh",refresh)
router.post("/logout", logout)

router.get("/",authenticate,getMe)

export default router;
