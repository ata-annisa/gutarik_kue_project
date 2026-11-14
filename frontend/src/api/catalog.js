import { http } from "./http";

// Public catalog (approved + listed products only).
export const catalogApi = {
  async listProducts(params) {
    return (await http.get("/products", { params })).data; // { products, meta }
  },
  async listCategories() {
    return (await http.get("/products/categories")).data.categories;
  },
  async getProduct(id) {
    return (await http.get(`/products/${id}`)).data.product;
  },
};
