# PrintA4 Studio 📸

Aplikasi desktop lokal berbasis web modern untuk membuat template cetak foto segala ukuran (Pas Foto, Polaroid, Foto Standar 2R-4R, hingga Ukuran Kustom) di atas lembar kertas A4 secara presisi 100% akurat sesuai ukuran fisik centimeter.

Dirancang untuk berjalan **100% offline** di lingkungan Linux, mendukung integrasi Tauri, serta dapat dideploy secara statis ke **Cloudflare Pages** tanpa biaya server.

---

## 🚀 Fitur Utama

- **Preset Ukuran Lengkap**:
  - **Pas Foto Resmi**: 2x3 cm, 3x4 cm, 4x6 cm.
  - **Template Polaroid**: Polaroid Mini (5.4x8.6 cm), Polaroid Klasik (8.8x10.7 cm), Polaroid Square (7.2x8.6 cm), Polaroid Wide (10.8x8.6 cm).
  - **Foto Standar**: 2R (6x9 cm), 3R (8.9x12.7 cm), 4R (10.2x15.2 cm).
  - **Kustom / Bebas**: Tentukan dimensi lebar & tinggi sendiri dalam centimeter.
- **Dukungan Kertas Sisa Cetak (Scrap / Offcut A4 Paper)**:
  - Memanfaatkan potongan sisa kertas dari cetakan sebelumnya untuk menghemat kertas tanpa membuang lembar A4 baru.
  - **Pilihan Preset Potongan Sisa**:
    - *Sisa 1/2 A4 (A5 Melintang)*: 14.8 × 21.0 cm (50% luas A4).
    - *Sisa 1/2 A4 (Strip Memanjang)*: 10.5 × 29.7 cm (50% luas A4).
    - *Sisa 1/3 A4 (Brosur / Strip)*: 9.9 × 21.0 cm (33% luas A4).
    - *Sisa 1/4 A4 (A6 / Kartu Pos)*: 10.5 × 14.8 cm (25% luas A4).
    - *Sisa Potongan Foto 4R*: 10.2 × 15.2 cm (offcut standar cetak foto).
    - *Sisa Strip Photobooth*: 5.0 × 15.0 cm.
  - **Kustom Ukuran Sisa Bebas**: Masukkan lebar dan tinggi (cm/mm) potongan kertas sisa Anda dengan pembatasan fisik ketat (tidak boleh melebihi ukuran fisik lembar A4, maks. $21.0 \times 29.7$ cm).
  - **Visual Diagram A4**: Menampilkan ilustrasi proporsi potongan sisa terhadap lembar A4 penuh beserta persentase efisiensi luas kertas.
- **Dua Mode Tata Letak**:
  - *Mode Otomatis (Auto-Flow Grid)*: Foto tersusun berurutan secara efisien dan rapi.
  - *Mode Bebas (Freeform Canvas)*: Geser dan letakkan foto di posisi mana saja dengan mouse.
  - *Snap-to-Grid*: Perekat otomatis ke kisi centimeter (0.1, 0.2, 0.5, 1.0 cm) dengan visualisasi garis bantu.
- **Peralatan Sunting Individual per Foto**:
  - Zoom & Pan (geser horizontal & vertikal).
  - Rotasi bebas (0°, 90°, 180°, 270°) dengan penyesuaian rasio aspek tanpa terpotong (*zero-clipping*).
  - Penyesuaian Kecerahan (*Brightness*), Kontras (*Contrast*), dan Saturasi Warna (*Saturation* 0% - 200%).
  - Ganti warna latar pas foto (Merah/Biru/Putih/Abu) & filter Hitam-Putih (B&W).
  - Kustomisasi tulisan memo polaroid dengan gaya huruf *Cursive*, *Modern Sans*, dan *Retro Typewriter*.
- **Riwayat Undo & Redo Lengkap**:
  - Dukungan tombol UI dan pintasan keyboard (`Ctrl + Z` dan `Ctrl + Y`).
  - Fitur **Kosongkan Canvas Cepat** (`Shift + Delete` / `Alt + Backspace`) dilengkapi tombol *Urungkan (Undo)* instan pada notifikasi.
- **Sistem Cetak & Ekspor Multi-Metode**:
  - **Cetak Langsung**: Menggunakan CSS `@media print` presisi 1:1 tanpa sidebar dan bebas margin kotor.
  - **Ekspor Siap Cetak (300 DPI Ultra High-Res PNG)**: Merender lembar A4 ke file gambar studio ($2480 \times 3508$ piksel) menggunakan HTML5 Canvas lokal sehingga dijamin bebas distorsi peramban.

---

## 🛠️ Panduan Instalasi & Menjalankan dengan Bun

Proyek ini menggunakan [Bun](https://bun.sh) sebagai JavaScript runtime dan package manager.

### 1. Pasang Dependensi
```bash
bun install
```

### 2. Jalankan Server Pengembangan (Dev Mode)
```bash
bun run dev
```
Buka peramban di `http://localhost:3000`.

### 3. Build untuk Produksi
```bash
bun run build
```
File siap saji akan dikompilasi ke dalam direktori `dist/`.

### 4. Pratinjau Build Produksi
```bash
bun run preview
```

### 5. Cek Linting & Tipe TypeScript
```bash
bun run lint
```

---

## ☁️ Panduan Deploy ke Cloudflare Pages dengan Bun

Karena aplikasi ini adalah Single Page Application (SPA) murni tanpa backend runtime, Anda dapat mendeploynya ke Cloudflare Pages secara gratis.

### Opsi A: Menggunakan Git (GitHub / GitLab)
1. Push repositori Anda ke GitHub/GitLab.
2. Di dashboard **Cloudflare Pages**, pilih **Create a project** > **Connect to Git**.
3. Atur konfigurasi build berikut:
   - **Framework preset**: `Vite`
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
4. Tambahkan Environment Variable di Cloudflare Pages:
   - Variable name: `BUN_VERSION`
   - Value: `latest` (atau contoh: `1.1.20`)
5. Klik **Save and Deploy**.

> **Catatan Routing SPA**: File `public/_redirects` telah disertakan otomatis sehingga routing tidak akan mengalami *error 404* saat halaman di-refresh.

---

### Opsi B: Deploy Langsung Menggunakan Bun & Wrangler CLI
Anda dapat melakukan build dan deploy langsung dari terminal Linux:

1. Buat build aplikasi:
   ```bash
   bun run build
   ```

2. Deploy folder `dist` menggunakan Wrangler via `bunx`:
   ```bash
   bunx wrangler pages deploy dist --project-name=printa4-studio
   ```

---

## 🖨️ Tips Pencetakan Presisi Skala Fisik (100% Akurat di Linux / CUPS)

Agar ukuran foto di atas kertas A4 tepat sesuai centimeter aslinya saat dicetak ke printer fisik:

1. **Ukuran Kertas**: Wajib pilih **A4** (210 x 297 mm).
2. **Skala (Scale)**: Wajib pilih **100%** atau **Actual Size / Default**. Jangan gunakan opsi *"Fit to Page"* (*Sesuaikan dengan halaman*), karena peramban akan mengecilkan cetakan sebesar beberapa persen.
3. **Margin**: Pilih **None** (Tanpa Margin) atau **Minimum**.
4. **Grafis Latar Belakang (Background Graphics)**: Centang opsi ini agar warna latar belakang merah/biru pas foto tercetak sempurna.
5. **Alternatif Terbaik untuk Pengguna Linux**: Gunakan opsi **"Unduh Lembar Siap Cetak (300 DPI)"** dari tombol Cetak aplikasi, lalu buka file gambar PNG menggunakan image viewer bawaan Linux (Eye of GNOME / Gwenview) dan cetak langsung dengan setelan kertas A4 skala 100%.

---

## 📄 Lisensi
Apache-2.0
