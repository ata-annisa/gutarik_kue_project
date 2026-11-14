import { Router } from "express";
import { requireCustomer } from "../middleware/roleGuards.js";
import { addItem, getCart, removeItem, updateItem } from "../controllers/cartController.js";

const router = Router();
router.use(requireCustomer);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:id", updateItem);
router.delete("/items/:id", removeItem);

export default router;
