// Client-side checks mirror the backend rules so users get instant feedback.
// The server still validates everything; this is convenience, not security.

export const ROLE_LABEL = { ADMIN: "Admin", SELLER: "Penjual", CUSTOMER: "Pembeli" };

export function validateName(v) {
  const s = v.trim();
  if (s.length < 2) return "Nama minimal 2 karakter.";
  if (s.length > 80) return "Nama maksimal 80 karakter.";
  return "";
}

export function validateEmail(v) {
  const s = v.trim();
  if (!s) return "Email wajib diisi.";
  if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Format email tidak valid.";
  return "";
}

export function validateNewPassword(v) {
  if (v.length < 10) return "Password minimal 10 karakter.";
  if (new TextEncoder().encode(v).length > 72) return "Password terlalu panjang (maksimal 72 byte).";
  if (!/[A-Za-z]/.test(v)) return "Password harus mengandung huruf.";
  if (!/\d/.test(v)) return "Password harus mengandung angka.";
  return "";
}
