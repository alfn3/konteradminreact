# Panduan Deployment (React ke Google Apps Script)

Karena Google Apps Script (GAS) tidak mendukung hosting multiple file static (JS/CSS terpisah), kita menggunakan Vite Plugin Singlefile untuk membundel (bundle) seluruh aplikasi React ke dalam satu file `index.html`.

Berikut adalah langkah-langkah untuk melakukan build dan deploy:

## 1. Build Aplikasi (Local)
Buka terminal/command prompt di dalam folder `frontend`, lalu jalankan:

```bash
npm run build
```

Ini akan menghasilkan sebuah folder `dist` yang berisi SATU file saja: `index.html`. File ini memuat seluruh HTML, CSS, dan Javascript aplikasi Anda.

## 2. Deploy ke Google Apps Script

Ada dua cara untuk memindahkan file ini ke GAS:

### Cara A: Manual (Copy-Paste)
1. Buka file `frontend/dist/index.html` menggunakan text editor (seperti Notepad atau VS Code).
2. Copy (Salin) seluruh isinya.
3. Buka editor Google Apps Script Anda di browser.
4. Buat file HTML baru bernama `index.html` (hapus jika sudah ada file Index.html lama).
5. Paste (Tempel) kode yang tadi disalin ke dalam file `index.html` tersebut.
6. Simpan, lalu lakukan **Deploy > New Deployment** (atau Manage Deployments) untuk memperbarui versi Web App Anda.

### Cara B: Otomatis menggunakan CLASP (Direkomendasikan)
CLASP adalah *Command Line Apps Script Projects* buatan Google.

1. Install Clasp secara global:
   ```bash
   npm install -g @google/clasp
   ```
2. Login ke akun Google Anda:
   ```bash
   clasp login
   ```
3. Di dalam folder `adminmobilecell` (root), inisialisasi clasp:
   ```bash
   clasp clone "ID_SCRIPT_ANDA"
   ```
   *(Ganti ID_SCRIPT_ANDA dengan ID yang ada di URL editor script Anda).*
4. Setiap kali Anda selesai melakukan `npm run build` di folder frontend, Anda bisa membuat script node sederhana untuk memindahkan `dist/index.html` ke root proyek, lalu jalankan:
   ```bash
   clasp push
   ```
   
Ini akan otomatis memperbarui kode di Google Apps Script tanpa harus copy-paste manual.
