import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { useToastStore } from "../stores/toast";

/** Shared by every place that has an "add to cart" button (home, catalog, product page). */
export function useAddToCart() {
  const auth = useAuthStore();
  const cart = useCartStore();
  const toast = useToastStore();
  const router = useRouter();
  const route = useRoute();
  const busyId = ref(null);

  async function addToCart(product, quantity = 1) {
    if (!auth.user) {
      toast.info("Masuk dulu untuk mulai berbelanja.");
      return router.push({ name: "login", query: { redirect: route.fullPath } });
    }
    if (auth.user.role !== "CUSTOMER") {
      return toast.info("Hanya akun pembeli yang bisa berbelanja.");
    }
    busyId.value = product.id;
    try {
      await cart.add(product.id, quantity);
      toast.success(`${product.name} masuk ke keranjang.`);
    } catch (err) {
      toast.fail(err);
    } finally {
      busyId.value = null;
    }
  }

  return { busyId, addToCart };
}
