import { setUnauthorizedHandler } from "./api/http";

/**
 * If any API call comes back 401 (session expired or revoked), forget the user, tell them, and go to
 * the login page, remembering where they were so they return there after signing in again.
 */
export function installSessionExpiry({ router, auth, cart, toast }) {
  setUnauthorizedHandler(() => {
    const wasLoggedIn = auth.user !== null;
    auth.clear();
    cart.reset();
    const current = router.currentRoute.value;
    if (current.name !== "login") {
      if (wasLoggedIn) toast.info("Sesi Anda berakhir. Silakan masuk lagi.");
      router.push({ name: "login", query: { redirect: current.fullPath } });
    }
  });
}
