// =========================================
// KONFIGURASI ID FILE
// =========================================
const FILES = {
  ADMIN: '1iz7B7MzBqIU4u72N4SyoeOA0NTA4EiNnYSIHE8hDpV0', // ID Spreadsheet Anda
  STOK:  '1m3Kzzw0H84NVxBXmhIvcrQDQ6q2MmciTmbwV_cqKtJY',
};

const LOG_CONFIG = {
  FOLDER_ARCHIVE_ID: '1tM_fDGSVOjJa_E_00nFS73PT18u1XLsd', // Ganti dengan ID Folder GDrive Anda
  SHEET_NAME: 'log',
  RETENTION_DAYS: 2
};

// =========================================
// --- FUNGSI UTAMA (DO GET) ---
// =========================================
function doGet(e) {
  return ContentService.createTextOutput("API MobileCell Aktif dan Berjalan Normal.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// =========================================
// --- API DASHBOARD (UPDATE TAMPILAN HARI) ---
// =========================================

function getDashboardStats() {
  try {
    const ssAdmin = SpreadsheetApp.openById(FILES.ADMIN);
    
    // 1. SETUP TANGGAL
    const today = new Date();
    
    // Kemarin (Current)
    const dateYst = new Date(today);
    dateYst.setDate(today.getDate() - 1);
    
    // Bulan Lalu (Compare) - Samakan Hari
    const datePrev = new Date(dateYst);
    datePrev.setMonth(datePrev.getMonth() - 1);
    const diff = dateYst.getDay() - datePrev.getDay();
    datePrev.setDate(datePrev.getDate() + diff);

    // --- PENTING: PISAHKAN FORMAT SEARCH DAN DISPLAY ---
    
    // 1. Format untuk SEARCH File ID (Sesuai Sheet file30h: "1 November 2025")
    const strYstSearch = formatDateIndo(dateYst); 
    const strPrevSearch = formatDateIndo(datePrev);

    // 2. Format untuk DISPLAY Dashboard (Lengkap: "Jumat, 1 November 2025")
    const strYstDisplay = formatDateIndoFull(dateYst); 
    const strPrevDisplay = formatDateIndoFull(datePrev);

    // ---------------------------------------------------
    // ---------------------------------------------------

    // Cari ID pakai Format Search
    const idYst = findFileId(ssAdmin, "file30h", strYstSearch);
    const idPrev = findFileId(ssAdmin, "file30h_before", strPrevSearch);
      
    // TAMBAHAN: Ambil data dari data_bulanan_before untuk breakdown omset shift
    let dataBulananBefore = [];
    const sheetBulananBefore = ssAdmin.getSheetByName("data_bulanan_before");
    if (sheetBulananBefore) {
       dataBulananBefore = sheetBulananBefore.getDataRange().getDisplayValues();
    }
    
    // Cari baris yang cocok dengan strPrevSearch
    let rowBulananBefore = null;
    for (let i = 0; i < dataBulananBefore.length; i++) {
       if (dataBulananBefore[i][0] === strPrevSearch) {
          rowBulananBefore = dataBulananBefore[i];
          break;
       }
    }

    // Laporan Kemarin & Total
    const reportKemarin = [];
    let totalOmsetNow = 0;
    let totalMarginNow = 0;
    let totalOmsetPrev = 0;
    let totalMarginPrev = 0;

    // ... (Bagian Data Konter, Absen, Info BIARKAN SAMA) ...
    const sheetKonter = ssAdmin.getSheetByName("konter_list");
    const rawKonter = sheetKonter ? sheetKonter.getRange("A2:B").getValues().filter(r => r[0]) : [];
    const totalKonter = rawKonter.length;
    const listKonter = rawKonter.map(r => ({ nama: r[0], sheet: r[1] || r[0] })); 

    const sheetVal = ssAdmin.getSheetByName("validasi");
    const dataVal = sheetVal ? sheetVal.getDataRange().getValues() : [];
    let belumAbsen = 0;
    const now = new Date(); const hour = now.getHours(); 
    const isPagi = (hour >= 6 && hour < 16); const isSore = (hour >= 16 && hour < 22);
    for(let i=1; i<dataVal.length; i++) {
      const shift = String(dataVal[i][2]).toLowerCase();
      const status = String(dataVal[i][4]).toLowerCase();
      const absen = String(dataVal[i][5]);
      if(status.includes('aktif') && (absen === '' || absen === '-')) {
         if (isPagi && (shift === 'pagi' || shift === 'full')) belumAbsen++;
         else if (isSore && (shift === 'sore' || shift === 'full')) belumAbsen++;
      }
    }

    const sheetInfo = ssAdmin.getSheetByName("info_pusat");
    const dataInfo = sheetInfo ? sheetInfo.getDataRange().getValues() : [];
    let infoAktif = 0;
    for(let i=1; i<dataInfo.length; i++) {
       const st = String(dataInfo[i][2]).toUpperCase().trim();
       if(st === 'TRUE' || st === 'ON' || st === 'AKTIF') infoAktif++;
    }

    if (idYst) {
      try {
        const ssStok = SpreadsheetApp.openById(idYst);
        let ssPrev = null;
        if (idPrev) {
          try { ssPrev = SpreadsheetApp.openById(idPrev); } catch(e) {}
        }

        listKonter.forEach(knt => {
          const namaToko = knt.nama;
          const targetSheet = knt.sheet;
          
          const sh = ssStok.getSheetByName(targetSheet);
          let jaga = "-";
          let selisih = 0;
          let omset = 0;
          let margin = 0;

          if (sh) {
             try { jaga = sh.getRange("Q35").getDisplayValue() || "-"; } catch(e) {}
             try { selisih = Number(String(sh.getRange("N44").getDisplayValue()).replace(/[^0-9-]/g, '')) || 0; } catch(e) {}
             try { omset = Number(String(sh.getRange("N38").getDisplayValue()).replace(/[^0-9-]/g, '')) || 0; } catch(e) {}
             try { margin = Number(String(sh.getRange("O38").getDisplayValue()).replace(/[^0-9-]/g, '')) || 0; } catch(e) {}
          }
          
          // Data Prev per toko
          let omsetPrev = 0;
          let marginPrev = 0;
          if (ssPrev) {
            const shPrev = ssPrev.getSheetByName(targetSheet);
            if (shPrev) {
               try { omsetPrev = Number(String(shPrev.getRange("N38").getDisplayValue()).replace(/[^0-9-]/g, '')) || 0; } catch(e) {}
               try { marginPrev = Number(String(shPrev.getRange("O38").getDisplayValue()).replace(/[^0-9-]/g, '')) || 0; } catch(e) {}
            }
          }
            
                      if (rowBulananBefore) {
               const nm = namaToko.toUpperCase();
               let cIdx = -1;
               if (nm.includes("M1")) cIdx = 66; // Index M1 Pagi (kolom BO)
               else if (nm.includes("M2")) cIdx = 68; // Index M2 Pagi
               else if (nm.includes("TOKO") || nm.includes("PUSAT")) cIdx = 70; // Index Toko Pagi
               else if (nm.includes("M4")) cIdx = 72; // Index M4 Pagi
               else if (nm.includes("JAYA")) cIdx = 74; // Index Jaya Pagi
               
               if (cIdx !== -1) {
                  const oPagi = Number(String(rowBulananBefore[cIdx]).replace(/[^0-9-]/g, '')) || 0;
                  const oSore = Number(String(rowBulananBefore[cIdx+1]).replace(/[^0-9-]/g, '')) || 0;
                  
                  // Ganti nilai omsetPrev berdasarkan shift konter
                  if (nm.includes("PAGI")) {
                     omsetPrev = oPagi;
                  } else if (nm.includes("SORE")) {
                     omsetPrev = oSore;
                  } else {
                     omsetPrev = oPagi + oSore; // Jika bukan shift spesifik, totalkan
                  }
               }
          }

          totalOmsetNow += omset;
          totalMarginNow += margin;
          totalOmsetPrev += omsetPrev;
          totalMarginPrev += marginPrev;

          reportKemarin.push({
            toko: namaToko,
            jaga: jaga,
            selisih: selisih,
            omset: omset,
            margin: margin,
            omsetPrev: omsetPrev, // Data Bulan Lalu (Sudah spesifik shift)
            marginPrev: marginPrev
          });
        });
      } catch (e) { reportKemarin.push({ error: true, msg: "Gagal" }); }
    }

    return {
      success: true,
      tglKemarin: strYstDisplay, // KIRIM FORMAT LENGKAP (ADA HARI)
      tglLalu: strPrevDisplay,   // KIRIM FORMAT LENGKAP (ADA HARI)
      stats: { konter: totalKonter, belumAbsen: belumAbsen, info: infoAktif },
      finance: {
        now: { omset: totalOmsetNow, margin: totalMarginNow },
        prev: { omset: totalOmsetPrev, margin: totalMarginPrev }
      },
      laporan: reportKemarin
    };

  } catch (e) {
    return { error: true, message: e.toString() };
  }
}

// =========================================
// --- HELPER FUNCTIONS (WAJIB ADA) ---
// =========================================

// 1. Fungsi Mencari ID File di Sheet file30h / file30h_before
function findFileId(ss, sheetName, dateStr) {
  const sheet = ss.getSheetByName(sheetName);
  if(!sheet) return null;
  
  const data = sheet.getDataRange().getDisplayValues(); // Col A=Tgl, B=Link
  
  // Loop cari tanggal
  for(let i=1; i<data.length; i++) {
    if(data[i][0] === dateStr) {
       let link = data[i][1];
       // Ambil ID jika bentuknya URL
       if(link.includes("/d/")) return link.split("/d/")[1].split("/")[0];
       return link;
    }
  }
  return null;
}

// 2. Fungsi Mengambil Data Keuangan (Omset & Margin) dari File Harian
function getFinancialMap(fileId) {
  let map = {};
  
  // Jika ID tidak ada (misal data bulan lalu tgl tersebut belum ada)
  if(!fileId) return map;

  try {
    const ss = SpreadsheetApp.openById(fileId);
    const sheet = ss.getSheetByName("data bulanan");
    
    if(sheet) {
       // Ambil Baris 39 (Total Harian)
       // Range B39:AE39 (30 Kolom)
       const vals = sheet.getRange("B39:AE39").getValues()[0];
       
       // Mapping Index Toko (Berdasarkan urutan kolom di sheet Data Bulanan)
       // M1=0, M2=1, M3=2, M4=3, Jaya=4
       const keys = ["m1", "m2", "m3", "m4", "jayacell"]; 
       
       keys.forEach((k, idx) => {
          // Hitung Total Omset (P&V + Acc + Elk)
          // P&V(0-4), Acc(5-9), Elk(10-14)
          const omset = (Number(vals[idx])||0) + (Number(vals[idx+5])||0) + (Number(vals[idx+10])||0);
          
          // Hitung Total Margin
          // P&V(15-19), Acc(20-24), Elk(25-29)
          const margin = (Number(vals[idx+15])||0) + (Number(vals[idx+20])||0) + (Number(vals[idx+25])||0);
          
          map[k] = { omset: omset, margin: margin };
       });
    }
  } catch(e) {
    // Jika file terhapus / tidak bisa akses, biarkan map kosong
    Logger.log("Error getFinancialMap: " + e.toString());
  }
  
  return map;
}

// 3. Format Tanggal Indo (Untuk Pencarian ID)
function formatDateIndo(dateObj) {
  const bln = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${dateObj.getDate()} ${bln[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// 4. Format Tanggal Indo Lengkap dengan Hari (Untuk Tampilan Dashboard)
function formatDateIndoFull(dateObj) {
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bln = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  
  return `${hari[dateObj.getDay()]}, ${dateObj.getDate()} ${bln[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// =========================================
// --- FUNGSI API DATA (READ) ---
// =========================================
// ... (Bagian atas Code.gs tetap sama) ...


function getDataValidasi() {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheetValidasi = ss.getSheetByName("validasi");
    const sheetKonter   = ss.getSheetByName("konter_list"); // Pastikan nama sheet ini benar
    
    // Cek keberadaan sheet
    if (!sheetValidasi) return { error: true, message: "Sheet 'validasi' tidak ditemukan." };
    if (!sheetKonter) return { error: true, message: "Sheet 'konter_list' tidak ditemukan." };

    // Ambil semua data
    const dataValidasi = sheetValidasi.getDataRange().getDisplayValues();
    const dataKonter   = sheetKonter.getDataRange().getDisplayValues();
    
    // --- PENTING: HAPUS HEADER ---
    // Hapus baris pertama (Header) dari data Validasi agar tidak muncul di tabel
    if (dataValidasi.length > 0) {
      dataValidasi.shift(); 
    }

    // Hapus baris pertama (Header) dari data Konter (misal: header "Nama Konter")
    if (dataKonter.length > 0) {
      dataKonter.shift(); 
    }

    // --- AMBIL OPSI DROPDOWN ---

    // 1. List Konter: Diambil dari Kolom A (Index 0) sheet 'konter_list'
    // Menggunakan Set untuk memastikan tidak ada nama konter ganda
    const rawKonter = dataKonter.map(row => row[0]); 
    const listKonter = [...new Set(rawKonter)].filter(String).sort(); 
    
    // 1b. Map Warna Konter: Kolom A -> Kolom D (Index 3)
    const konterColors = {};
    dataKonter.forEach(row => {
      if(row[0] && row[3]) {
        konterColors[row[0].trim()] = row[3];
      }
    });

    // 2. List Shift (Manual / Hardcoded sesuai request)
    const listShift = ["pagi", "sore", "full"]; 

    // 3. List Status (Manual / Hardcoded sesuai request)
    // Catatan: Pastikan logika warna di JavaScript.html sesuai dengan kata-kata ini
    const listStatus = ["aktif", "tidak aktif"]; 

    return { 
      success: true, 
      data: dataValidasi, // Data untuk isi tabel
      options: {
        shift: listShift,
        konter: listKonter,
        konterColors: konterColors,
        status: listStatus
      }
    };

  } catch (e) {
    return { error: true, message: e.toString() };
  }
}

// ... (Fungsi editDataValidasi & hapusDataValidasi biarkan sama) ...

// 2. UPDATE (Edit Data)
function editDataValidasi(formData) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("Validasi");
    
    // Hitung baris (Index array + 2 karena ada header)
    const row = parseInt(formData.index) + 2;
    
    // Update kolom spesifik (Nama=2, Shift=3, Konter=4, Status=5)
    // Ingat: Di script kolom mulai dari 1.
    sheet.getRange(row, 2).setValue(formData.nama);
    sheet.getRange(row, 3).setValue(formData.shift);
    sheet.getRange(row, 4).setValue(formData.konter);
    sheet.getRange(row, 5).setValue(formData.status);
    
    // Ubah warna baris jika status berubah (Visual)
    if(formData.status === 'aktif') sheet.getRange(row, 1, 1, 6).setBackground('#d1e7dd');
    else if(formData.status === 'tidak aktif') sheet.getRange(row, 1, 1, 6).setBackground('#f8d7da');
    else sheet.getRange(row, 1, 1, 6).setBackground(null);

    return "Data berhasil diperbarui.";
  } catch (e) {
    throw new Error(e.toString());
  }
}

// 3. DELETE (Hapus Data)
function hapusDataValidasi(index) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("Validasi");
    
    // Hitung baris (Index array + 2)
    const row = parseInt(index) + 2;
    
    sheet.deleteRow(row);
    
    return "Data berhasil dihapus.";
  } catch (e) {
    throw new Error(e.toString());
  }
}

// ... (Bagian atas file tetap sama) ...

// =========================================
// --- API KHUSUS KONTER LIST ---
// =========================================

// 1. READ
function getDataKonterList() {
  const ss = SpreadsheetApp.openById(FILES.ADMIN);
  const sheet = ss.getSheetByName("konter_list");
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length > 0) data.shift(); // Hapus Header
  return { success: true, data: data };
}

// 2. CREATE (TAMBAH DATA BARU)
function tambahKonterList(formData) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("konter_list");
    
    // Susun data baris baru
    // Urutan Kolom (Sesuai header): 
    // [0]namakonter, [1]namasheet, [2]alamat, [3]warna
    
    const newRow = [
      formData.konter,
      formData.namaSheet,
      formData.alamat,
      formData.warnaKonter
    ];

    sheet.appendRow(newRow);
    return "Berhasil menambahkan Konter baru.";
  } catch (e) {
    throw new Error(e.toString());
  }
}

// 3. EDIT (HANYA KOLOM TERTENTU)
function editKonterList(formData) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("konter_list");
    const row = parseInt(formData.index) + 2;

    // Update Kolom 1-4
    sheet.getRange(row, 1).setValue(formData.konter);
    sheet.getRange(row, 2).setValue(formData.namaSheet);
    sheet.getRange(row, 3).setValue(formData.alamat);
    sheet.getRange(row, 4).setValue(formData.warnaKonter);

    return "Data Konfigurasi Konter diperbarui.";
  } catch (e) {
    throw new Error(e.toString());
  }
}

// 4. HAPUS
function hapusKonterList(index) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("konter_list");
    sheet.deleteRow(parseInt(index) + 2);
    return "Data Konter dihapus.";
  } catch (e) {
    throw new Error(e.toString());
  }
}

// =========================================
// --- API KHUSUS INFO PUSAT ---
// =========================================

// 1. READ INFO
function getDataInfo() {
  const ss = SpreadsheetApp.openById(FILES.ADMIN);
  const sheet = ss.getSheetByName("info_pusat");
  if (!sheet) return { error: true, message: "Sheet 'info_pusat' tidak ditemukan." };
  
  // Ambil data termasuk header (untuk dihapus nanti)
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length > 0) data.shift(); // Hapus Header

  return { success: true, data: data };
}

// 2. TAMBAH INFO
function tambahDataInfo(form) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("info_pusat");
    
    // Urutan Kolom: [0]Tanggal, [1]Info Text, [2]Aktif
    // Kita format tanggal agar rapi (yyyy-mm-dd dari input date HTML sudah standar)
    sheet.appendRow([form.tanggal, form.info, form.aktif]);
    
    return "Info baru berhasil diposting.";
  } catch (e) { throw new Error(e.toString()); }
}

// 3. EDIT INFO
function editDataInfo(form) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("info_pusat");
    const row = parseInt(form.index) + 2;

    sheet.getRange(row, 1).setValue(form.tanggal);
    sheet.getRange(row, 2).setValue(form.info);
    sheet.getRange(row, 3).setValue(form.aktif);

    return "Info berhasil diperbarui.";
  } catch (e) { throw new Error(e.toString()); }
}

// 4. HAPUS INFO
function hapusDataInfo(index) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("info_pusat");
    sheet.deleteRow(parseInt(index) + 2);
    return "Info berhasil dihapus.";
  } catch (e) { throw new Error(e.toString()); }
}

// =========================================
// --- API NOTIFIKASI LOG (FILTER HARI INI) ---
// =========================================
function getLogNotifikasi() {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("log");
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    // Efisiensi: Ambil maksimal 200 baris terakhir saja
    // (Asumsi log hari ini ada di paling bawah)
    let numRows = Math.min(lastRow - 1, 200);
    let startRow = lastRow - numRows + 1;

    // Gunakan getDisplayValues() agar format tanggal terbaca sebagai teks "DD/MM/YYYY HH:mm:ss"
    const data = sheet.getRange(startRow, 1, numRows, 8).getDisplayValues();
    
    // 1. Dapatkan Tanggal Hari Ini (Format DD/MM/YYYY)
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Jan = 0
    const yyyy = now.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`; // Contoh: "05/12/2025"

    const result = [];

    // 2. Loop dari Bawah (Terbaru) ke Atas
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];
      const timestampStr = row[0]; // Contoh: "05/12/2025 14:30:00"
      
      if (timestampStr) {
         // Ambil bagian tanggal saja (sebelum spasi jam)
         const datePart = timestampStr.split(' ')[0];
         
         // Bandingkan String Tanggal
         if (datePart === todayStr) {
            result.push(row); // Masukkan jika hari ini
         } else {
            // Jika ketemu tanggal yang BUKAN hari ini (berarti data kemarin), BERHENTI.
            // Ini menghemat proses looping.
            break; 
         }
      }
    }
    
    return result; // Array log hari ini (Urutan: Terbaru di atas)

  } catch (e) {
    return [];
  }
}

function getDataLog(targetDate) {
  // targetDate dari HTML formatnya: "2025-11-20" (YYYY-MM-DD)
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("log");
    if (!sheet) return { error: true, message: "Sheet 'log' tidak ditemukan." };

    // Gunakan getDisplayValues() agar data diambil persis sbg Teks "20/11/2025 16:24:12"
    const data = sheet.getDataRange().getDisplayValues();
    
    // Hapus header
    if (data.length > 0) data.shift(); 

    const filteredData = [];
    
    // Loop data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const timestampStr = row[0]; // Contoh: "20/11/2025 16:24:12"
      
      if (!timestampStr) continue;

      // --- LOGIKA PARSING MANUAL ---
      // 1. Ambil bagian tanggal saja (sebelum spasi jam) -> "20/11/2025"
      const dateOnly = timestampStr.split(' ')[0]; 
      
      // 2. Pecah berdasarkan garis miring '/' -> ["20", "11", "2025"]
      const parts = dateOnly.split('/');
      
      if (parts.length === 3) {
        const day = parts[0];   // 20
        const month = parts[1]; // 11
        const year = parts[2];  // 2025
        
        // 3. Susun ulang menjadi format YYYY-MM-DD
        const formattedRowDate = `${year}-${month}-${day}`; // "2025-11-20"
        
        // 4. Bandingkan dengan Target
        if (formattedRowDate === targetDate) {
          // Jika cocok, masukkan data
          // Real Row = i + 2 (karena header row 1, dan i mulai 0)
          filteredData.push({
            realRow: i + 2,
            data: row 
          });
        }
      }
    }

    // Urutkan (Paling baru diatas)
    // Karena kita tidak pakai object Date, kita balik saja array-nya (asumsi log di sheet urut waktu)
    filteredData.reverse(); 

    return { success: true, data: filteredData };

  } catch (e) {
    return { error: true, message: e.toString() };
  }
}

// Fungsi updateLogKoreksi TETAP SAMA (tidak perlu diubah)
// Karena kita nanti mengirim 'realRow' dari hasil filter di atas.

// 2. UPDATE CHECKBOX KOREKSI
function updateLogKoreksi(index, isChecked) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("log");
    
    // Baris target (Index array + 2 karena header)
    const row = parseInt(index) + 2;
    
    // Kolom Koreksi ada di urutan ke-9 (Kolom I) berdasarkan header yang Anda sebutkan
    // Header: Timestamp, Email, Konter, Kategori, Produk, Komentar, Baru, Status, Koreksi
    const colKoreksi = 8; 

    // Ubah nilai menjadi TRUE atau FALSE (Boolean)
    sheet.getRange(row, colKoreksi).setValue(isChecked);

    return "Status koreksi diperbarui.";
  } catch (e) {
    throw new Error(e.toString());
  }
}

// Helper baru: parsing manual format "dd/MM/yyyy HH:mm:ss"
function parseLogTimestamp(str) {
  if (!str) return null;
  const [datePart, timePart] = String(str).trim().split(' ');
  const dp = datePart.split('/');
  if (dp.length !== 3) return null;

  const dd = parseInt(dp[0], 10);
  const mm = parseInt(dp[1], 10) - 1; // bulan JS mulai dari 0
  const yyyy = parseInt(dp[2], 10);

  let hh = 0, min = 0, ss = 0;
  if (timePart) {
    const tp = timePart.split(':');
    hh = parseInt(tp[0], 10) || 0;
    min = parseInt(tp[1], 10) || 0;
    ss = parseInt(tp[2], 10) || 0;
  }

  const d = new Date(yyyy, mm, dd, hh, min, ss);
  return isNaN(d.getTime()) ? null : d;
}

function autoExportAndCleanLog() {
  const ss = SpreadsheetApp.openById(FILES.ADMIN);
  const sheet = ss.getSheetByName(LOG_CONFIG.SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return; // hanya header

  const header = data[0];
  const rowsToArchive = [];
  const rowsToKeep = [header];

  // Batas hari kalender: sisakan RETENTION_DAYS hari terakhir (termasuk hari ini)
  const thresholdDate = new Date();
  thresholdDate.setHours(0, 0, 0, 0);
  thresholdDate.setDate(thresholdDate.getDate() - (LOG_CONFIG.RETENTION_DAYS - 1));

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestampStr = row[0];
    const logDate = parseLogTimestamp(timestampStr);

    // Jaga-jaga: kalau tanggal gagal di-parse, JANGAN dihapus (lebih aman disimpan)
    if (!logDate) {
      rowsToKeep.push(row);
      continue;
    }

    if (logDate < thresholdDate) {
      rowsToArchive.push(row);
    } else {
      rowsToKeep.push(row);
    }
  }

  if (rowsToArchive.length > 0) {
    const fileName = `Archive_Log_${Utilities.formatDate(thresholdDate, "GMT+7", "yyyy-MM-dd")}.csv`;
    const csvContent = arrayToCsv([header, ...rowsToArchive]);

    const folder = DriveApp.getFolderById(LOG_CONFIG.FOLDER_ARCHIVE_ID);
    folder.createFile(fileName, csvContent, MimeType.CSV);

    sheet.clear();
    sheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);

    console.log(`Berhasil mengarsipkan ${rowsToArchive.length} baris ke ${fileName}`);
  }
}

/**
 * FUNGSI IMPORT: Membaca file CSV dari Drive ke Sheet khusus "log_arsip"
 * @param {string} fileName - Nama file CSV di Drive
 */
function importArchiveToSheet(fileName) {
  try {
    const folder = DriveApp.getFolderById(LOG_CONFIG.FOLDER_ARCHIVE_ID);
    const files = folder.getFilesByName(fileName);
    
    if (!files.hasNext()) return "File tidak ditemukan.";
    
    const file = files.next();
    const csvData = Utilities.parseCsv(file.getBlob().getDataAsString());
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let archiveSheet = ss.getSheetByName("log_arsip");
    
    if (!archiveSheet) {
      archiveSheet = ss.insertSheet("log_arsip");
    }
    
    archiveSheet.clear();
    archiveSheet.getRange(1, 1, csvData.length, csvData[0].length).setValues(csvData);
    
    return `Berhasil mengimpor ${csvData.length} baris dari ${fileName}`;
  } catch (e) {
    return "Error: " + e.toString();
  }
}

// Helper: Ubah Array ke Format CSV string
function arrayToCsv(data) {
  return data.map(row => 
    row.map(cell => {
      let str = String(cell).replace(/"/g, '""'); // Escape double quotes
      return `"${str}"`;
    }).join(",")
  ).join("\r\n");
}

// =========================================
// --- SISTEM LOGIN ---
// =========================================
function checkLogin(form) {
  // Ganti Password Admin di sini
  const ADMIN_USER = "admin@mobilecell.com";
  const ADMIN_PASS = "admin1234"; 

  if (form.username === ADMIN_USER && form.password === ADMIN_PASS) {
    return { success: true };
  } else {
    return { success: false, message: "Username atau Password salah!" };
  }
}

// =========================================
// --- API KHUSUS DATA STOK (FINAL) ---
// =========================================

/**
 * Mengubah format YYYY-MM-DD (dari Input HTML) 
 * Menjadi format "D Month YYYY" (sesuai Sheet file30h)
 * Contoh: "2025-11-29" -> "29 November 2025"
 */
function convertDateToIndo(yyyymmdd) {
  if (!yyyymmdd) return "";
  
  const parts = yyyymmdd.split('-'); // Menjadi [2025, 11, 29]
  
  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const tahun = parts[0];
  const bulanIndex = parseInt(parts[1]) - 1; // Array mulai dari 0
  const tanggal = parseInt(parts[2]).toString(); // Ubah 01 jadi 1
  
  return `${tanggal} ${bulanIndo[bulanIndex]} ${tahun}`;
}

/**
 * Mencari ID Spreadsheet berdasarkan Tanggal di sheet 'file30h'
 * @param {string} dateString - Format YYYY-MM-DD
 * @return {string|null} ID Spreadsheet atau null jika tidak ketemu
 */
function getFileIdByDate(dateString) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN); // Pastikan FILES.ADMIN benar
    const sheet = ss.getSheetByName("file30h");
    
    if (!sheet) {
      Logger.log("Sheet 'file30h' tidak ditemukan");
      return null;
    }

    // Ubah format tanggal input agar cocok dengan tulisan di Excel
    const targetDateStr = convertDateToIndo(dateString);
    
    // Ambil semua data (DisplayValues agar format teks terbaca persis)
    const data = sheet.getDataRange().getDisplayValues();
    
    // Loop mulai baris ke-2 (Index 1) untuk melewati Header
    for (let i = 1; i < data.length; i++) {
      const rowDate = data[i][0]; // Kolom A: Tanggal
      const rowLink = data[i][1]; // Kolom B: Link / ID
      
      // Bandingkan Tanggal
      if (rowDate === targetDateStr) {
         
         // Jika Kolom B kosong, lewati
         if (!rowLink) continue;

         // EKSTRAKSI ID DARI URL
         // Jika isinya Link Lengkap: "https://docs.google.com/spreadsheets/d/1A2b3C.../edit"
         if (rowLink.includes("/d/")) {
           return rowLink.split("/d/")[1].split("/")[0];
         }
         
         // Jika isinya memang sudah ID murni: "1A2b3C..."
         return rowLink;
      }
    }
    
    return null; // Tidak ditemukan
  } catch (e) {
    Logger.log("Error di getFileIdByDate: " + e.toString());
    return null;
  }
}

function getDataStok(params) {
  try {
    let toko = "";
    let tanggalRequest = "";

    if (typeof params === 'object') {
      toko = params.toko;
      tanggalRequest = params.tanggal;
    } else {
      toko = params;
    }

    // --- LOGIKA PENENTUAN FILE ID & STATUS FILE ---
    let targetFileId = FILES.STOK; 
    let isHistoryMode = false; // Default: File Utama

    if (tanggalRequest) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      if (tanggalRequest !== todayStr) {
        const foundId = getFileIdByDate(tanggalRequest);
        if (foundId) {
          targetFileId = foundId;
          isHistoryMode = true; // Tandai ini sebagai file History
        } else {
          return { error: true, message: `Data tgl "${convertDateToIndo(tanggalRequest)}" tidak ditemukan.` };
        }
      }
    }

    const ss = SpreadsheetApp.openById(targetFileId);
    const sheet = ss.getSheetByName(toko);
    if (!sheet) return { error: true, message: `Sheet '${toko}' tidak ditemukan.` };

    const values = sheet.getDataRange().getDisplayValues(); 

    const processStok = (startRow, endRow) => {
       const res = [];
       let currentProvider = "";

       for (let i = startRow - 1; i < endRow; i++) {
         if (!values[i]) continue;
         const row = values[i];
         const colB = String(row[1] || "").trim(); // Provider
         const colC = String(row[2] || "").trim(); // Nama Produk
         const stokAwal = String(row[3] || "").trim();
         const topup = String(row[4] || "").trim();
         const stokAkhir = String(row[5] || "").trim();
         const harga = String(row[7] || "").trim();
         const stokGudang = String(row[27] || "").trim(); // Kolom AB
         
         // Baris dianggap sebagai HEADER KATEGORI/PROVIDER jika:
         // 1. Ada teks di colB atau colC
         // 2. Kolom data (Stok Awal, Topup, Stok Akhir, dan Harga) semuanya KOSONG MELOMPONG (bukan 0)
         const isHeader = (colB !== "" || colC !== "") && stokAwal === "" && topup === "" && stokAkhir === "" && harga === "";
         
         if (isHeader) {
             // Jika header ditulis di colB, pakai colB. Jika di colC, pakai colC.
             currentProvider = colB !== "" ? colB : colC;
             continue; // Skip, ini baris judul
         }
         
         // Jika bukan header, berarti ini baris item.
         // Jika baris ini punya colB dan colC sekaligus, berarti colB adalah provider khusus baris ini.
         if (colB !== "" && colC !== "") {
             currentProvider = colB;
         }
         
         const nama = colC !== "" ? colC : colB;
         if (nama && nama !== "") {
            res.push({ 
              realRow: i + 1, 
              provider: currentProvider || "-", 
              nama: nama, 
              stokAwal: stokAwal, 
              topup: topup, 
              stokAkhir: stokAkhir, 
              harga: harga,
              stokGudang: stokGudang
            });
         }
       }
       return res;
    };
    
    // Data Pengeluaran
    const dataPengeluaran = [];
    for (let i = 14; i <= 27; i++) { if(values[i]) dataPengeluaran.push({ row: i + 1, nominal: values[i][13], keterangan: values[i][17] }); }

    // Data Uang
    const dataUang = [];
    for (let i = 47; i <= 56; i++) { if(values[i]) dataUang.push({ row: i + 1, list: values[i][10] }); }

    // Data Elektrik
    const rowElektrik = values[64];
    const dataElektrik = [{
      realRow: 65,
      saldoAwal: rowElektrik ? rowElektrik[13] : 0,
      topup: rowElektrik ? rowElektrik[16] : 0,
      saldoAkhir: rowElektrik ? rowElektrik[18] : 0
    }];
    const valSelisih = values[43] ? values[43][13] : 0;
    const valInfoJaga = values[34] ? values[34][16] : "-";
    // ---------------------------------------------------------------------

    return { 
      success: true, 
      isHistory: isHistoryMode, // KIRIM STATUS FILE KE FRONTEND
      data: {
        perdana: processStok(3, 45),
        voucher: processStok(49, 130),
        acc: processStok(136, 307),
        pengeluaran: dataPengeluaran,
        uang: dataUang,
        elektrik: dataElektrik,
        selisih: valSelisih,
        infoJaga: valInfoJaga
      }
    };

  } catch (e) { return { error: true, message: e.toString() }; }
}

// =========================================
// --- FUNGSI UPDATE (SUPORT HISTORY FILE) ---
// =========================================

// Helper: Tentukan ID File berdasarkan tanggal yang dikirim Frontend
function getTargetFileId(tanggalRequest) {
  // 1. Cek Hari Ini
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Jika tanggal kosong ATAU hari ini, pakai file utama
  if (!tanggalRequest || tanggalRequest === todayStr) {
    return FILES.STOK;
  }

  // 2. Jika tanggal lampau, cari di file30h
  const foundId = getFileIdByDate(tanggalRequest);
  if (foundId) return foundId;
  
  throw new Error(`File stok untuk tanggal ${convertDateToIndo(tanggalRequest)} tidak ditemukan.`);
}

// 1. UPDATE STOK (Awal, Topup, DAN AKHIR)
function updateStokRow(params) {
  try {
    const targetId = getTargetFileId(params.tanggal); // Cek tanggal
    const ss = SpreadsheetApp.openById(targetId);
    const sheet = ss.getSheetByName(params.toko);
    
    // params.row = Real Row
    // Col D(4)=Awal, E(5)=Topup, F(6)=Akhir
    sheet.getRange(params.row, 4).setValue(params.stokAwal);
    sheet.getRange(params.row, 5).setValue(params.topup);
    sheet.getRange(params.row, 6).setValue(params.stokAkhir); // Sekarang bisa diedit

    return "Stok diperbarui";
  } catch (e) { throw new Error(e.toString()); }
}

// 1.5 BATCH UPDATE STOK (Awal, Topup, Akhir untuk banyak baris sekaligus)
function batchUpdateStok(params) {
  try {
    const targetId = getTargetFileId(params.tanggal); // Cek tanggal
    const ss = SpreadsheetApp.openById(targetId);
    const sheet = ss.getSheetByName(params.toko);
    
    let totalChanges = 0;
    let syncInfo = null;

    // params.updates = [{ row: 5, topup: 5, stokAkhir: 8 }, ...]
    // Hanya update kolom E (topup) dan F (stokAkhir)
    if (params.updates && Array.isArray(params.updates)) {
      params.updates.forEach(item => {
        if (item.topup !== undefined) {
          sheet.getRange(item.row, 5).setValue(item.topup);    // Kolom E = Topup
        }
        if (item.stokAkhir !== undefined) {
          sheet.getRange(item.row, 6).setValue(item.stokAkhir); // Kolom F = Stok Akhir
        }
      });
      totalChanges += params.updates.length;
    }

    // -----------------------------------------------
    // SINKRONISASI ANTAR HARI: stok akhir tanggal T -> stok awal tanggal T+1
    // Rantai: [x sore T] stok akhir -> [x pagi T+1] stok awal
    // x pagi T -> x sore T sudah dihandle rumus dalam file yang sama, tidak perlu sync
    // -----------------------------------------------
    if (params.updates && Array.isArray(params.updates) && params.updates.length > 0 && params.tanggal) {
      try {
        var tokoName = params.toko || '';
        var tokoLower = tokoName.toLowerCase();

        // Tentukan sheet target di T+1:
        // Jika sheet adalah "x sore" → target adalah "x pagi" di T+1
        // Jika sheet adalah "x pagi" → tidak ada sync antar hari (rumus menangani pagi→sore hari yang sama)
        // Jika sheet tidak punya suffix pagi/sore → sync ke sheet yang sama di T+1
        
        // 1. Ambil data konter_list dari ssAdmin
        const ssAdminSync = SpreadsheetApp.openById(FILES.ADMIN);
        const sheetKonterSync = ssAdminSync.getSheetByName("konter_list");
        const rawKonterSync = sheetKonterSync ? sheetKonterSync.getRange("A2:B").getValues().filter(r => r[0]) : [];
        const listKonterSync = rawKonterSync.map(r => ({ konterId: String(r[0]).toLowerCase().trim(), sheet: String(r[1] || r[0]).trim() }));
        
        // 2. Cari konterId berdasarkan tokoName (nama sheet saat ini)
        let currentKonterId = null;
        for (let i = 0; i < listKonterSync.length; i++) {
           if (listKonterSync[i].sheet === tokoName.trim()) {
              currentKonterId = listKonterSync[i].konterId;
              break;
           }
        }
        
        // Jika tidak ditemukan di konter_list, gunakan fallback lama
        if (!currentKonterId) currentKonterId = tokoLower;
        
        var targetSheetName = null;
        
        if (currentKonterId.indexOf('sore') !== -1) {
          // Ganti "sore" dengan "pagi" pada konterId
          const targetKonterId = currentKonterId.replace(/sore/gi, 'pagi').trim();
          
          // Cari sheet target berdasarkan targetKonterId
          for (let i = 0; i < listKonterSync.length; i++) {
             if (listKonterSync[i].konterId === targetKonterId) {
                targetSheetName = listKonterSync[i].sheet;
                break;
             }
          }
          
          // Fallback lama jika tidak ketemu
          if (!targetSheetName) {
            targetSheetName = tokoName.replace(/sore/gi, function(match) {
              return match[0] === match[0].toUpperCase() ? 'Pagi' : 'pagi';
            });
          }
          
        } else if (currentKonterId.indexOf('pagi') !== -1) {
          // Pagi → tidak perlu sync antar hari
          syncInfo = 'Sync antar hari dilewati (Murni Spreadsheet)';
          Logger.log('Skip sync: ' + tokoName + ' pagi dihandle rumus spreadsheet');
          // Lanjut tanpa sync
        } else {
          // Konter tanpa suffix pagi/sore → sync ke sheet yang sama di T+1
          targetSheetName = tokoName;
        }

        if (targetSheetName) {
          // Hitung tanggal T+1 dari params.tanggal
          const tDate = new Date(params.tanggal + 'T00:00:00');
          tDate.setDate(tDate.getDate() + 1);
          const t1yyyy = tDate.getFullYear();
          const t1mm = String(tDate.getMonth() + 1).padStart(2, '0');
          const t1dd = String(tDate.getDate()).padStart(2, '0');
          const nextDayStr = t1yyyy + '-' + t1mm + '-' + t1dd;

          // Cek apakah T+1 = hari ini
          const today = new Date();
          const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

          // Cari file T+1
          var nextDayFileId = null;
          if (nextDayStr === todayStr) {
            nextDayFileId = FILES.STOK;
          } else {
            nextDayFileId = getFileIdByDate(nextDayStr);
          }

          if (nextDayFileId) {
            const nextDaySs = SpreadsheetApp.openById(nextDayFileId);
            const nextDaySheet = nextDaySs.getSheetByName(targetSheetName);
            if (nextDaySheet) {
              params.updates.forEach(function(item) {
                if (item.stokAkhir !== undefined) {
                  nextDaySheet.getRange(item.row, 4).setValue(item.stokAkhir); // Kolom D = Stok Awal T+1
                }
              });
              // Log to admin log sheet
              try {
                const adminSsSync = SpreadsheetApp.openById(FILES.ADMIN);
                const logSheetSync = adminSsSync.getSheetByName("log");
                if (logSheetSync) {
                  const ts = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
                  logSheetSync.appendRow([
                    ts,
                    "Admin Web (Auto)",
                    targetSheetName.toUpperCase(),
                    "Sync Stok Awal",
                    `${params.updates.length} Baris Data`,
                    `Dari: ${tokoName} (${params.tanggal})`,
                    "Sukses",
                    false
                  ]);
                }
              } catch (e) {
                Logger.log("Gagal log sync: " + e);
              }
              Logger.log('Sync OK: ' + tokoName + ' stok akhir ' + params.tanggal + ' -> ' + targetSheetName + ' stok awal ' + nextDayStr);
              syncInfo = 'Berhasil sinkron ke ' + targetSheetName.toUpperCase() + ' tgl ' + nextDayStr;
            } else {
              Logger.log("Sheet target '" + targetSheetName + "' tidak ditemukan di file " + nextDayStr);
              syncInfo = "Gagal sync: Sheet " + targetSheetName.toUpperCase() + " tidak ditemukan di tgl " + nextDayStr;
            }
          } else {
            Logger.log('File T+1 (' + nextDayStr + ') tidak ditemukan di file30h, sync dilewati');
            syncInfo = "Gagal sync: File tgl " + nextDayStr + " belum tersedia";
          }
        }
      } catch (syncErr) {
        Logger.log('Gagal sinkronisasi stok awal: ' + syncErr.toString());
        syncInfo = "Error sync: " + syncErr.toString();
        // Jangan throw - gagal sync tidak menggagalkan simpan utama
      }
    }

    // params.updatesPengeluaran = [{ row: 15, nominal: 50000, keterangan: "Beli Makan" }, ...]
    if (params.updatesPengeluaran && Array.isArray(params.updatesPengeluaran)) {
      params.updatesPengeluaran.forEach(item => {
        sheet.getRange(item.row, 14).setValue(item.nominal);
        sheet.getRange(item.row, 18).setValue(item.keterangan);
      });
      totalChanges += params.updatesPengeluaran.length;
    }

    // params.updatesUang = [{ row: 48, list: 100000 }, ...]
    if (params.updatesUang && Array.isArray(params.updatesUang)) {
      params.updatesUang.forEach(item => {
        // Data Uang ada di Kolom K (11)
        // item.row berasal dari backend: i = 47 -> row 48
        // Let's ensure the row is correct. The frontend should send the correct row number (e.g. 48).
        sheet.getRange(item.row, 11).setValue(item.list);
      });
      totalChanges += params.updatesUang.length;
    }

    // params.updatesElektrik = [{ row: 65, saldoAwal: 100, topup: 50, saldoAkhir: 150 }]
    if (params.updatesElektrik && Array.isArray(params.updatesElektrik)) {
      params.updatesElektrik.forEach(item => {
        // N65(14), Q65(17), S65(19)
        sheet.getRange(item.row, 14).setValue(item.saldoAwal);
        sheet.getRange(item.row, 17).setValue(item.topup);
        sheet.getRange(item.row, 19).setValue(item.saldoAkhir);
      });
      totalChanges += params.updatesElektrik.length;
    }
      
    if (totalChanges > 0) {
      // Tambahkan Pencatatan ke Log Admin
      try {
         const adminSs = SpreadsheetApp.openById(FILES.ADMIN);
         const logSheet = adminSs.getSheetByName("log");
         if (logSheet) {
            const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
            const email = "Admin Web";
            const konter = params.toko.toUpperCase();

            let logsToAppend = [];
            
            // Stok
            if (params.updates && Array.isArray(params.updates)) {
              params.updates.forEach(item => {
                let updatesStr = [];
                if (item.topup !== undefined && item.topup !== '') updatesStr.push(`Topup:${item.topup}`);
                if (item.stokAkhir !== undefined && item.stokAkhir !== '') updatesStr.push(`Update:${item.stokAkhir}`);
                logsToAppend.push([
                  timestamp, email, konter,
                  item.kategori || "Stok",
                  item.produk || `Baris ${item.row}`,
                  updatesStr.join(", "),
                  "Sukses", false
                ]);
              });
            }

            // Pengeluaran
            if (params.updatesPengeluaran && Array.isArray(params.updatesPengeluaran)) {
              params.updatesPengeluaran.forEach(item => {
                let updatesStr = [];
                if (item.nominal !== undefined && item.nominal !== '') updatesStr.push(`Nominal:${item.nominal}`);
                if (item.keterangan !== undefined && item.keterangan !== '') updatesStr.push(`Ket:${item.keterangan}`);
                logsToAppend.push([
                  timestamp, email, konter,
                  item.kategori || "Pengeluaran",
                  item.produk || "-",
                  updatesStr.join(", "),
                  "Sukses", false
                ]);
              });
            }

            // Uang
            if (params.updatesUang && Array.isArray(params.updatesUang)) {
              params.updatesUang.forEach(item => {
                logsToAppend.push([
                  timestamp, email, konter,
                  item.kategori || "Uang",
                  item.produk || "Pecahan",
                  `Nilai:${item.list}`,
                  "Sukses", false
                ]);
              });
            }

            // Elektrik
            if (params.updatesElektrik && Array.isArray(params.updatesElektrik)) {
              params.updatesElektrik.forEach(item => {
                let updatesStr = [];
                if (item.saldoAwal !== undefined && item.saldoAwal !== '') updatesStr.push(`Awal:${item.saldoAwal}`);
                if (item.topup !== undefined && item.topup !== '') updatesStr.push(`Topup:${item.topup}`);
                if (item.saldoAkhir !== undefined && item.saldoAkhir !== '') updatesStr.push(`Update:${item.saldoAkhir}`);
                logsToAppend.push([
                  timestamp, email, konter,
                  item.kategori || "Elektrik",
                  item.produk || `Baris ${item.row}`,
                  updatesStr.join(", "),
                  "Sukses", false
                ]);
              });
            }

            // Tulis semua log sekaligus untuk efisiensi
            if (logsToAppend.length > 0) {
              const lastRow = logSheet.getLastRow();
              logSheet.getRange(lastRow + 1, 1, logsToAppend.length, 8).setValues(logsToAppend);
            }
         }
      } catch (logErr) {
         Logger.log("Gagal menulis log: " + logErr);
      }
    }

    return {
      message: "Data berhasil disimpan secara massal",
      syncInfo: syncInfo
    };
  } catch (e) { throw new Error(e.toString()); }
}

// 2. UPDATE PENGELUARAN (Nominal & Ket)
function updatePengeluaran(params) {
  try {
    const targetId = getTargetFileId(params.tanggal);
    const ss = SpreadsheetApp.openById(targetId);
    const sheet = ss.getSheetByName(params.toko);
    
    const row = parseInt(params.row); // No 1 = Baris 14
    sheet.getRange(row, 14).setValue(params.nominal);
    sheet.getRange(row, 18).setValue(params.keterangan);

    return "Pengeluaran diperbarui";
  } catch (e) { throw new Error(e.toString()); }
}

// 3. UPDATE UANG (List K)
function updateUang(params) {
  try {
    const targetId = getTargetFileId(params.tanggal);
    const ss = SpreadsheetApp.openById(targetId);
    const sheet = ss.getSheetByName(params.toko);
    
    // Data Uang ada di baris 48-57 (K48:K57)
    // params.index 0 = Baris 48
    const row = parseInt(params.index) + 48;
    // Col K(11)
    sheet.getRange(row, 11).setValue(params.nilai);

    return "Data Uang diperbarui";
  } catch (e) { throw new Error(e.toString()); }
}

// 4. UPDATE SALDO ELEKTRIK
function updateSaldoElektrik(params) {
  try {
    const targetId = getTargetFileId(params.tanggal);
    const ss = SpreadsheetApp.openById(targetId);
    const sheet = ss.getSheetByName(params.toko);
    
    // N65, Q65, S65
    sheet.getRange(65, 14).setValue(params.saldoAwal);
    sheet.getRange(65, 17).setValue(params.topup);
    // Saldo Akhir (S65) biasanya rumus, tapi jika mau diedit juga:
    if(params.saldoAkhir) sheet.getRange(65, 19).setValue(params.saldoAkhir);
    
    return "Saldo Update";
  } catch (e) { throw new Error(e.toString()); }
}

// =========================================
// --- API JADWAL (AUTO SYNC & MASTER) ---
// =========================================

// 1. GET JADWAL HARI INI (Auto Sync dari Master ke Menu)
function getJadwalHariIni() {
  try {
    const ss = SpreadsheetApp.openById(FILES.STOK);
    const sheetMenu = ss.getSheetByName("menu");
    const sheetMaster = ss.getSheetByName("master_jadwal");
    
    if (!sheetMaster) return { error: true, message: "Sheet 'master_jadwal' belum dibuat!" };

    // --- LOGIKA AUTO SYNC ---
    const hariIni = new Date();
    // getDay(): 0=Minggu, 1=Senin... 6=Sabtu
    let dayIndex = hariIni.getDay(); 
    // Kita butuh mapping ke Baris Excel:
    // Senin(Row 2), Selasa(3)... Sabtu(7), Minggu(8)
    
    // Konversi dayIndex JS ke Row Excel
    // JS: 1(Sen), 2(Sel), 3(Rab), 4(Kam), 5(Jum), 6(Sab), 0(Min)
    let targetRow = (dayIndex === 0) ? 8 : dayIndex + 1;

    // Ambil Data Master Sesuai Hari Ini (Range B-K)
    // Kolom B=2, K=11. Total 10 kolom.
    const dataMaster = sheetMaster.getRange(targetRow, 2, 1, 10).getDisplayValues()[0];
    
    // Mapping Data Master ke Sheet Menu (Sesuai request A,C,E,H,J)
    // Master: [M1P, M1S, M2P, M2S, M3P, M3S, M4P, M4S, M5P, M5S]
    // Index:    0    1    2    3    4    5    6    7    8    9
    
    // Update Sheet Menu
    // Row 3 (Pagi), Row 4 (Sore)
    
    // M1 (Col A = 1)
    sheetMenu.getRange("A3").setValue(dataMaster[0]);
    sheetMenu.getRange("A4").setValue(dataMaster[1]);
    
    // M2 (Col C = 3)
    sheetMenu.getRange("C3").setValue(dataMaster[2]);
    sheetMenu.getRange("C4").setValue(dataMaster[3]);

    // M3 (Col E = 5)
    sheetMenu.getRange("E3").setValue(dataMaster[4]);
    sheetMenu.getRange("E4").setValue(dataMaster[5]);

    // M4 (Col H = 8) - Note: Request sebelumnya H, bukan G
    sheetMenu.getRange("H3").setValue(dataMaster[6]);
    sheetMenu.getRange("H4").setValue(dataMaster[7]);

    // M5 (Col J = 10)
    sheetMenu.getRange("J3").setValue(dataMaster[8]);
    sheetMenu.getRange("J4").setValue(dataMaster[9]);
    
    // Update Tanggal di A1
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    sheetMenu.getRange("A1").setValue(hariIni.toLocaleDateString('id-ID', options));

    // --- KEMBALIKAN DATA UNTUK TAMPILAN ---
    // Kita kembalikan array object agar frontend mudah render
    return {
      success: true,
      tanggal: hariIni.toLocaleDateString('id-ID', options),
      data: [
        { nama: 'M1', pagi: dataMaster[0], sore: dataMaster[1] },
        { nama: 'M2', pagi: dataMaster[2], sore: dataMaster[3] },
        { nama: 'M3', pagi: dataMaster[4], sore: dataMaster[5] },
        { nama: 'M4', pagi: dataMaster[6], sore: dataMaster[7] },
        { nama: 'M5', pagi: dataMaster[8], sore: dataMaster[9] }
      ]
    };

  } catch (e) {
    return { error: true, message: e.toString() };
  }
}

// 2. GET MASTER MINGGUAN (Untuk Modal Edit)
function getMasterJadwal() {
  try {
    const ss = SpreadsheetApp.openById(FILES.STOK);
    const sheet = ss.getSheetByName("master_jadwal");
    // Ambil Senin-Minggu (Row 2-8, Col A-K)
    const data = sheet.getRange("A2:K8").getDisplayValues();
    return { success: true, data: data };
  } catch (e) { return { error: true, message: e.toString() }; }
}

// 3. SAVE MASTER MINGGUAN
function saveMasterJadwal(dataGrid) {
  try {
    const ss = SpreadsheetApp.openById(FILES.STOK);
    const sheet = ss.getSheetByName("master_jadwal");
    
    // dataGrid adalah array 7 baris x 11 kolom (termasuk nama hari)
    // Tulis ulang A2:K8
    sheet.getRange("A2:K8").setValues(dataGrid);
    
    return "Jadwal mingguan diperbarui.";
  } catch (e) { return { error: true, message: e.toString() }; }
}

// =========================================
// --- API REPORT BULANAN ---
// =========================================
// 1. Ambil Daftar File dari sheet 'file30h'
function getReportFileList() {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("file30h");
    if (!sheet) return [];

    // Ambil semua data (A:B)
    const data = sheet.getDataRange().getDisplayValues();
    const fileList = [];

    // Loop dari baris 2 (Index 1)
    for (let i = 1; i < data.length; i++) {
      const tgl = data[i][0];
      const link = data[i][1];
      
      // --- FILTER DATA ---
      // 1. Pastikan tanggal dan link ada isinya
      // 2. Cek apakah link bertuliskan "belum tersedia" (huruf kecil/besar tidak masalah)
      if (tgl && link) {
        const linkCek = String(link).toLowerCase().trim();
        
        // JIKA "BELUM TERSEDIA", LEWATI (CONTINUE)
        if (linkCek.includes("belum tersedia") || linkCek === "" || linkCek === "-") {
          continue; 
        }

        // Ekstrak ID
        let id = link;
        if (link.includes("/d/")) {
          try {
            id = link.split("/d/")[1].split("/")[0];
          } catch (err) {
            continue; // Skip jika format URL salah
          }
        }
        
        fileList.push({ date: tgl, id: id });
      }
    }
    
    return fileList; // Kembalikan list yang sudah bersih

  } catch (e) {
    // Jika error, kembalikan array kosong agar frontend tidak crash
    Logger.log("Error getReportFileList: " + e.toString());
    return [];
  }
}

// =========================================
// --- API REPORT & INTENSIF (SPLIT LOGIC) ---
// =========================================

function getReportDetail(fileId) {
  try {
    const ss = SpreadsheetApp.openById(fileId);
    const sheetData = ss.getSheetByName("data bulanan");
    if (!sheetData) return { error: true, msg: "Sheet data bulanan tidak ada" };

    const mainData = sheetData.getRange("B39:BX39").getValues()[0];

    // --- HITUNG INTENSIF (INDIVIDU) ---
    const shops = ['m1', 'm2', 'toko', 'm4', 'm4']; 
    let insentifResult = [];

    shops.forEach(shopName => {
      const sheetShop = ss.getSheetByName(shopName);
      if(sheetShop) {
        const dataAcc = sheetShop.getRange("G136:H307").getValues(); 
        const infoJaga = sheetShop.getRange("Q35").getDisplayValue(); // Ambil Teks "Zain & Irfan"

        let totalToko = 0;
        let r1=0, r2=0, r3=0; // Counter (Opsional buat info)

        // 1. Hitung Total Uang Insentif Toko Tersebut
        for(let i=0; i<dataAcc.length; i++) {
          const laku = parseInt(dataAcc[i][0]) || 0;
          const harga = parseInt(dataAcc[i][1]) || 0;

          if (laku > 0 && harga >= 10000) {
             let rate = 0;
             if(harga <= 20000) { rate = 1000; r1+=laku; }
             else if(harga <= 30000) { rate = 2000; r2+=laku; }
             else { rate = 3000; r3+=laku; }
             
             totalToko += (rate * laku);
          }
        }

        // 2. Bagi Hasil ke Individu
        if(totalToko > 0 && infoJaga && infoJaga !== '-' && infoJaga !== '') {
          
          // REGEX BARU: Pisahkan berdasarkan /, &, koma, atau kata "dan"
          const names = infoJaga.split(/[\/&,]| dan /i)
                                .map(n => n.trim())
                                .filter(n => n !== "" && n !== "-");
          
          if (names.length > 0) {
            const perOrang = totalToko / names.length; // Bagi rata
            
            names.forEach(nama => {
              insentifResult.push({
                tgl: mainData[0], // Ambil Tanggal dari kolom A (Index 0 array data bulanan)
                toko: shopName.toUpperCase(),
                nama: nama, 
                // Kirim detail hitungan untuk ditampilkan
                detil: `1k:${r1} 2k:${r2} 3k:${r3}`, 
                dapat: perOrang
              });
            });
          }
        }
      }
    });

    return { 
      success: true, 
      data: mainData,
      insentif: insentifResult 
    };

  } catch (e) { return { error: true, msg: "File Error" }; }
}

// --- API BON (UPDATED) ---

// 1. Simpan Bon (Terima Tanggal Lengkap)
function simpanBon(form) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("data_bon");
    
    // Append: [TanggalFull, Nama, Nominal, Ket, Timestamp]
    sheet.appendRow([form.tanggal, form.nama, form.nominal, form.ket, new Date()]);
    return "Bon tersimpan";
  } catch(e) { throw new Error(e.toString()); }
}

// =========================================
// --- PERBAIKAN API BON & SLIP GAJI ---
// =========================================

// 1. GET BON BULANAN (FIX STUCK)
function getBonBulanan(bulanFilter) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("data_bon");
    
    // Jika sheet belum ada, kembalikan array kosong (jangan error)
    if(!sheet) return [];
    
    const data = sheet.getDataRange().getDisplayValues();
    const result = [];
    
    // Loop dari baris 2 (Index 1)
    for(let i=1; i<data.length; i++) {
       const tglRow = String(data[i][0]); // "2025-11-29"
       
       // Cek apakah tanggal valid dan sesuai bulan
       if(tglRow && tglRow.startsWith(bulanFilter)) {
          result.push({ 
            row: i+1, // Real Row untuk hapus
            tgl: tglRow, 
            nama: data[i][1], 
            nominal: data[i][2], 
            ket: data[i][3] 
          });
       }
    }
    // Return reverse (Terbaru diatas)
    return result.reverse();

  } catch (e) {
    // PENTING: Jangan throw error, return kosong agar loading berhenti
    Logger.log("Error Get Bon: " + e.toString());
    return []; 
  }
}

// Hapus Bon (Sama)
function hapusBon(rowIndex) {
  const ss = SpreadsheetApp.openById(FILES.ADMIN);
  const sheet = ss.getSheetByName("data_bon");
  sheet.deleteRow(rowIndex);
  return "Dihapus";
}

// =========================================
// --- API SLIP GAJI ---
// =========================================

// 1. Ambil & Simpan Config Gaji Pokok
function getGajiConfig() {
  const ss = SpreadsheetApp.openById(FILES.ADMIN);
  const sheet = ss.getSheetByName("data_gaji");
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length > 1) data.shift(); // Hapus header
  return data; // [[Zain, 1000000, 50000], ...]
}

function saveGajiConfig(listGaji) {
  // listGaji sekarang = [[Nama, Gapok, Tunjangan, Hadir], ...]
  const ss = SpreadsheetApp.openById(FILES.ADMIN);
  let sheet = ss.getSheetByName("data_gaji");
  
  if (!sheet) {
    sheet = ss.insertSheet("data_gaji");
  }
  
  // Bersihkan sheet lama
  sheet.clear();
  
  // Update Header (Tambahkan "Hadir")
  sheet.appendRow(["Nama Karyawan", "Gaji Pokok", "Tunjangan", "Hadir"]); 
  
  if (listGaji && listGaji.length > 0) {
    // Pastikan lebar range adalah 4 kolom (sesuai jumlah kolom di listGaji)
    const rows = listGaji.length;
    const cols = listGaji[0].length; // Ini akan bernilai 4
    
    sheet.getRange(2, 1, rows, cols).setValues(listGaji);
  }
  
  return "Konfigurasi Gaji & Kehadiran Tersimpan";
}

// =========================================
// --- API SLIP GAJI (Backend Fix) ---
// =========================================

function getDataGajiDanBon(bulan) {
  try {
    const ssAdmin = SpreadsheetApp.openById(FILES.ADMIN);
    
    // 1. Ambil Config Gaji
    const sheetGaji = ssAdmin.getSheetByName("data_gaji");
    const dataGaji = sheetGaji ? sheetGaji.getDataRange().getValues() : [];
    let mapGaji = {}; 
    for(let i=1; i<dataGaji.length; i++) {
      const nama = String(dataGaji[i][0]).trim(); // Trim Nama
      if(nama) {
        mapGaji[nama] = { 
          gapok: Number(dataGaji[i][1]) || 0, 
          tunj: Number(dataGaji[i][2]) || 0,
          hadir: Number(dataGaji[i][3]) || 0 
        };
      }
    }

// 2. Ambil Bon dari 'data_bon'
    const sheetBon = ssAdmin.getSheetByName("data_bon");
    const dataBon = sheetBon ? sheetBon.getDataRange().getValues() : [];
    let mapBon = {}; 
    
    for(let i=1; i<dataBon.length; i++) {
      let rowTgl = String(dataBon[i][0]); 
      
      // Jika format tanggal Excel (object Date), konversi ke YYYY-MM-DD
      if (dataBon[i][0] instanceof Date) {
         const d = dataBon[i][0];
         rowTgl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }

      // Filter Bulan (YYYY-MM)
      // Di dalam loop data_bon pada Code.gs
      if(rowTgl.startsWith(bulan)) {
        const nama = String(dataBon[i][1]).trim().toLowerCase();
        const nominal = parseInt(dataBon[i][2]) || 0;
        const keterangan = dataBon[i][3] || ""; // Kolom D (Keterangan)

        if(!mapBon[nama]) {
          mapBon[nama] = { total: 0, ket: "" };
        }
        
        mapBon[nama].total += nominal;
        
        // Gabungkan keterangan jika ada lebih dari satu bon
        if(keterangan) {
          mapBon[nama].ket += (mapBon[nama].ket ? ", " : "") + keterangan;
        }
      }
    }

    return { success: true, gaji: mapGaji, bon: mapBon };

  } catch (e) {
    return { error: true, message: e.toString() };
  }
}

// =========================================
// --- API UPDATE BON (BARU) ---
// =========================================
function editDataBon(form) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("data_bon");
    
    // form.row adalah nomor baris asli di Excel
    const rowIndex = parseInt(form.row);
    
    // Update Kolom A, B, C, D (Tanggal, Nama, Nominal, Ket)
    sheet.getRange(rowIndex, 1).setValue(form.tanggal);
    sheet.getRange(rowIndex, 2).setValue(form.nama);
    sheet.getRange(rowIndex, 3).setValue(form.nominal);
    sheet.getRange(rowIndex, 4).setValue(form.ket);
    
    return "Bon berhasil diperbarui";
  } catch(e) {
    throw new Error(e.toString());
  }
}

function convertBulanToIndo(yyyyMM) {
  // Input: "2025-11"
  const bln = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const parts = yyyyMM.split('-'); 
  // Output: "November 2025" (Sesuai format di file30h)
  return bln[parseInt(parts[1])-1] + " " + parts[0];
}
// --- REST API UNTUK REACT FRONTEND ---
// =========================================
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const args = postData.args || [];
    
    let result;
    
    // Routing API
    if (action === 'getDashboardStats') result = getDashboardStats();
    else if (action === 'getDataValidasi') result = getDataValidasi();
    else if (action === 'checkLogin') result = checkLogin(args[0]);
    else if (action === 'getDataStok') result = getDataStok(args[0]);
    else if (action === 'batchUpdateStok') result = batchUpdateStok(args[0]);
    else if (action === 'getDataKonterList') result = getDataKonterList();
    else if (action === 'tambahKonterList') result = tambahKonterList(args[0]);
    else if (action === 'editKonterList') result = editKonterList(args[0]);
    else if (action === 'hapusKonterList') result = hapusKonterList(args[0]);
    else if (action === 'getDataLog') result = getDataLog(args[0]);
    else if (action === 'updateLogKoreksi') result = updateLogKoreksi(args[0], args[1]);
    else if (action === 'getReportFileList') result = getReportFileList();
    else if (action === 'getReportDetail') result = getReportDetail(args[0]);
    // API Tambahan Laporan Bulanan
    else if (action === 'getBonBulanan') result = getBonBulanan(args[0]);
    else if (action === 'simpanBon') result = simpanBon(args[0]);
    else if (action === 'editDataBon') result = editDataBon(args[0]);
    else if (action === 'hapusBon') result = hapusBon(args[0]);
    else if (action === 'getGajiConfig') result = getGajiConfig();
    else if (action === 'saveGajiConfig') result = saveGajiConfig(args[0]);
    else if (action === 'getDataGajiDanBon') result = getDataGajiDanBon(args[0]);
    else if (action === 'getReportDataBulanan') result = getReportDataBulanan(args[0]);
    // API Tambahan Keuangan
    else if (action === 'getDataSetoran') result = getDataSetoran(args[0]);
    else if (action === 'simpanUangFisik') result = simpanUangFisik(args[0]);
    else if (action === 'getManajemenKas') result = getManajemenKas();
    else if (action === 'tambahManajemenKas') result = tambahManajemenKas(args[0]);
    else if (action === 'editManajemenKas') result = editManajemenKas(args[0]);
    else if (action === 'hapusManajemenKas') result = hapusManajemenKas(args[0]);
    else if (action === 'testKas') result = testKas();
    else if (action === 'getLogNotifikasi') result = { success: true, data: getLogNotifikasi() };
    
    // Tambahkan action lain sesuai kebutuhan
    else {
      return ContentService.createTextOutput(JSON.stringify({ error: true, message: 'Action not found: ' + action }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: true, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================
// FITUR: BACA DATA BULANAN LANGSUNG DARI SHEET "data bulanan"
// =========================================

function getReportDataBulanan(bulanFilter) {
  try {
    const ss = SpreadsheetApp.openById(FILES.ADMIN);
    const sheet = ss.getSheetByName("data_bulanan");
    const sheetBefore = ss.getSheetByName("data_bulanan_before");
    if (!sheet) {
      return { success: false, error: "Sheet 'data_bulanan' tidak ditemukan di Spreadsheet Admin." };
    }
    
    const data = sheet.getDataRange().getDisplayValues();
    const dataBefore = sheetBefore ? sheetBefore.getDataRange().getDisplayValues() : [];
    return { success: true, data: data, dataBefore: dataBefore };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// =========================================
// FITUR: MANAJEMEN KEUANGAN DAN KAS (SETORAN) - AUTO PULL DARI FILE STOK
// =========================================

function getDataSetoran(tanggalRequest) {
  try {
    const ssAdmin = SpreadsheetApp.openById(FILES.ADMIN);
    
    // 1. Ambil List Konter dari konter_list (Opsi Dropdown) - HANYA YG ADA DI SHEET
    const sheetKonter = ssAdmin.getSheetByName("konter_list");
    let listKonter = [];
    if (sheetKonter) {
      const dataKonter = sheetKonter.getDataRange().getDisplayValues();
      if (dataKonter.length > 0) dataKonter.shift(); 
      listKonter = [...new Set(dataKonter.map(row => row[0]))].filter(String).sort();
    }
    
    // 2. Tentukan Tanggal & File ID
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    let targetTanggal = tanggalRequest || todayStr;
    let targetFileId = FILES.STOK;
    
    if (targetTanggal !== todayStr) {
      const foundId = getFileIdByDate(targetTanggal);
      if (foundId) {
        targetFileId = foundId;
      } else {
        return { 
          success: true, 
          data: { Pagi: {}, Sore: {} }, 
          options: { konter: listKonter }, 
          message: `Data tgl "${convertDateToIndo(targetTanggal)}" tidak ditemukan.` 
        };
      }
    }
    
    const ssStok = SpreadsheetApp.openById(targetFileId);
    
    // 3. Ambil Nominal Kas dari Total Uang Pagi & Sore
    const sheetPagi = ssStok.getSheetByName("Total Uang pagi");
    const sheetSore = ssStok.getSheetByName("Total Uang sore");
    
    let allData = {
      Pagi: {},
      Sore: {}
    };
    
    const processSheet = (sheet, shiftName) => {
      if (!sheet) return;
      const lastRow = sheet.getLastRow();
      if (lastRow < 6) return; 
      
      // Ambil nilai sampai baris 30 dan kolom 50 (AU adalah index 46)
      const values = sheet.getRange(1, 1, 30, 50).getValues();
      
      const konterMap = [
        { name: "M1", colIdx: 0 },      // Kolom A
        { name: "M2", colIdx: 9 },      // Kolom J
        { name: "TOKO", colIdx: 18 }    // Kolom S
      ];
      if (shiftName === "Pagi") {
        konterMap.push({ name: "M4", colIdx: 27 });         // Kolom AB
        konterMap.push({ name: "JAYACell", colIdx: 36 });   // Kolom AK
      }
      
      // Helper mengambil data array dari kolom
      const getColumnData = (colIdx, startRow, endRow) => {
        let res = [];
        for (let i = startRow - 1; i <= endRow - 1; i++) {
           let val = values[i][colIdx];
           let nominal = 0;
           if (typeof val === 'number') {
             nominal = val;
           } else if (val) {
             nominal = parseInt(String(val).replace(/[^0-9,-]/g, '').replace(/,/g, ''), 10);
           }
           res.push(isNaN(nominal) ? 0 : nominal);
        }
        return res;
      };
      
      konterMap.forEach(k => {
         const setoranVals = getColumnData(k.colIdx, 6, 15);
         const fisikVals = getColumnData(k.colIdx, 17, 25);
         allData[shiftName][k.name] = {
            setoran: setoranVals,
            fisik: fisikVals,
            totalSetoran: setoranVals.reduce((a,b)=>a+b, 0),
            totalFisik: fisikVals.reduce((a,b)=>a+b, 0)
         };
      });
      
      // Mengambil Total Semua Konter (Kolom AU baris 6-15)
      const auSetoran = getColumnData(46, 6, 15); // AU index 46
      allData[shiftName]["TOTAL_SEMUA"] = {
         setoranAU: auSetoran,
         totalSetoranAU: auSetoran.reduce((a,b)=>a+b, 0)
      };
    };
    
    processSheet(sheetPagi, "Pagi");
    processSheet(sheetSore, "Sore");
    
    return { success: true, data: allData, options: { konter: listKonter } };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Endpoint baru untuk menyimpan rincian fisik
function simpanUangFisik(params) {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    let targetFileId = FILES.STOK;
    if (params.tanggal && params.tanggal !== todayStr) {
      const foundId = getFileIdByDate(params.tanggal);
      if (foundId) targetFileId = foundId;
      else return { success: false, error: "File tidak ditemukan untuk tanggal tersebut." };
    }
    
    const ssStok = SpreadsheetApp.openById(targetFileId);
    const sheet = ssStok.getSheetByName("Total Uang " + params.shift.toLowerCase());
    if (!sheet) return { success: false, error: "Sheet tidak ditemukan." };
    
    const konterMap = {
        "M1": 1, "M2": 10, "TOKO": 19, "M4": 28, "JAYACell": 37, "TOTAL_SEMUA": 47
    };
    const colIdx = konterMap[params.konter];
    if (!colIdx) return { success: false, error: "Konter tidak valid." };
    
    // Tulis ke baris yang sesuai (9 baris)
    const updates = [];
    for(let i=0; i<9; i++) {
       const val = params.values[i] || 0;
       updates.push([val]);
    }
      
    const startRow = params.konter === "TOTAL_SEMUA" ? 6 : 17;
    sheet.getRange(startRow, colIdx, 9, 1).setValues(updates);
    
    return { success: true, message: "Pengecekan fisik berhasil disimpan" };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// =========================================
// API MANAJEMEN KAS (BULANAN) - SHEET EKSTERNAL
// =========================================
const KAS_FILE_ID = "1-uDH49GYpdMNVMhuSH_Yfl_ICMTakSTdY_ppbwn209c";

function getManajemenKas() {
  try {
    const ss = SpreadsheetApp.openById(KAS_FILE_ID);
    const sheet = ss.getSheets()[0]; // Ambil sheet pertama
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) return { success: true, data: [] };
    
    // Ambil baris 2 sampai lastRow, kolom A sampai E (5 kolom)
    // A: Tanggal, B: Masuk, C: Keluar, D: Saldo, E: Keterangan
    // Menggunakan getDisplayValues agar format tanggal dan rumus saldo terbaca sebagai string/angka hasil
    const data = sheet.getRange(2, 1, lastRow - 1, 5).getDisplayValues();
    
    // Filter hanya baris yang ada isinya di B, C, atau E
    // Dan sertakan index asli (baris) untuk keperluan hapus
    const finalData = [];
    data.forEach((row, idx) => {
       const [tgl, masuk, keluar, saldo, ket] = row;
       if (masuk || keluar || ket) {
          finalData.push({
             rowReal: idx + 2, // +2 karena mulai baris 2
             tanggal: tgl,
             masuk: masuk,
             keluar: keluar,
             saldo: saldo,
             keterangan: ket
          });
       }
    });
    
    return { success: true, data: finalData };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function tambahManajemenKas(payload) {
  try {
    const ss = SpreadsheetApp.openById(KAS_FILE_ID);
    const sheet = ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    
    // Cari baris kosong pertama di kolom B, C, E
    // Kita baca dari baris 2 ke bawah
    let targetRow = 2;
    if (lastRow >= 2) {
      const dataBCE = sheet.getRange(2, 2, lastRow - 1, 4).getValues(); 
      for (let i = 0; i < dataBCE.length; i++) {
         if (!dataBCE[i][0] && !dataBCE[i][1] && !dataBCE[i][3]) {
            targetRow = i + 2;
            break;
         }
         targetRow = i + 3;
      }
    }
    
    // payload: { tanggal: string, tipe: 'Pemasukan' | 'Pengeluaran', nominal: number, keterangan: string }
    const isPemasukan = payload.tipe === 'Pemasukan';
    const valMasuk = isPemasukan ? payload.nominal : '';
    const valKeluar = !isPemasukan ? payload.nominal : '';
    
    // Format tanggal (YYYY-MM-DD) menjadi DD/MM/YY agar Sheet otomatis mengubahnya sesuai format kolom
    if (payload.tanggal) {
       const parts = payload.tanggal.split('-');
       if (parts.length === 3) {
          const dateStr = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; // 19/08/26
          sheet.getRange(targetRow, 1).setValue(dateStr);
       } else {
          sheet.getRange(targetRow, 1).setValue(payload.tanggal);
       }
    }
    
    sheet.getRange(targetRow, 2).setValue(valMasuk);      // Kolom B
    sheet.getRange(targetRow, 3).setValue(valKeluar);     // Kolom C
    sheet.getRange(targetRow, 5).setValue(payload.keterangan); // Kolom E
    
    return { success: true, message: "Berhasil ditambahkan" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function hapusManajemenKas(rowReal) {
  try {
    const ss = SpreadsheetApp.openById(KAS_FILE_ID);
    const sheet = ss.getSheets()[0];
    
    sheet.getRange(rowReal, 2).clearContent(); // Masuk
    sheet.getRange(rowReal, 3).clearContent(); // Keluar
    sheet.getRange(rowReal, 5).clearContent(); // Keterangan
    
    return { success: true, message: "Berhasil dihapus (dikosongkan)" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function editManajemenKas(payload) {
  try {
    const ss = SpreadsheetApp.openById(KAS_FILE_ID);
    const sheet = ss.getSheets()[0];
    const rowReal = payload.rowReal;
    
    if (payload.tipe === 'Pemasukan') {
      sheet.getRange(rowReal, 2).setValue(payload.nominal); // B = Masuk
      sheet.getRange(rowReal, 3).clearContent(); // C = Keluar (kosongkan)
    } else {
      sheet.getRange(rowReal, 2).clearContent(); // B = Masuk (kosongkan)
      sheet.getRange(rowReal, 3).setValue(payload.nominal); // C = Keluar
    }
    
    sheet.getRange(rowReal, 5).setValue(payload.keterangan); // E = Keterangan
    
    return { success: true, message: "Berhasil diedit" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function testKas() {
  try {
    const ss = SpreadsheetApp.openById(KAS_FILE_ID);
    const sheet = ss.getSheets()[0];
    const data = sheet.getRange(1, 1, 10, 6).getFormulas();
    const vals = sheet.getRange(1, 1, 10, 6).getValues();
    return { success: true, formulas: data, values: vals, sheetName: sheet.getName() };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}
