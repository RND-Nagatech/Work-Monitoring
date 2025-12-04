# WorkMonitor — Sistem Monitoring Pekerjaan Divisi

WorkMonitor adalah aplikasi web full-stack untuk mengelola divisi, pegawai, pengguna, dan tugas, lengkap dengan dashboard serta laporan yang bisa diekspor. Frontend dibangun dengan React + Vite + Tailwind (shadcn/ui), sedangkan backend menggunakan Express + TypeScript dengan MongoDB.

**Struktur repo**
```
ROOT/
	src/                 # Frontend (React + Vite)
	public/              # Aset publik frontend
	BACKEND/             # Backend (Express + TS)
		src/               # Kode sumber backend
```

## Fitur
- Master data: Divisi, Pegawai, Pengguna
- Akses berbasis peran: Admin, Manajer, Pegawai
- Siklus tugas: buat, ambil, selesai; deadline terdekat
- Dashboard Admin/Pegawai
- Laporan dengan filter; ekspor ke PDF dan Excel
- Otentikasi JWT; protected routes

## Teknologi
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, Axios, Recharts
- Backend: Node.js, Express, TypeScript, Mongoose (MongoDB), JWT

## Prasyarat
- Node.js 18+
- Instance MongoDB (lokal atau cloud)

## Setup
Instal dependensi untuk frontend dan backend:
```sh
cd "DIVISION TRACKER 4"
npm install
cd BACKEND
npm install
```

Konfigurasi environment backend (`BACKEND/.env`):
```sh
MONGODB_URI=mongodb://localhost:27017/workmonitor
JWT_SECRET=secret-yang-kuat
PORT=5000
```

## Pengembangan
Jalankan API backend:
```sh
cd BACKEND
npm run dev
```

Jalankan frontend:
```sh
cd ..
npm run dev
```

Frontend: `http://localhost:5173`, Backend: `http://localhost:5000`.

## Build
Build frontend:
```sh
npm run build
```
Output ke `dist/`.

Build backend:
```sh
cd BACKEND
npm run build
```
Output ke `BACKEND/dist/`.

## Panduan Penggunaan
- Masuk melalui `/login`.
- Admin/Manajer:
	- Kelola Master Divisi, Master Pegawai, Master Pengguna.
	- Buat/edit/hapus tugas; lihat laporan; ekspor PDF/Excel.
- Pegawai:
	- Lihat dan ambil tugas yang tersedia; tandai selesai.
	- Dashboard menampilkan deadline terdekat dan status tugas pribadi.

## Ringkasan API
- Auth: `POST /api/auth/login` — mengembalikan JWT.
- Divisi: `GET/POST/PUT/DELETE /api/divisions`
- Pegawai: `GET/POST/PUT/DELETE /api/employees`
- Pengguna: `GET/POST/PUT/DELETE /api/users`
- Tugas:
	- `GET /api/tasks` (admin/manajer)
	- `GET /api/tasks/available` (pegawai)
	- `POST /api/tasks` — buat tugas
	- `PUT /api/tasks/:id` — ubah tugas
	- `DELETE /api/tasks/:id` — hapus tugas
	- `POST /api/tasks/:id/take` — ambil/assign ke pengguna saat ini
	- `POST /api/tasks/:id/finish` — tandai selesai
- Laporan: `GET /api/reports` — mendukung filter `division`, `start`, `end`, dan mode ranking `filter=top_points|top_tasks`.

## Konvensi Frontend
- Komponen UI shadcn; tombol aksi utama gunakan `variant="brand"` (hitam) dengan `rounded-full`.
- Rounding global melalui `--radius: 16px` di `src/index.css`.
- Heading menggunakan `font-heading` (Plus Jakarta Sans); body menggunakan Inter (`font-sans`).
- Gunakan `src/services/api.ts` untuk panggilan HTTP (Axios).

## Styling & Theming
- Token desain di `src/index.css`; konfigurasi Tailwind di `tailwind.config.ts`.
- Sidebar: gradient gelap; tile logo menggunakan gradient slate gelap.
- Chart dan badge mengikuti palet brand.

## Troubleshooting
- Jika gaya tidak ter-update, bersihkan cache Vite:
```sh
rm -rf node_modules/.vite
```
- Pastikan MongoDB berjalan dan `MONGODB_URI` benar.
- Periksa pengaturan CORS jika panggilan API dari frontend gagal.

## Deployment
- Sajikan frontend `dist/` di host statis (Vercel, Netlify, nginx).
- Jalankan backend dengan Node (disarankan PM2/Docker); set env dengan aman.

## Kontribusi
- Jaga perubahan tetap fokus; ikuti pola yang ada.
- Perbarui dokumentasi saat API atau konvensi UI berubah.
- Rahasia (secret) diabaikan melalui `.gitignore`.

## Lisensi
Proprietary — penggunaan internal WorkMonitor.
