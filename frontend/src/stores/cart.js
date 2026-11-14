import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { cartApi } from "../api/cart";

const emptyCart = () => ({ items: [], itemCount: 0, subtotal: 0, canCheckout: false });

export const useCartStore = defineStore("cart", () => {
  const cart = ref(emptyCart());
  const loading = ref(false);

  const itemCount = computed(() => cart.value.itemCount);

  async function load() {
    loading.value = true;
    try {
      cart.value = await cartApi.get();
    } finally {
      loading.value = false;
    }
  }
  async function add(productId, quantity = 1) {
    cart.value = await cartApi.addItem(productId, quantity);
  }
  async function setQuantity(itemId, quantity) {
    cart.value = await cartApi.updateItem(itemId, quantity);
  }
  async function remove(itemId) {
    cart.value = await cartApi.removeItem(itemId);
  }
  /** Forget the local copy (logout, session expiry, after checkout). */
  function reset() {
    cart.value = emptyCart();
  }

  return { cart, loading, itemCount, load, add, setQuantity, remove, reset };
});
