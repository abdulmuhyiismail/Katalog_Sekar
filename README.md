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
- `server/src/routes/` — route autentikasi, kategori, produk, dan pengaturan toko.
- `server/src/db/` — akses SQLite dan data seed.
- `server/uploads/` — foto produk yang diunggah.

Port API dapat diubah menggunakan variabel lingkungan `PORT`. Lokasi database SQLite dapat diubah menggunakan `SQLITE_FILE`; secara default database berada di `server/src/db/katalogwa.sqlite`.

Akun pelanggan dapat dibuat melalui halaman **Masuk** di header toko. Pendaftaran memerlukan nama, email, dan kata sandi minimal 8 karakter; sesi pelanggan terpisah dari sesi admin.
