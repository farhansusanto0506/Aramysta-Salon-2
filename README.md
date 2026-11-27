# Aramysta Salon

Website portofolio statis Aramysta Salon (Probolinggo). Tanpa backend: cukup buka `index.html`, atau upload isi folder ini ke hosting statis (GitHub Pages, Netlify, dll).

- `index.html` – seluruh konten halaman
- `style.css` – tampilan (hasil compile Tailwind, sudah jadi)
- `script.js` – carousel, navbar, animasi, filter, dan form reservasi WhatsApp
- `images/` – logo, foto hero, paket layanan, dan karya

## Mengubah konten

- **Tambah karya:** di `index.html`, cari `Cara menambah karya` dan ikuti contoh kartu di sana.
- **Tanggal penuh / diblokir:** di `index.html`, ubah atribut `data-booked-schedules` pada `id="waBookingWrapper"`.
  Format: `{"2026-12-01":[{"type":"full","start_time":"06:00","note":"Pengantin"}]}` (`type`: `full` atau `blocked`).
- **Nomor WhatsApp:** atribut `data-wa-number` di elemen yang sama.

Catatan: `style.css` hanya berisi class Tailwind yang sudah dipakai. Class Tailwind baru tidak otomatis berfungsi; tulis CSS biasa di `style.css` atau pakai class yang sudah ada.

Versi Laravel (dengan admin) masih ada di riwayat git, commit `489b4d3`.
