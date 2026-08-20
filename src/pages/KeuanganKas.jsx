import React, { useState, useEffect } from 'react';
import { gasService } from '../services/gas';
import { 
  Wallet, TrendingUp, Plus, Search, Calendar, 
  MapPin, CheckCircle, Clock, Trash2, X, Activity, FileText, ChevronDown, ChevronUp, Save
} from 'lucide-react';

export default function KeuanganKas({ addToast }) {
  const [activeTab, setActiveTab] = useState('rincian'); // 'rincian' | 'manajemen'

  // --- STATE TAB 1: RINCIAN SETORAN (AUTO-SYNC) ---
  const [dataRincian, setDataRincian] = useState({ Pagi: {}, Sore: {} });
  const [loadingRincian, setLoadingRincian] = useState(true);
  const [konterOptions, setKonterOptions] = useState([]);
  const [expandedKonter, setExpandedKonter] = useState(null); // format: "Pagi-M1"
  const [expandTotal, setExpandTotal] = useState(false);
  
  // State untuk form Pengecekan Fisik (baris 17-25)
  // Format: { "Pagi-M1": [100000, 50000, ...] }
  const [fisikInputs, setFisikInputs] = useState({});
  const [savingFisik, setSavingFisik] = useState(null);
  
  // Filter Harian untuk Tab 1 & Tab 2
  const [filterTanggal, setFilterTanggal] = useState(
    new Date().toISOString().slice(0, 10) // Default hari ini YYYY-MM-DD
  );
  const [filterKonter, setFilterKonter] = useState('Semua');

  // --- STATE TAB 2: MANAJEMEN KAS (MANUAL) ---
  const [dataKas, setDataKas] = useState([]);
  const [loadingKas, setLoadingKas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    tipe: 'Pemasukan',
    nominal: '',
    keterangan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmKasPrompt, setConfirmKasPrompt] = useState(null);

  useEffect(() => {
    if (activeTab === 'rincian') {
      fetchRincian(filterTanggal);
    } else {
      fetchManajemenKas();
    }
  }, [activeTab, filterTanggal]);

  // --- FETCHERS ---
  const fetchRincian = async (tgl) => {
    setLoadingRincian(true);
    setExpandedKonter(null);
    try {
      const res = await gasService.call('getDataSetoran', tgl);
      if (res.success) {
        setDataRincian(res.data);
        if (res.options && res.options.konter) {
          setKonterOptions(res.options.konter);
        }
        
        // Populate state inputs fisik dengan data dari sheet agar bisa diedit
        const initialFisik = {};
        ["Pagi", "Sore"].forEach(shift => {
          if (res.data[shift]) {
            Object.keys(res.data[shift]).forEach(kName => {
              if (kName !== "TOTAL_SEMUA") {
                initialFisik[`${shift}-${kName}`] = [...res.data[shift][kName].fisik];
              }
            });
          }
        });
        setFisikInputs(initialFisik);
        
      } else {
        addToast(res.error || res.message || 'Gagal memuat rincian setoran', 'error');
      }
    } catch (err) {
      addToast(err.toString(), 'error');
    } finally {
      setLoadingRincian(false);
    }
  };

  const fetchManajemenKas = async () => {
    setLoadingKas(true);
    try {
      const res = await gasService.call('getManajemenKas');
      if (res.success) {
        setDataKas([...res.data].reverse());
      } else {
        addToast(res.error, 'error');
      }
    } catch (err) {
      addToast(err.toString(), 'error');
    } finally {
      setLoadingKas(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // --- HANDLERS TAB 1 ---
  const toggleExpand = (shift, konter) => {
    const key = `${shift}-${konter}`;
    if (expandedKonter === key) setExpandedKonter(null);
    else setExpandedKonter(key);
  };

  const handleFisikChange = (shift, konter, index, value) => {
    const key = `${shift}-${konter}`;
    
    let cleanValue;
    if (value === '-') {
      cleanValue = '-';
    } else {
      cleanValue = parseInt(String(value).replace(/[^0-9-]/g, ''), 10) || 0;
    }
    
    setFisikInputs(prev => {
       const baru = { ...prev };
       if (!baru[key]) {
          if (konter === "TOTAL_SEMUA") {
             baru[key] = [...(dataRincian[shift]?.TOTAL_SEMUA?.setoranAU || Array(9).fill(0))];
          } else {
             baru[key] = [...(dataRincian[shift]?.[konter]?.fisik || Array(9).fill(0))];
          }
       }
       baru[key][index] = cleanValue;
       return baru;
    });
  };

  const handleSaveFisik = async (shift, konter) => {
    const key = `${shift}-${konter}`;
    const values = fisikInputs[key];
    if (!values) return;
    
    setSavingFisik(key);
    try {
      const res = await gasService.call('simpanUangFisik', {
         tanggal: filterTanggal,
         shift: shift,
         konter: konter,
         values: values
      });
      if (res.success) {
         addToast(`Fisik ${konter} (${shift}) berhasil disimpan!`, 'success');
         // update local total
         setDataRincian(prev => {
            const newData = {...prev};
            newData[shift][konter].fisik = [...values];
            newData[shift][konter].totalFisik = values.reduce((a,b)=>a+b,0);
            return newData;
         });
      } else {
         addToast(res.error || 'Gagal menyimpan', 'error');
      }
    } catch (err) {
      addToast(err.toString(), 'error');
    } finally {
      setSavingFisik(null);
    }
  };

  // --- HANDLERS TAB 2 ---
  const handleSubmitKas = async (e) => {
    e.preventDefault();
    if (!formData.nominal || !formData.keterangan) {
      addToast('Nominal dan keterangan wajib diisi', 'warning');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        tanggal: formData.tanggal,
        tipe: formData.tipe,
        nominal: parseInt(formData.nominal.replace(/[^0-9-]/g, ''), 10),
        keterangan: formData.keterangan
      };
      
      const res = await gasService.call('tambahManajemenKas', payload);
      if (res.success || typeof res === 'string') {
        addToast('Data kas berhasil ditambahkan', 'success');
        setShowModal(false);
        setFormData({ ...formData, nominal: '', keterangan: '' });
        fetchManajemenKas();
      } else {
        addToast(res.error, 'error');
      }
    } catch (err) {
      addToast(err.toString(), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHapusKas = async (indexReal, e) => {
    e.stopPropagation();
    if (!window.confirm('Yakin ingin menghapus data kas ini?')) return;
    
    try {
      const res = await gasService.call('hapusManajemenKas', indexReal);
      if (res.success || typeof res === 'string') {
        addToast('Data kas berhasil dihapus', 'success');
        fetchManajemenKas();
      } else {
        addToast(res.error, 'error');
      }
    } catch (err) {
      addToast(err.toString(), 'error');
    }
  };

  // Label nominal pecahan (hanya estetika panduan)
  const pecahanLabels = [
    "Pecahan 100.000 / Lainnya",
    "Pecahan 50.000 / Lainnya",
    "Pecahan 20.000 / Lainnya",
    "Pecahan 10.000 / Lainnya",
    "Pecahan 5.000 / Lainnya",
    "Pecahan 2.000 / Lainnya",
    "Pecahan 1.000 / Lainnya",
    "Koin 500 / Lainnya",
    "Lainnya"
  ];

  // --- RENDER TAB 1 ---
  const renderTabRincian = () => {
    if (loadingRincian) {
      return (
        <div className="space-y-6">
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="h-6 w-32 bg-slate-200 animate-pulse rounded"></div>
              <div className="h-8 w-40 bg-slate-200 animate-pulse rounded-full"></div>
            </div>
            <div className="p-4 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-lg p-4 flex justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-slate-200 animate-pulse rounded"></div>
                    <div className="h-4 w-32 bg-slate-100 animate-pulse rounded"></div>
                  </div>
                  <div className="h-8 w-32 bg-slate-200 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="h-6 w-32 bg-slate-200 animate-pulse rounded"></div>
              <div className="h-8 w-40 bg-slate-200 animate-pulse rounded-full"></div>
            </div>
            <div className="p-4 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-lg p-4 flex justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-slate-200 animate-pulse rounded"></div>
                    <div className="h-4 w-32 bg-slate-100 animate-pulse rounded"></div>
                  </div>
                  <div className="h-8 w-32 bg-slate-200 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    const renderShiftData = (shiftName) => {
       const shiftData = dataRincian[shiftName];
       if (!shiftData) return null;
       
       const totalSemua = shiftData["TOTAL_SEMUA"] || {};
       
       const totalFisikShift = Object.keys(shiftData)
         .filter(k => k !== "TOTAL_SEMUA")
         .reduce((acc, konterName) => {
           const key = `${shiftName}-${konterName}`;
           const currentFisikArray = fisikInputs[key] || shiftData[konterName].fisik || [];
           return acc + currentFisikArray.reduce((a, b) => a + b, 0);
         }, 0);
       
       return (
         <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center">
               <Calendar className="w-5 h-5 text-indigo-500 mr-2" />
               Shift {shiftName}
             </h3>
             <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
               Total Fisik: {formatRupiah(totalFisikShift)}
             </div>
           </div>
           
           <div className="p-4 space-y-3">
             {Object.keys(shiftData).filter(k => k !== "TOTAL_SEMUA").map(konterName => {
                const kData = shiftData[konterName];
                const key = `${shiftName}-${konterName}`;
                const isExpanded = expandedKonter === key;
                
                // Hitung total fisik dari STATE input yang sedang diketik user
                const currentFisikArray = fisikInputs[key] || kData.fisik || [];
                const currentTotalFisik = currentFisikArray.reduce((a,b)=>a+b, 0);
                const isMatch = currentTotalFisik === kData.totalSetoran;
                
                return (
                  <div key={key} className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-indigo-300">
                    {/* HEADER KONTER */}
                    <div 
                      onClick={() => toggleExpand(shiftName, konterName)}
                      className={`px-4 py-3 flex items-center justify-between cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/50' : 'bg-white'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{konterName}</h4>
                          <div className="flex gap-4 text-xs mt-1">
                            <span className="text-slate-500">
                              Total Setoran: <span className="font-semibold text-slate-700">{formatRupiah(kData.totalSetoran)}</span>
                            </span>
                            <span className={`${isMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                              Fisik: <span className="font-semibold">{formatRupiah(currentTotalFisik)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        {kData.totalSetoran > 0 && isMatch && (
                          <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium">
                            <CheckCircle className="w-4 h-4 mr-1" /> Sesuai
                          </span>
                        )}
                        {kData.totalSetoran > 0 && !isMatch && (
                          <span className={`flex items-center px-2 py-1 rounded-md font-medium ${currentTotalFisik > kData.totalSetoran ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'}`}>
                            {currentTotalFisik > kData.totalSetoran ? <Plus className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                            {currentTotalFisik > kData.totalSetoran ? 'Lebih' : 'Selisih'} {formatRupiah(Math.abs(kData.totalSetoran - currentTotalFisik))}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>
                    
                    {/* EXPANDED BODY */}
                    {isExpanded && (
                      <div className="px-4 py-4 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-6">
                        
                        {/* TABEL RINCIAN SETORAN (BARIS 6-15) */}
                        <div className="flex-1">
                           <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                             <FileText className="w-4 h-4 mr-2 text-blue-500" />
                             Rincian Sistem
                           </h5>
                           <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
                             {kData.setoran.map((val, idx) => (
                               <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                                 <span className="text-slate-500">Item {idx + 1}</span>
                                 <span className="font-medium text-slate-800">{formatRupiah(val)}</span>
                               </div>
                             ))}
                             <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t-2 border-slate-200">
                               <span>TOTAL SISTEM</span>
                               <span className="text-indigo-700">{formatRupiah(kData.totalSetoran)}</span>
                             </div>
                           </div>
                        </div>
                        
                        {/* TABEL PENGECEKAN FISIK (BARIS 17-25) */}
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-3">
                             <h5 className="text-sm font-bold text-slate-700 flex items-center">
                               <Wallet className="w-4 h-4 mr-2 text-emerald-500" />
                               Pengecekan Fisik
                             </h5>
                             <button
                               onClick={() => handleSaveFisik(shiftName, konterName)}
                               disabled={savingFisik === key}
                               className="flex items-center text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50"
                             >
                               {savingFisik === key ? <Activity className="w-3 h-3 animate-spin mr-1"/> : <Save className="w-3 h-3 mr-1" />}
                               Simpan
                             </button>
                           </div>
                           
                           <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                             {currentFisikArray.map((val, idx) => (
                               <div key={idx} className="flex items-center justify-between text-sm">
                                 <span className="text-slate-500 text-xs w-1/3 truncate" title={pecahanLabels[idx]}>
                                   {pecahanLabels[idx]}
                                 </span>
                                 <div className="relative w-2/3">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">Rp</span>
                                    <input 
                                      type="text" 
                                      value={val === 0 ? '' : (val === '-' ? '-' : new Intl.NumberFormat('id-ID').format(val))}
                                      onChange={(e) => handleFisikChange(shiftName, konterName, idx, e.target.value)}
                                      className="w-full pl-8 pr-3 py-1.5 text-right text-sm font-medium border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="0"
                                    />
                                 </div>
                               </div>
                             ))}
                             <div className="flex justify-between items-center text-sm font-bold pt-2 mt-2 border-t-2 border-slate-200">
                               <span>TOTAL FISIK</span>
                               <span className={isMatch ? "text-emerald-600" : "text-rose-600"}>
                                 {formatRupiah(currentTotalFisik)}
                               </span>
                             </div>
                           </div>
                        </div>
                        
                      </div>
                    )}
                  </div>
                );
             })}
           </div>
         </div>
       );
    };

    return (
      <div className="space-y-6">
        {renderShiftData("Pagi")}
        {renderShiftData("Sore")}
        
        {/* TOTAL SEMUA KONTER (KOLOM AU) */}
        <div 
          className="bg-indigo-900 rounded-xl p-6 text-white shadow-lg flex flex-col gap-4 border border-indigo-700"
        >
           <div 
             className="flex flex-col md:flex-row justify-between items-center w-full cursor-pointer group"
             onClick={() => setExpandTotal(!expandTotal)}
           >
             <div>
               <h3 className="text-lg font-bold text-indigo-100 flex items-center group-hover:text-white transition-colors">
                 <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                 Total Sistem Pagi + Sore
               </h3>
               <p className="text-indigo-200 text-sm mt-1">Akumulasi seluruh setoran berdasarkan perhitungan master sheet</p>
             </div>
             <div className="text-3xl font-black text-white flex items-center mt-4 md:mt-0">
               {formatRupiah(
                 ((dataRincian.Pagi?.TOTAL_SEMUA?.totalSetoranAU) || 0) + 
                 ((dataRincian.Sore?.TOTAL_SEMUA?.totalSetoranAU) || 0)
               )}
               {expandTotal ? <ChevronUp className="w-6 h-6 ml-4 text-indigo-300" /> : <ChevronDown className="w-6 h-6 ml-4 text-indigo-300" />}
             </div>
           </div>

           {expandTotal && (
             <div className="mt-4 border-t border-indigo-700/60 pt-6 grid grid-cols-1 gap-6 w-full animate-in slide-in-from-top-4 duration-200 max-w-3xl mx-auto">
                {/* Pagi + Sore */}
                <div className="bg-indigo-950/40 rounded-xl p-5 border border-indigo-800/50">
                  <h4 className="font-bold text-indigo-200 mb-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-indigo-400"/> 
                    Rincian Shift Pagi + Sore
                  </h4>
                  <div className="space-y-2">
                    {(fisikInputs["Sore-TOTAL_SEMUA"] || dataRincian.Sore?.TOTAL_SEMUA?.setoranAU || Array(9).fill(0)).map((val, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-indigo-800/40 last:border-0 text-indigo-100/90">
                        <span>Item {idx + 1}</span>
                        <div className="relative w-1/2">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 text-xs">Rp</span>
                          <input 
                            type="text" 
                            value={val === 0 ? '' : (val === '-' ? '-' : new Intl.NumberFormat('id-ID').format(val))}
                            onChange={(e) => handleFisikChange("Sore", "TOTAL_SEMUA", idx, e.target.value)}
                            className="w-full pl-7 pr-2 py-1 text-right text-sm font-medium bg-indigo-900/50 border border-indigo-700 rounded focus:border-indigo-400 focus:outline-none text-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-sm font-bold pt-3 mt-3 border-t-2 border-indigo-500/50 text-white">
                      <span>TOTAL PAGI + SORE</span>
                      <span className={(fisikInputs["Sore-TOTAL_SEMUA"] || dataRincian.Sore?.TOTAL_SEMUA?.setoranAU || []).reduce((a,b)=>a+b,0) === (((dataRincian.Pagi?.TOTAL_SEMUA?.totalSetoranAU) || 0) + ((dataRincian.Sore?.TOTAL_SEMUA?.totalSetoranAU) || 0)) ? "text-emerald-400 text-base" : "text-rose-400 text-base"}>
                        {formatRupiah((fisikInputs["Sore-TOTAL_SEMUA"] || dataRincian.Sore?.TOTAL_SEMUA?.setoranAU || []).reduce((a,b)=>a+b,0))}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                         await handleSaveFisik("Sore", "TOTAL_SEMUA");
                         const totalAll = (fisikInputs["Sore-TOTAL_SEMUA"] || dataRincian.Sore?.TOTAL_SEMUA?.setoranAU || []).reduce((a,b)=>a+b,0);
                         setConfirmKasPrompt({ shift: "Pagi + Sore", total: totalAll });
                      }}
                      disabled={savingFisik === "Sore-TOTAL_SEMUA"}
                      className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {savingFisik === "Sore-TOTAL_SEMUA" ? "Menyimpan..." : "Simpan Pagi + Sore"}
                    </button>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  // --- RENDER TAB 2 ---
  const renderTabManajemen = () => {
    // Filter berdasarkan bulan
    // filterTanggal di tab Kas akan berformat YYYY-MM
    const filteredKas = dataKas.filter(row => {
       if (!filterTanggal || filterTanggal.length !== 7) return true; // fallback
       
       const [yyyy, mm] = filterTanggal.split('-');
       const strTgl = String(row.tanggal).toLowerCase();
       
       // Handle variasi format (seperti "Agustus" atau "Agu")
       const monthNamesId = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
       const mIndex = parseInt(mm, 10) - 1;
       const expectedMonthName = monthNamesId[mIndex];
       const shortMonthName = expectedMonthName.substring(0, 3); // "agu"
       
       // Cek apakah teks tanggal mengandung nama bulan (full/singkat) dan tahun yang sesuai
       return (strTgl.includes(expectedMonthName) || strTgl.includes(shortMonthName)) && strTgl.includes(yyyy);
    });

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    
    filteredKas.forEach(row => {
      const nomMasuk = parseInt(String(row.masuk).replace(/[^0-9]/g, ''), 10) || 0;
      const nomKeluar = parseInt(String(row.keluar).replace(/[^0-9]/g, ''), 10) || 0;
      totalPemasukan += nomMasuk;
      totalPengeluaran += nomKeluar;
    });
    
    // Saldo kas ambil nominal saldo terakhir dari baris teratas (karena array di reverse)
    let saldoAkhir = 0;
    const firstValidRow = filteredKas.find(r => r.saldo && String(r.saldo).trim() !== '');
    if (firstValidRow) {
       saldoAkhir = parseInt(String(firstValidRow.saldo).replace(/[^0-9-]/g, ''), 10) || 0;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Pemasukan</p>
              <h3 className="text-xl font-bold text-slate-800">{loadingKas ? <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div> : formatRupiah(totalPemasukan)}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 transform rotate-180" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Pengeluaran</p>
              <h3 className="text-xl font-bold text-slate-800">{loadingKas ? <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div> : formatRupiah(totalPengeluaran)}</h3>
            </div>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex items-center">
            <div className="p-3 bg-slate-700 text-white rounded-lg mr-4">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-300 font-medium">Saldo Kas Saat Ini</p>
              <h3 className="text-xl font-bold text-white">{loadingKas ? <div className="h-6 w-24 bg-slate-600 animate-pulse rounded mt-1"></div> : formatRupiah(saldoAkhir)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Buku Kas {filterTanggal && filterTanggal.length === 7 ? `(${filterTanggal})` : '(Bulanan)'}</h3>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Catat Mutasi
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Masuk</th>
                  <th className="px-4 py-3 text-right">Keluar</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingKas ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-200 animate-pulse rounded"></div></td>
                      <td className="px-4 py-4"><div className="h-4 w-48 bg-slate-200 animate-pulse rounded"></div></td>
                      <td className="px-4 py-4 flex justify-end"><div className="h-4 w-24 bg-emerald-100 animate-pulse rounded"></div></td>
                      <td className="px-4 py-4 text-right"><div className="h-4 w-24 bg-rose-100 animate-pulse rounded inline-block"></div></td>
                      <td className="px-4 py-4 text-right"><div className="h-4 w-28 bg-slate-200 animate-pulse rounded inline-block"></div></td>
                      <td className="px-4 py-4 flex justify-center"><div className="h-6 w-6 bg-slate-200 animate-pulse rounded-md"></div></td>
                    </tr>
                  ))
                ) : filteredKas.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500">Tidak ada data mutasi bulan ini.</td></tr>
                ) : (
                  filteredKas.map((row, idx) => {
                    const isMasuk = row.masuk && String(row.masuk).trim() !== '';
                    const nomMasuk = parseInt(String(row.masuk).replace(/[^0-9]/g, ''), 10) || 0;
                    const nomKeluar = parseInt(String(row.keluar).replace(/[^0-9]/g, ''), 10) || 0;
                    
                    return (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">{row.tanggal}</td>
                        <td className="px-4 py-3 text-slate-800">{row.keterangan}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          {nomMasuk > 0 ? '+' + formatRupiah(nomMasuk) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-rose-600">
                          {nomKeluar > 0 ? '-' + formatRupiah(nomKeluar) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {row.saldo}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={(e) => handleHapusKas(row.rowReal, e)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus Mutasi">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center">
            <Wallet className="w-7 h-7 mr-3 text-indigo-600" />
            Keuangan & Kas
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola setoran harian dan mutasi kas operasional</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Date Picker */}
          <div className="relative w-full sm:w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type={activeTab === 'manajemen' ? 'month' : 'date'}
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm transition-all"
            />
          </div>
          {/* Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
             <button 
               onClick={() => setActiveTab('rincian')}
               className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex justify-center items-center shadow-sm ${activeTab === 'rincian' ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               <Activity className="w-4 h-4 mr-2" /> Setoran Sistem
             </button>
             <button 
               onClick={() => {
                  setActiveTab('manajemen');
                  setFilterTanggal(new Date().toISOString().slice(0, 7)); 
               }}
               className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex justify-center items-center shadow-sm ${activeTab === 'manajemen' ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               <Wallet className="w-4 h-4 mr-2" /> Manajemen Kas
             </button>
          </div>
        </div>
      </div>

      {activeTab === 'rincian' ? renderTabRincian() : renderTabManajemen()}

      {/* MODAL KONFIRMASI KAS */}
      {confirmKasPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">Lanjut ke Kas?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Ingin lanjut input total setoran harian <strong>{confirmKasPrompt.shift}</strong> ini ke Manajemen Kas?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmKasPrompt(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={() => {
                    setFormData({
                      tanggal: filterTanggal,
                      tipe: 'Pemasukan',
                      nominal: formatRupiah(confirmKasPrompt.total),
                      keterangan: `Setoran ${confirmKasPrompt.shift} ` + filterTanggal
                    });
                    setConfirmKasPrompt(null);
                    setActiveTab('manajemen');
                    setShowModal(true);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors"
                >
                  Ya, Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KAS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Catat Mutasi Kas</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitKas} className="p-6 space-y-4">
              {/* Tanggal tidak diinput karena diisi otomatis oleh rumus di Google Sheet */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tipe Mutasi</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer px-4 py-2.5 rounded-lg border text-sm font-medium text-center transition-all ${formData.tipe === 'Pemasukan' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input type="radio" className="hidden" name="tipe" value="Pemasukan" checked={formData.tipe === 'Pemasukan'} onChange={e => setFormData({...formData, tipe: e.target.value})} />
                    Pemasukan
                  </label>
                  <label className={`cursor-pointer px-4 py-2.5 rounded-lg border text-sm font-medium text-center transition-all ${formData.tipe === 'Pengeluaran' ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input type="radio" className="hidden" name="tipe" value="Pengeluaran" checked={formData.tipe === 'Pengeluaran'} onChange={e => setFormData({...formData, tipe: e.target.value})} />
                    Pengeluaran
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <input 
                    type="text"
                    required
                    value={formData.nominal}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9-]/g, '');
                      if (val === '-') {
                         setFormData({...formData, nominal: '-'});
                      } else {
                         setFormData({...formData, nominal: val ? new Intl.NumberFormat('id-ID').format(val) : ''});
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Keterangan</label>
                <input 
                  type="text"
                  required
                  value={formData.keterangan}
                  onChange={e => setFormData({...formData, keterangan: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Contoh: Beli token listrik"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center shadow-sm">
                  {isSubmitting ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
