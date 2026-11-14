import { ProductStatus, Role } from "../generated/prisma/enums.ts";

// What a customer may see and buy: approved, listed by the seller, and sold by an account that is
// still an active SELLER (deactivating or demoting a seller takes their products off the shelf).
export const purchasableWhere = Object.freeze({
  status: ProductStatus.APPROVED,
  isActive: true,
  seller: { isActive: true, role: Role.SELLER },
});
