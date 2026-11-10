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
Copy-Item .env.example .env
# Atur JWT_SECRET dan kredensial admin awal di .env sebelum menjalankan API.
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

Port API dapat diubah menggunakan variabel lingkungan `PORT`. Lokasi database SQLite dapat diubah menggunakan `SQLITE_FILE`; secara default database berada di `server/src/db/katalogwa.sqlite`. Lokasi file upload dapat diubah menggunakan `UPLOADS_DIR`; secara default upload tersimpan di `server/uploads`.

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

## Deployment VPS (IP tanpa domain)

Produksi menggunakan satu proses PM2 untuk API di `127.0.0.1:5000`; Nginx menyajikan `client/dist` pada port 80 dan meneruskan `/api` serta `/uploads` ke API. Database dan upload berada di `/var/lib/katalog-sekar`, di luar clone Git.

Persyaratan: Ubuntu, Node.js 22.5+, Git, Nginx, dan PM2 yang sudah tersedia. Jalankan perintah sebagai pengguna yang mengelola PM2 (contoh di bawah menggunakan `root`).

### Clone dan konfigurasi awal

```bash
git clone https://github.com/abdulmuhyiismail/Katalog_Sekar.git /var/www/katalog-sekar
mkdir -p /var/lib/katalog-sekar/uploads
cd /var/www/katalog-sekar/server
cp .env.example .env
openssl rand -hex 32
nano .env
```

Isi `JWT_SECRET` dengan hasil `openssl rand -hex 32` dan atur `INITIAL_ADMIN_EMAIL` serta `INITIAL_ADMIN_PASSWORD` memakai nilai unik. Jangan commit atau membagikan `server/.env`. Biarkan `SEED_DEMO_DATA=false` untuk memulai tanpa produk/kategori contoh.

Pasang dependensi dan build frontend:

```bash
cd /var/www/katalog-sekar/server
npm install --omit=dev
cd ../client
npm install
npm run build
```

Saat database baru pertama kali dibuat, API membuat akun admin dari variabel `INITIAL_ADMIN_*` dan mengisi pengaturan awal toko tanpa alamat atau nomor WhatsApp contoh. Setelah akun admin berhasil dibuat, hapus `INITIAL_ADMIN_PASSWORD` dari `server/.env`; variabel itu hanya dibutuhkan ketika database belum memiliki admin.

### Nginx dan cutover dari proses lama

Konfigurasi Nginx contoh tersedia di `deploy/katalog-sekar.nginx.conf`. Sebelum cutover, periksa `pm2 list`, `ss -ltnp`, dan `ls -l /etc/nginx/sites-enabled`. Jangan hapus seluruh proses PM2 atau nonaktifkan virtual host lain yang dipakai aplikasi berbeda.

Jika proses lama `katalog-server` memakai port 5000, hentikan hanya proses itu, lalu mulai API baru:

```bash
pm2 stop katalog-server
cd /var/www/katalog-sekar/server
pm2 start ecosystem.config.cjs --env production
curl http://127.0.0.1:5000/api/health
```

Pada VPS baru tanpa proses lama, lewati perintah `pm2 stop katalog-server` dan jalankan perintah `pm2 start` saja. Simpan PM2 setelah proses baru teruji dan proses lama yang relevan sudah dibersihkan.

Setelah API baru merespons, siapkan Nginx. Pastikan konfigurasi lain tidak memakai `default_server` port 80; periksa `ls -l /etc/nginx/sites-enabled` dan cadangkan konfigurasi lama sebelum menonaktifkan symlink default. Sebagai `root`:

```bash
cp /var/www/katalog-sekar/deploy/katalog-sekar.nginx.conf /etc/nginx/sites-available/katalog-sekar
ln -s /etc/nginx/sites-available/katalog-sekar /etc/nginx/sites-enabled/katalog-sekar
nginx -t
```

Setelah konfigurasi lolos, hentikan proses lama `katalog-sekar` yang menggunakan port 80, kemudian mulai/reload Nginx (`systemctl restart nginx` bila belum aktif, atau `systemctl reload nginx` bila sudah aktif). Uji `http://IP_VPS/` dan `http://IP_VPS/api/health`. Jangan hapus clone lama, database, atau upload sebelum instalasi baru terverifikasi.

Setelah kedua alamat berhasil dan proses baru sehat, hapus hanya proses lama yang sudah dipastikan tidak dipakai. Contoh untuk tiga proses lama pada VPS ini:

```bash
pm2 delete katalog-client katalog-sekar katalog-server
pm2 save
pm2 status
```

Pastikan `katalog-sekar-api` tetap `online` sebelum menghapus proses lama, dan jangan jalankan perintah `pm2 delete` ini jika salah satu nama dipakai aplikasi lain.

Situs tanpa domain dibuka melalui `http://IP_VPS/`. HTTP tidak mengenkripsi login; gunakan hanya untuk uji coba, bukan akun sungguhan.

### Update berikutnya

```bash
cd /var/www/katalog-sekar
git pull --ff-only
cd server && npm install --omit=dev
cd ../client && npm install && npm run build
cd ../server && pm2 restart katalog-sekar-api --update-env
```

Jangan masukkan database, upload, atau `.env` ke Git. Buat backup `/var/lib/katalog-sekar` secara terpisah.
