import { authenticate } from "./authenticate.js";
import { authorize } from "./authorize.js";
import { Role } from "../generated/prisma/enums.ts";

// Same composition as requireAdmin: authenticate (401) then authorize (403 + RBAC_DENIED log).
export const requireSeller = [authenticate, authorize(Role.SELLER)];
export const requireCustomer = [authenticate, authorize(Role.CUSTOMER)];
