import { Router } from "express";
import { requireCustomer } from "../middleware/roleGuards.js";
import { checkoutLimiter } from "../middleware/rateLimit.js";
import { checkoutCart, getMyOrder, listMyOrders } from "../controllers/orderController.js";

const router = Router();
router.use(requireCustomer);

router.post("/checkout", checkoutLimiter, checkoutCart);
router.get("/", listMyOrders);
router.get("/:id", getMyOrder);

export default router;
