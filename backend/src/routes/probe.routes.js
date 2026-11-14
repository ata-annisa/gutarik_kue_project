// TEMPORARY: lets you verify RBAC and the audit log before the real routes exist.
// Delete this file (and its line in routes/index.js) in phase 3.
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { Role } from "../generated/prisma/enums.ts";

const router = Router();
const ok = (req, res) => res.json({ ok: true, you: req.user });

router.use(authenticate);
router.get("/admin", authorize(Role.ADMIN), ok);
router.get("/seller", authorize(Role.SELLER, Role.ADMIN), ok);
router.get("/any", authorize(Role.CUSTOMER, Role.SELLER, Role.ADMIN), ok);

export default router;
