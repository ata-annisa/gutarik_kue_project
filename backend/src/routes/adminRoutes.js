import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { getUsers, updateUserRole, updateUserStatus } from "../controllers/adminUserController.js";
import { approveProduct, listProductsForModeration, rejectProduct } from "../controllers/adminProductController.js";
import { getAnyOrder, listAllOrders } from "../controllers/adminOrderController.js";
import { getAdminStats } from "../controllers/statsController.js";

const router = Router();

// Applied before any route, so even an unknown /api/admin/... path demands an admin
// (an anonymous caller learns nothing about which admin endpoints exist).
router.use(requireAdmin);

// users + roles
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);

// product moderation
router.get("/products", listProductsForModeration);
router.post("/products/:id/approve", approveProduct);
router.post("/products/:id/reject", rejectProduct);

// order tracking (read only) and dashboard metrics
router.get("/orders", listAllOrders);
router.get("/orders/:id", getAnyOrder);
router.get("/stats", getAdminStats);

export default router;
