import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { registerLimiter, loginIpLimiter, loginAccountLimiter } from "../middleware/rateLimit.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginIpLimiter, loginAccountLimiter, validate(loginSchema), login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
