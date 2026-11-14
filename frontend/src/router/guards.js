// Pure functions, no Vue imports, so they are easy to unit test.
//
// IMPORTANT: these guards are UX only. They stop people from seeing screens they cannot
// use. Real access control is enforced by the backend (authenticate + authorize) on
// every API call. Anyone can edit client code in DevTools; nobody can edit the server.

export const ROLES = Object.freeze({ ADMIN: "ADMIN", SELLER: "SELLER", CUSTOMER: "CUSTOMER" });

const HOME = { ADMIN: "/admin", SELLER: "/seller", CUSTOMER: "/account" };
export const homeFor = (role) => HOME[role] ?? "/";

/** May this user (or anonymous visitor, when null) open a route with this meta? */
export function canAccess(meta = {}, user = null) {
  if (meta.guestOnly && user) return false;
  if ((meta.requiresAuth || meta.roles) && !user) return false;
  if (meta.roles && !meta.roles.includes(user.role)) return false;
  return true;
}

/** Returns true to allow navigation, or a route location to redirect to. */
export function guardDecision(meta = {}, user = null, fullPath = "/") {
  if (meta.guestOnly && user) return { path: homeFor(user.role) };
  if ((meta.requiresAuth || meta.roles) && !user) {
    return { name: "login", query: { redirect: fullPath } };
  }
  if (meta.roles && !meta.roles.includes(user.role)) return { name: "forbidden" };
  return true;
}

/**
 * The ?redirect= value comes from the URL, so it is attacker controlled.
 * Accept only a same-site path: one leading "/", no "//host", no backslashes, no control chars.
 * Otherwise a phishing link like /login?redirect=//evil.example would bounce the user off-site.
 */
export function sanitizeRedirect(value) {
  if (typeof value !== "string") return null;
  if (!/^\/(?![/\\])/.test(value)) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}
