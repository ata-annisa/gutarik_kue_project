import axios from "axios";

let onUnauthorized = null;
/** session.js registers what to do when the server says the session is gone. */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// Same-origin: the Vite dev server proxies /api to the backend container.
// The session JWT lives in an httpOnly cookie that the browser attaches by itself.
// JavaScript never sees or stores the token.
export const http = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    // 401 from /auth/* is an expected answer (wrong password, not logged in yet).
    // 401 from anything else means the session expired mid-use.
    if (error.response?.status === 401 && !url.startsWith("/auth/")) onUnauthorized?.();
    return Promise.reject(error);
  }
);

const DEFAULT_MESSAGES = {
  400: "Data yang dikirim tidak valid.",
  401: "Sesi berakhir. Silakan masuk lagi.",
  403: "Anda tidak punya akses untuk aksi ini.",
  404: "Data tidak ditemukan.",
  409: "Aksi tidak bisa dilakukan saat ini.",
  413: "Data terlalu besar.",
  429: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
};

// The API answers in English. Messages a user can actually run into are shown in Indonesian.
const SERVER_MESSAGES = [
  [/^Cart is empty/, () => "Keranjang Anda kosong."],
  [/^"(.+)" is no longer available/, (m) => `"${m[1]}" sudah tidak tersedia. Hapus dari keranjang.`],
  [/^Not enough stock for "(.+)"/, (m) => `Stok "${m[1]}" tidak cukup, atau harganya baru saja berubah. Periksa keranjang Anda.`],
  [/^Not enough stock \((\d+) left\)/, (m) => `Stok tidak cukup (tersisa ${m[1]}).`],
  [/^At most (\d+) per product/, (m) => `Maksimal ${m[1]} per produk.`],
  [/^A cart holds at most (\d+)/, (m) => `Keranjang maksimal berisi ${m[1]} produk berbeda.`],
  [/^This product is no longer available/, () => "Produk ini sudah tidak tersedia. Hapus dari keranjang."],
  [/^Cart was updated at the same time|^Your cart changed during checkout/, () => "Keranjang berubah saat diproses. Periksa lalu coba lagi."],
  [/^Order total is too large/, () => "Total pesanan terlalu besar."],
  [/^Product not available/, () => "Produk tidak tersedia."],
  [/^Product has order history/, () => "Produk ini sudah pernah dipesan sehingga tidak bisa dihapus. Sembunyikan saja."],
  [/^An order cannot go from/, () => "Status pesanan tidak bisa diubah ke tahap itu."],
  [/^The order was updated at the same time/, () => "Pesanan baru saja diubah. Muat ulang lalu coba lagi."],
  [/^You cannot change your own/, () => "Anda tidak bisa mengubah akun sendiri."],
  [/^Cannot remove the last active administrator/, () => "Tidak bisa menurunkan atau menonaktifkan admin aktif terakhir."],
  [/^The user was modified concurrently/, () => "Data pengguna baru saja berubah. Muat ulang lalu coba lagi."],
];

function translate(serverMessage) {
  for (const [pattern, build] of SERVER_MESSAGES) {
    const m = pattern.exec(serverMessage);
    if (m) return build(m);
  }
  return null;
}

/**
 * Turns an axios error into something safe and readable for the UI.
 * @param {unknown} error
 * @param {Record<number,string>} [overrides] per-screen messages by HTTP status
 * @returns {{ message: string, fieldErrors: Record<string,string> }}
 */
export function errorInfo(error, overrides = {}) {
  const res = error?.response;
  if (!res) {
    return { message: "Tidak bisa terhubung ke server. Periksa koneksi Anda.", fieldErrors: {} };
  }
  const fieldErrors = {};
  if (res.status === 400 && Array.isArray(res.data?.details)) {
    for (const d of res.data.details) if (d.field && !fieldErrors[d.field]) fieldErrors[d.field] = d.message;
  }
  let message =
    overrides[res.status] ??
    (typeof res.data?.error === "string" ? translate(res.data.error) : null) ??
    DEFAULT_MESSAGES[res.status];
  if (!message) {
    message = "Terjadi kesalahan di server. Coba lagi.";
    if (res.data?.requestId) message += ` (kode: ${res.data.requestId})`;
  }
  return { message, fieldErrors };
}
