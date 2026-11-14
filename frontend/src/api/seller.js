import { http } from "./http";

export const sellerApi = {
  // products
  async listProducts(params) {
    return (await http.get("/seller/products", { params })).data; // { products, meta }
  },
  async getProduct(id) {
    return (await http.get(`/seller/products/${id}`)).data.product;
  },
  async createProduct(payload) {
    return (await http.post("/seller/products", payload)).data.product;
  },
  async updateProduct(id, patch) {
    return (await http.patch(`/seller/products/${id}`, patch)).data; // { product, resubmitted }
  },
  async removeProduct(id) {
    await http.delete(`/seller/products/${id}`);
  },
  // orders
  async listOrders(params) {
    return (await http.get("/seller/orders", { params })).data; // { orders, meta }
  },
  async updateOrderStatus(id, status) {
    return (await http.patch(`/seller/orders/${id}/status`, { status })).data; // { order, changed }
  },
  // dashboard
  async stats() {
    return (await http.get("/seller/stats")).data.stats;
  },
};
