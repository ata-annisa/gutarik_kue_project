# Gutarik Kue — Full-Stack Bakery E-Commerce

Aplikasi web e-commerce toko kue dengan sistem manajemen berbasis peran (**Role-Based Access Control**) untuk **Admin**, **Seller**, dan **Customer**, dikemas dalam arsitektur kontainer Docker.

## Arsitektur & Tech Stack

- **Frontend:** Vue 3 (`<script setup>`), Vite, Pinia, Vue Router, Axios
- **Backend:** Node.js, Express 5, Prisma ORM 7, Zod, JWT (`httpOnly` cookie), Helmet, Winston
- **Database:** PostgreSQL 16 (dengan *database-level constraints* dan integritas *snapshot* harga transaksi)
- **Infrastructure:** Docker & Docker Compose (`gk-db`, `gk-backend`, `gk-frontend`)

## Fitur Utama per Role

- **Publik & Autentikasi:** Katalog produk dengan pencarian, filter kategori, pengurutan, pagination, registrasi akun, serta sesi autentikasi aman dengan invalidasi token berbasis `tokenVersion`.
- **Customer:** Keranjang belanja tervalidasi stok secara *real-time*, *checkout* multi-penjual (pemisahan pesanan otomatis per toko, opsi `PICKUP` / `DELIVERY`), dan pelacakan riwayat pesanan.
- **Seller:** Dasbor analitik penjualan 7 hari, manajemen katalog produk, serta pemrosesan status pesanan bertahap (`PENDING` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`).
- **Admin:** Dasbor statistik sistem global, manajemen peran dan status aktif pengguna, moderasi persetujuan/penolakan produk, serta audit seluruh transaksi lintas toko.

## Cara Menjalankan (Docker Compose)

1. Salin template konfigurasi dan buat secret otomatis:
   ```bash
   cp .env.example .env
   node scripts/init-env.mjs