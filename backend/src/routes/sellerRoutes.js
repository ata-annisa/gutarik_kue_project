import { Router } from "express";
import { requireSeller } from "../middleware/roleGuards.js";
import {
  createProduct,
  deleteProduct,
  getMyProduct,
  listMyProducts,
  updateProduct,
} from "../controllers/sellerProductController.js";
import { getSellerOrder, listSellerOrders, updateOrderStatus } from "../controllers/sellerOrderController.js";
import { getSellerStats } from "../controllers/statsController.js";

const router = Router();
router.use(requireSeller);

router.get("/products", listMyProducts);
router.post("/products", createProduct);
router.get("/products/:id", getMyProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", listSellerOrders);
router.get("/orders/:id", getSellerOrder);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/stats", getSellerStats);

export default router;
