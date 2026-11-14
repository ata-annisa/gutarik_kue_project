import { http } from "./http";

// Customer side.
export const ordersApi = {
  async checkout(payload) {
    return (await http.post("/orders/checkout", payload)).data; // { orders, grandTotal }
  },
  async list(params) {
    return (await http.get("/orders", { params })).data; // { orders, meta }
  },
  async get(id) {
    return (await http.get(`/orders/${id}`)).data.order;
  },
};
