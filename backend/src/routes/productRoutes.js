import { Router } from "express";
import { getProduct, listCategories, listProducts } from "../controllers/productController.js";

const router = Router();

router.get("/", listProducts);
router.get("/categories", listCategories); // must stay above "/:id"
router.get("/:id", getProduct);

export default router;
