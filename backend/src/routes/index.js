import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./productRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";
import sellerRoutes from "./sellerRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.use("/auth", authRoutes); // public: register / login; authenticated: logout / me
router.use("/products", productRoutes); // public catalog
router.use("/cart", cartRoutes); // CUSTOMER
router.use("/orders", orderRoutes); // CUSTOMER
router.use("/seller", sellerRoutes); // SELLER
router.use("/admin", adminRoutes); // ADMIN

export default router;
