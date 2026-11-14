import { handle } from "../utils/http.js";
import { adminStats, sellerStats } from "../services/statsService.js";

// GET /api/admin/stats   (system wide)
export const getAdminStats = handle(async (_req, res) => {
  res.json({ stats: await adminStats() });
});

// GET /api/seller/stats   (only the caller's own products and orders)
export const getSellerStats = handle(async (req, res) => {
  res.json({ stats: await sellerStats(req.user.id) });
});
