import { http } from "./http";

export const authApi = {
  async login({ email, password }) {
    const { data } = await http.post("/auth/login", { email, password });
    return data.user;
  },

  // The backend schema is strict: send exactly name, email, password. Never "role",
  // never a confirm-password field, or the request is rejected with 400.
  async register({ name, email, password }) {
    const { data } = await http.post("/auth/register", { name, email, password });
    return data.user;
  },

  async logout() {
    await http.post("/auth/logout");
  },

  async me() {
    const { data } = await http.get("/auth/me");
    return data.user;
  },
};
