# Katalog Sekar

Aplikasi katalog bunga Sekar dengan storefront React dan API Express/SQLite.

## Prasyarat

- Node.js 22.5 atau lebih baru
- npm

## Menjalankan aplikasi

Pasang dependensi client dan server masing-masing:

```powershell
cd client
npm install
npm run dev
```

```powershell
cd server
npm install
npm run dev
```

Client tersedia di `http://localhost:3000`. API berjalan di port `5000` secara default; client meneruskan permintaan `/api` dan `/uploads` ke API.

## Pemeriksaan

```powershell
cd client
npm run lint
npm run build
```

Belum ada rangkaian tes otomatis. Skrip server `npm test` masih berupa placeholder.

## Struktur

- `client/src/Storefront.jsx` — halaman katalog, detail produk, keranjang, dan checkout.
- `client/src/components/` — halaman akun pelanggan, dashboard, dan dialog admin.
- `client/src/services/api.js` — komunikasi client dengan API.
- `server/src/index.js` — entry point API.
- `server/src/routes/` — route autentikasi, kategori, produk, pengaturan toko, dan pesanan.
- `server/src/db/` — akses SQLite dan data seed.
- `server/uploads/` — foto produk yang diunggah.

Port API dapat diubah menggunakan variabel lingkungan `PORT`. Lokasi database SQLite dapat diubah menggunakan `SQLITE_FILE`; secara default database berada di `server/src/db/katalogwa.sqlite`.

Akun pelanggan dapat dibuat melalui halaman **Masuk** di header toko. Pendaftaran memerlukan nama, email, dan kata sandi minimal 8 karakter; sesi pelanggan terpisah dari sesi admin.

Admin yang sudah masuk dapat mengelola akun administrator lain melalui menu **Kelola admin**. Setiap akun memiliki email dan kata sandi sendiri; kata sandi disimpan dalam bentuk hash. Akun yang sedang digunakan tidak dapat dihapus, dan sistem selalu mempertahankan setidaknya satu admin.

Pesanan yang dikirim dari akun pelanggan tersimpan sebagai **menunggu konfirmasi**. Admin dapat mengonfirmasi atau menolak pesanan dari menu **Pesanan** di dashboard, dan pelanggan dapat melihat status serta riwayatnya di halaman akun. Checkout tamu tetap diarahkan ke WhatsApp tetapi tidak disimpan sebagai pesanan akun.

### API Pesanan

| Method | Endpoint | Akses | Fungsi |
| --- | --- | --- | --- |
| `POST` | `/api/orders` | User | Simpan checkout akun sebagai pesanan menunggu konfirmasi |
| `GET` | `/api/orders/mine` | User | Lihat pesanan milik akun yang sedang masuk |
| `GET` | `/api/orders` | Admin | Lihat semua pesanan akun |
| `PATCH` | `/api/orders/:id/status` | Admin | Ubah pesanan menunggu menjadi `confirmed` atau `rejected` |

Data harga dan nama produk disalin dari katalog server saat pesanan dibuat. Checkout tanpa sesi user tidak membuat record pesanan.

Dashboard admin juga menyediakan **Kelola toko** untuk mengubah nama, slogan, dan alamat toko, serta **Kelola WhatsApp** untuk mengubah nomor kontak dan mengaktifkan atau menonaktifkan pesanan WhatsApp. Pengaturan disimpan melalui `GET /api/store` dan `PUT /api/store`; perubahan hanya dapat disimpan oleh admin yang sudah masuk.

### API Kelola Admin

Semua endpoint admin memerlukan header `Authorization: Bearer <token>` dari `POST /api/auth/login` dengan akun berperan admin.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/api/auth/admins` | Daftar admin (tanpa kata sandi) |
| `POST` | `/api/auth/admins` | Tambah admin; perlu `name`, `email`, dan `password` |
| `PUT` | `/api/auth/admins/:id` | Ubah `name` dan `email`; `password` opsional |
| `DELETE` | `/api/auth/admins/:id` | Hapus admin selain akun yang sedang digunakan |

Nama harus 2–80 karakter, email harus valid dan belum digunakan akun lain, serta kata sandi minimal 8 karakter (maksimal 72 byte). API menolak penghapusan jika hanya tersisa satu admin. Respons sukses menggunakan bentuk `{ "success": true, "data": ... }`; validasi mengembalikan `400`, email duplikat `409`, sesi/izin tidak valid `401` atau `403`, dan admin yang tidak ditemukan `404`.
