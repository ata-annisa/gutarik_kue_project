import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { installSessionExpiry } from "./session";
import { useAuthStore } from "./stores/auth";
import { useCartStore } from "./stores/cart";
import { useToastStore } from "./stores/toast";
import "./styles.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);

installSessionExpiry({ router, auth: useAuthStore(), cart: useCartStore(), toast: useToastStore() });

app.mount("#app");
