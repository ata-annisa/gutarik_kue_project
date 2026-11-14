import { http } from "./http";

// Every call answers with the whole cart: { items, itemCount, subtotal, canCheckout }.
// Prices are computed by the server, the client never sends one.
export const cartApi = {
  async get() {
    return (await http.get("/cart")).data.cart;
  },
  async addItem(productId, quantity) {
    return (await http.post("/cart/items", { productId, quantity })).data.cart;
  },
  async updateItem(itemId, quantity) {
    return (await http.patch(`/cart/items/${itemId}`, { quantity })).data.cart;
  },
  async removeItem(itemId) {
    return (await http.delete(`/cart/items/${itemId}`)).data.cart;
  },
};
