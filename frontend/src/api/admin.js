import { http } from "./http";

export const adminApi = {
  // users
  async listUsers(params) {
    return (await http.get("/admin/users", { params })).data; // { users, meta }
  },
  /** The users endpoint is paginated (max 100 per page): walk every page. */
  async listAllUsers({ maxPages = 50 } = {}) {
    const byId = new Map();
    let page = 1;
    let totalPages = 1;
    let total = 0;
    do {
      const { users, meta } = await this.listUsers({ page, limit: 100 });
      for (const u of users) byId.set(u.id, u); // de-duplicate if someone registers while we page
      totalPages = meta.totalPages;
      total = meta.total;
      page++;
    } while (page <= totalPages && page <= maxPages);
    return { users: [...byId.values()], total };
  },
  async updateUserRole(id, role) {
    return (await http.patch(`/admin/users/${id}/role`, { role })).data; // { user, changed }
  },
  async updateUserStatus(id, isActive) {
    return (await http.patch(`/admin/users/${id}/status`, { isActive })).data; // { user, changed }
  },
  // product moderation
  async listProducts(params) {
    return (await http.get("/admin/products", { params })).data; // { products, meta }
  },
  async approveProduct(id) {
    return (await http.post(`/admin/products/${id}/approve`)).data; // { product, changed }
  },
  async rejectProduct(id, reason) {
    return (await http.post(`/admin/products/${id}/reject`, { reason })).data; // { product, changed }
  },
  // order audit (read only)
  async listOrders(params) {
    return (await http.get("/admin/orders", { params })).data; // { orders, meta }
  },
  // dashboard
  async stats() {
    return (await http.get("/admin/stats")).data.stats;
  },
};
