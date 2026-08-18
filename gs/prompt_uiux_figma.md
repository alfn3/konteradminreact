# Prompt UI/UX Figma: Mobilecell Admin Dashboard Re-design

**Tujuan**: Membuat desain ulang (redesign) UI/UX yang modern, premium, dan sangat fungsional untuk sistem informasi operasional toko handphone/konter (Mobilecell Admin).

**Target Platform**: Web Dashboard (Responsive: Desktop & Mobile). Mengingat admin/karyawan toko mungkin mengakses via HP, versi mobile-web harus sama baiknya dengan desktop.

---

## 1. Konsep & Style Guide (Design System)
- **Tema (Vibe)**: Modern SaaS, Clean, Minimalist, Data-centric, Premium (seperti Stripe atau Vercel dashboard).
- **Warna Utama**: 
  - **Primary**: Blue (#0D6EFD atau nuansa indigo/slate blue modern)
  - **Background**: Off-white atau light gray sangat terang (misal: #F8FAFC)
  - **Cards/Panels**: Pure White (#FFFFFF) dengan efek bayangan halus (soft drop shadow).
  - **Aksen Konter (Store Colors)**: Warna spesifik untuk membedakan konter: 
    - Toko M1 (Soft Blue)
    - Toko M2 (Soft Green)
    - Toko M3 (Soft Orange)
    - Toko M4 (Soft Red)
- **Tipografi**: Font modern tanpa kait (sans-serif) seperti *Inter*, *Plus Jakarta Sans*, atau *Outfit*.
- **UI Element**: Sudut melengkung (rounded corners - 8px hingga 12px), tombol dengan state interaktif (hover, active), dan efek micro-interaction.

---

## 2. Struktur Layout Global
- **Sidebar (Navigasi Kiri)**: 
  - Dapat di-collapse (dilipat).
  - Berisi menu: Dashboard, Data Stok Produk, Manajemen SDM (Karyawan & Jadwal), Data Konter, Log Aktivitas, Laporan Bulanan.
  - *(Catatan UX: Menu "Info Pusat" dilepas dari sidebar, dan "Data Karyawan" serta "Jadwal Jaga" digabung menjadi satu menu "Manajemen SDM")*.
  - State aktif pada menu (misal: background light blue dengan border kiri tebal).
- **Header (Navigasi Atas)**:
  - Global Search bar (opsional, untuk cari data/karyawan).
  - Ikon Notifikasi (Lonceng dengan badge merah). Menu dropdown notifikasi bergaya modern.
  - Profil User (Avatar inisial, nama, role) dengan menu dropdown (Pengaturan, Logout).
- **Main Content**: Area luas di kanan bawah header, dengan padding yang lega (breathable layout).

---

## 3. Layar yang Perlu Didesain (Screens to Generate)

### Screen 1: Halaman Login
- **Deskripsi**: Bersih, terpusat di tengah layar. Split screen (setengah gambar branding mobilecell/toko, setengah form login) atau form di tengah (centered card).
- **Elemen**: Logo, Input Username/Email, Input Password (dengan icon mata/unhide), Tombol "Masuk" yang menonjol, Lupa Password.

### Screen 2: Dashboard (Ringkasan Operasional)
- **Header Halaman**: Judul "Dashboard" dengan informasi Tanggal Hari Ini.
- **Kartu Statistik (Overview Cards)**: 3-4 kartu di bagian atas:
  - "Total Konter" (Icon toko)
  - "Karyawan Belum Absen" (Icon jam, indikator peringatan)
  - "Info Tayang" (Icon pengumuman)
- **Section Kinerja**: Grafik atau tabel ringkas "Performa Outlet Kemarin vs Hari Lalu".
- **Widget Info Pusat**: Panel khusus "Info Pusat / Pengumuman" yang dipindahkan ke halaman dashboard agar pengumuman langsung terbaca saat login, tanpa perlu masuk ke menu terpisah.
- **Widget Tambahan**: Menampilkan summary cepat dari laporan bulanan atau jadwal jaga hari ini.

### Screen 3: Manajemen Data Stok (Kompleks Data)
- **Fokus UX**: Mengelola banyak data tanpa terlihat berantakan.
- **Filter Bar**: 
  - Date Picker (Pilih Tanggal)
  - Dropdown Pilih Toko (M1, M2, M3, dll)
  - Badge info "Jaga: [Nama]" dan "Selisih: [Nominal]".
- **Navigasi Tab (Pills)**: Tab horizontal untuk kategori: *Perdana, Voucher, Aksesoris, Pengeluaran, Uang, Elektrik*.
- **Tabel Data (Premium Table)**:
  - Header tabel dengan background light-slate.
  - Kolom: Nama Produk, Awal, Topup, Akhir, Laku, Harga, Total, Aksi (Ikon edit/hapus).
  - Zebra striping yang sangat halus atau pemisah garis bawah tipis antar baris.
  - Baris melayang (hover effect) saat kursor diarahkan.

### Screen 4: Modal Dialog (Popup Input Data)
- **Deskripsi**: Desain popup (modal) saat admin mengklik tombol "Edit Stok" atau "Tambah Pengeluaran".
- **Elemen**: 
  - Overlay gelap berbayang.
  - Kartu popup putih di tengah dengan header warna (misal: biru untuk stok, merah untuk pengeluaran).
  - Form input rapi dengan label di atas (top-aligned labels).
  - Auto-calculated fields: (Misal input Stok Awal + Topup = otomatis memunculkan angka Stok Akhir).
  - Footer dengan tombol "Batal" dan "Simpan" (Primary).

### Screen 5: Manajemen SDM (Gabungan Data Karyawan & Jadwal Jaga)
- **Konsep Penyederhanaan UX**: Halaman ini adalah hasil peleburan dari menu lama "Validasi Karyawan" dan "Jadwal Jaga".
- **Tampilan**: Layout terpadu (misal: Split-view atau Tab layout). Satu area menampilkan profil karyawan dan status validasi, area lainnya menampilkan kalender jadwal shift (pagi/sore).
- **Elemen Card Jadwal**: Avatar karyawan, jam kerja, tag lokasi toko (dengan warna aksen toko). Saat Admin mengeklik avatar karyawan, popup detail profil/gaji akan muncul.

---

## 4. Interaksi & UX Notes (Untuk Designer)
- **Pencarian & Filter**: Pastikan setiap tabel memiliki kemampuan filter yang mudah dijangkau.
- **Feedback Visual**: Tambahkan desain untuk "Toast Notifications" (misal: "✅ Stok berhasil diupdate" muncul di pojok kanan atas).
- **Empty States**: Desain ilustrasi sederhana ketika data kosong (misal: "Belum ada laporan hari ini").
- **Aksesibilitas**: Kontras teks harus jelas (WCAG standard), ukuran klik (tap target) di mobile minimal 44x44px.

---
*Gunakan prompt ini pada AI UI Generator (seperti v0.dev, Uizard, Galileo AI) atau berikan kepada UI/UX Designer sebagai brief lengkap.*
