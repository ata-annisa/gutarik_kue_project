export const ORDER_STATUS_LABEL = {
  PENDING: "Menunggu konfirmasi",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
};
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL);

// What a seller does next, per current status (mirrors the backend state machine).
export const NEXT_ORDER_STATUS = { PENDING: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };
export const NEXT_ORDER_ACTION = {
  PENDING: "Proses pesanan",
  PROCESSING: "Tandai dikirim",
  SHIPPED: "Tandai selesai",
};

export const PRODUCT_STATUS_LABEL = { PENDING: "Menunggu review", APPROVED: "Disetujui", REJECTED: "Ditolak" };
export const PRODUCT_STATUSES = Object.keys(PRODUCT_STATUS_LABEL);

export const DELIVERY_LABEL = { PICKUP: "Ambil sendiri", DELIVERY: "Diantar" };
