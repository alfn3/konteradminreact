import React, { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet, PieChart as PieChartIcon, Wallet, DollarSign, Package, Users, Receipt, HandCoins, ArrowDownToLine, Printer, CheckSquare } from 'lucide-react';
import { gasService } from '../services/gas';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatRp = (angka) => 'Rp ' + new Intl.NumberFormat('id-ID').format(angka || 0);

export default function LaporanBulanan({ addToast }) {
  // State
  const [activeTab, setActiveTab] = useState('grafik');
  const [loadingList, setLoadingList] = useState(false);
  const [fileList, setFileList] = useState([]);
  
  const [progress, setProgress] = useState({ show: false, current: 0, total: 0, text: '' });
  const [reportData, setReportData] = useState(null);
  
  // State for Bon & Gaji
  const [filterBulan, setFilterBulan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [gajiData, setGajiData] = useState(null);
  const [loadingGaji, setLoadingGaji] = useState(false);

  // State Print
  const [selectedPrint, setSelectedPrint] = useState({});

  // Constants
  const konterOrder = ['M1', 'M2', 'M3', 'M4', 'Jaya'];

  // Initial fetch
  useEffect(() => {
    const fetchList = async () => {
      setLoadingList(true);
      try {
        const res = await gasService.call('getReportFileList');
        if (Array.isArray(res)) setFileList(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingList(false);
      }
    };
    
    // Auto Load Data
    fetchList();
    startLoadReport();
  }, []);

  async function startLoadReport() {
    setProgress({ show: true, current: 0, total: 100, text: 'Mengambil rekap data bulanan...' });
    
    const aggregated = {
      chartData: { labels: [], omset: [], margin: [], storeMargin: [0, 0, 0, 0, 0] },
      rows: [],
      insentifMap: {}, // Will be populated manually
      selisihMap: {}, // Total selisih per orang
      selisihDetailsMap: {}, // Rincian minus per orang (harian)
      hadirMap: {},
      totalTerjual: 0
    };

    try {
      const res = await gasService.call('getReportDataBulanan');
      
      const parseNum = (val) => {
        if (!val) return 0;
        const cleaned = String(val).replace(/[^0-9-]/g, '');
        return Number(cleaned) || 0;
      };
      
      if (res && res.success && Array.isArray(res.data) && res.data.length > 4) {
        const rawRows = res.data.slice(4); // Data mulai di baris 5 (index 4)
        
        rawRows.forEach((row, i) => {
          if (!row[0] || row[0].trim() === '') return;
          
          const dateStr = row[0];
          
          // Re-map the row back into the 1D array format expected by the UI renderers (length 75)
          // We need to map `data bulanan` indexes to the old `res.data` indexes used by the UI.
          // Or just build a new array that matches what the UI expects for `row.data`.
          const mappedData = Array(75).fill('');
          
          // Omset (15) -> index 0-14
          for(let k=1; k<=15; k++) mappedData[k-1] = parseNum(row[k]);
          // Margin (15) -> index 15-29
          for(let k=16; k<=30; k++) mappedData[k-1] = parseNum(row[k]);
          // Total Margin (5) -> index 30-34
          for(let k=31; k<=35; k++) mappedData[k-1] = parseNum(row[k]);
          // Terjual (15) -> index 35-49
          for(let k=36; k<=50; k++) mappedData[k-1] = parseNum(row[k]);
          
          // KARYAWAN JAGA (10 cols: 56-65) -> map to UI Info Jaga (Pagi/Sore split)
          const konters = [0, 1, 2, 3, 4];
          konters.forEach((idx) => {
             mappedData[55 + (idx*2)] = row[56 + (idx*2)] || '-'; // Pagi
             mappedData[55 + (idx*2) + 1] = row[56 + (idx*2) + 1] || '-'; // Sore
          });
          
          // SELISIH JAGA (10 cols: 66-75) (BO, BP, BQ, dst)
          konters.forEach((idx) => {
             const selisihPagi = parseNum(row[66 + (idx*2)]); // Kolom genap (BO, BQ...)
             const selisihSore = parseNum(row[66 + (idx*2) + 1]); // Kolom ganjil (BP, BR...)
             mappedData[65 + (idx*2)] = selisihPagi; // Pagi
             mappedData[65 + (idx*2) + 1] = selisihSore; // Sore
          });

          aggregated.rows.push({ date: dateStr, data: mappedData });
          
          // Agregasi Chart
          let dailyOmset = 0;
          for(let k=1; k<=15; k++) dailyOmset += parseNum(row[k]);
          
          let dailyMargin = 0;
          for(let k=31; k<=35; k++) {
             const val = parseNum(row[k]);
             dailyMargin += val;
             aggregated.chartData.storeMargin[k-31] += val; 
          }
          
          for(let k=36; k<=50; k++) aggregated.totalTerjual += parseNum(row[k]);
          
          aggregated.chartData.labels.push(dateStr);
          aggregated.chartData.omset.push(dailyOmset);
          aggregated.chartData.margin.push(dailyMargin);

          // Agregasi Operasional (Menghitung Minus / Hadir)
          const konterNames = ['M1', 'M2', 'Toko', 'M4', 'JayaCell'];
          for (let k = 0; k < 5; k++) {
             const valPagi = parseNum(row[66 + (k*2)]); // SELISIH JAGA PAGI (BO, BQ...)
             const valSore = parseNum(row[66 + (k*2) + 1]); // SELISIH JAGA SORE (BP, BR...)
             const totalSelisihToko = valPagi + valSore;
             
             // Gabungkan nama karyawan pagi & sore untuk dibagi selisihnya
             const rawNPagi = row[56 + (k*2)] || '';
             const rawNSore = row[56 + (k*2) + 1] || '';
             const rawN = rawNPagi + " / " + rawNSore;
             
             if (rawN && rawN.replace(/[-0\/ ]/g, '').length > 0) {
                const names = String(rawN).split(/[\/&,]| dan /i).map(n=>n.trim().toLowerCase()).filter(n=>n && n !== '-' && n !== '0');
                const uniq = [...new Set(names)];
                if (uniq.length > 0) {
                  // Bagi rata total selisih pagi & sore ke karyawan yang jaga hari itu
                  const pOrang = totalSelisihToko / uniq.length;
                  uniq.forEach(n => {
                    aggregated.hadirMap[n] = (aggregated.hadirMap[n] || 0) + 1;
                    if(totalSelisihToko !== 0) {
                      aggregated.selisihMap[n] = (aggregated.selisihMap[n] || 0) + pOrang;
                      // Simpan detil rincian minus
                      if (!aggregated.selisihDetailsMap[n]) aggregated.selisihDetailsMap[n] = [];
                      aggregated.selisihDetailsMap[n].push({
                         tanggal: dateStr,
                         toko: konterNames[k],
                         minus: pOrang
                      });
                    }
                  });
                }
             }
          }
        });
      } else {
        addToast && addToast('Gagal memuat atau data kosong', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast && addToast('Terjadi kesalahan koneksi', 'error');
    }

    setProgress({ show: false, current: 0, total: 0, text: '' });
    setReportData(aggregated);
    if(addToast) addToast('Data laporan berhasil dimuat super cepat!', 'success');
  };

  const loadInsentifManual = async () => {
    if (!reportData) {
      addToast && addToast('Muat Data Report utama terlebih dahulu', 'error');
      return;
    }
    
    if (fileList.length === 0) {
      addToast && addToast('Tidak ada file harian bulan ini', 'error');
      return;
    }

    setProgress({ show: true, current: 0, total: fileList.length, text: 'Memulai hitung insentif...' });
    
    // Copy existing report data so we don't overwrite it
    const newReportData = { ...reportData, insentifMap: {} };

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setProgress({ show: true, current: i + 1, total: fileList.length, text: `Menghitung insentif: ${file.date}` });
      
      try {
        const res = await gasService.call('getReportDetail', file.id);
        if (res && res.success && res.insentif) {
          res.insentif.forEach(ins => {
            const nm = ins.nama.trim().toLowerCase();
            if(!newReportData.insentifMap[nm]) newReportData.insentifMap[nm] = { total: 0, detil: [] };
            newReportData.insentifMap[nm].total += ins.dapat;
            newReportData.insentifMap[nm].detil.push({ date: file.date, toko: ins.toko, rincian: ins.detil, dapat: ins.dapat });
          });
        }
      } catch (err) {
        console.error('Gagal memuat insentif untuk file', file.id);
      }
    }

    setProgress({ show: false, current: 0, total: 0, text: '' });
    setReportData(newReportData);
    if(addToast) addToast('Data Insentif berhasil dimuat!', 'success');
  };

  // Removed loop logic -> completely replaced above

  const loadGaji = async () => {
    setLoadingGaji(true);
    try {
      const res = await gasService.call('getDataGajiDanBon', filterBulan);
      if (res && res.success) {
        setGajiData(res);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingGaji(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bon' || activeTab === 'gaji') {
      loadGaji();
    }
  }, [activeTab, filterBulan]);

  const togglePrint = (nama) => {
    setSelectedPrint(prev => ({ ...prev, [nama]: !prev[nama] }));
  };

  const handlePrintAllToggle = () => {
    const allNames = Object.keys(gajiData?.gaji || {});
    const allSelected = allNames.every(n => selectedPrint[n]);
    if(allSelected) {
      setSelectedPrint({});
    } else {
      const next = {};
      allNames.forEach(n => next[n] = true);
      setSelectedPrint(next);
    }
  };

  const handlePrint = () => {
    const selectedCount = Object.values(selectedPrint).filter(Boolean).length;
    if (selectedCount === 0) {
      addToast && addToast('Pilih slip gaji terlebih dahulu untuk dicetak.', 'error');
      return;
    }
    window.print();
  };

  const tabs = [
    { id: 'grafik', name: 'Grafik', icon: PieChartIcon },
    { id: 'omset', name: 'Data Omset', icon: Wallet },
    { id: 'margin', name: 'Data Margin', icon: DollarSign },
    { id: 'terjual', name: 'Barang Terjual', icon: Package },
    { id: 'operasional', name: 'Operasional', icon: Users },
    { id: 'insentif', name: 'Insentif', icon: HandCoins },
    { id: 'bon', name: 'Data Kasbon', icon: Receipt },
    { id: 'gaji', name: 'Slip Gaji', icon: FileSpreadsheet }
  ];

  return (
    <div className="space-y-5 pb-10">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm border border-slate-100">
        <div>
          <h2 className="font-bold text-xl text-slate-800">Laporan Bulanan & Penggajian</h2>
          <p className="text-sm text-slate-500 mt-1">Data laporan bulan ini dimuat otomatis.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           {progress.show && (
              <div className="flex items-center gap-2 text-primary font-medium bg-blue-50 px-4 py-2 rounded-xl">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm">Memuat data...</span>
              </div>
           )}
        </div>
      </div>

      {progress.show && !reportData ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          <div className="space-y-6">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="h-28 bg-slate-100 rounded-xl"></div>
               <div className="h-28 bg-slate-100 rounded-xl"></div>
               <div className="h-28 bg-slate-100 rounded-xl"></div>
               <div className="h-28 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="h-64 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      ) : progress.show && reportData && activeTab === 'insentif' ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between text-sm mb-2 font-medium text-slate-700">
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /> {progress.text}</span>
            <span className="text-primary font-bold">{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
          </div>
        </div>
      ) : null}

      {reportData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* TABS */}
          <div className="flex overflow-x-auto border-b border-slate-100 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${activeTab === tab.id ? 'text-primary bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                {tab.name}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-x-auto">
            {/* --- TAB GRAFIK --- */}
            {activeTab === 'grafik' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl text-center relative overflow-hidden">
                     <div className="absolute -right-4 -top-4 text-blue-500/10"><Wallet size={100} /></div>
                     <div className="text-blue-600 font-bold mb-2 relative z-10 text-sm">TOTAL OMSET BULAN INI</div>
                     <div className="text-3xl font-black text-slate-800 relative z-10">{formatRp(reportData.chartData.omset.reduce((a,b)=>a+b,0))}</div>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl text-center relative overflow-hidden">
                     <div className="absolute -right-4 -top-4 text-emerald-500/10"><DollarSign size={100} /></div>
                     <div className="text-emerald-600 font-bold mb-2 relative z-10 text-sm">TOTAL MARGIN BULAN INI</div>
                     <div className="text-3xl font-black text-slate-800 relative z-10">{formatRp(reportData.chartData.margin.reduce((a,b)=>a+b,0))}</div>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl text-center relative overflow-hidden">
                     <div className="absolute -right-4 -top-4 text-amber-500/10"><Package size={100} /></div>
                     <div className="text-amber-600 font-bold mb-2 relative z-10 text-sm">TOTAL ITEM TERJUAL</div>
                     <div className="text-3xl font-black text-slate-800 relative z-10">{reportData.totalTerjual} <span className="text-lg text-slate-500 font-medium">Item</span></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {konterOrder.map((k, i) => (
                    <div key={k} className="p-4 border border-slate-100 bg-white rounded-2xl text-center shadow-sm">
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k} MARGIN</div>
                       <div className="font-bold text-lg text-slate-800">{formatRp(reportData.chartData.storeMargin[i])}</div>
                    </div>
                  ))}
                </div>

                {/* Grafik Visual */}
                <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" /> Tren Omset & Margin Harian
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.chartData.labels.map((lbl, i) => ({ date: lbl.split(' ')[0], omset: reportData.chartData.omset[i], margin: reportData.chartData.margin[i] }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                        <YAxis yAxisId="left" tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-10} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `Rp ${(val/1000000).toFixed(1)}M`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={10} />
                        <Tooltip formatter={(value) => formatRp(value)} labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="omset" name="Omset P&VC" stroke="#0D6EFD" strokeWidth={3} dot={{ r: 3, fill: '#0D6EFD', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="margin" name="Total Margin" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB OMSET --- */}
            {activeTab === 'omset' && (
              <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-sm bg-white">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 backdrop-blur-sm text-center uppercase font-bold text-slate-700 tracking-wider text-[11px] border-b-2 border-slate-200">
                    <tr>
                      <th rowSpan="2" className="px-4 py-3 bg-white border-r-2 border-slate-200 sticky left-0 z-10 w-24 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">Tanggal</th>
                      <th colSpan="5" className="px-4 py-3 bg-blue-50/80 text-blue-700 border-b border-r border-slate-200 shadow-sm">Omset P&VC</th>
                      <th colSpan="5" className="px-4 py-3 bg-amber-50/80 text-amber-700 border-b border-r border-slate-200 shadow-sm">Omset ACC</th>
                      <th colSpan="5" className="px-4 py-3 bg-cyan-50/80 text-cyan-700 border-b border-slate-200 shadow-sm">Omset Elektrik</th>
                    </tr>
                    <tr className="border-b border-slate-200">
                      {Array(3).fill(konterOrder).flat().map((k, i) => (
                        <th key={i} className="px-3 py-2 border-r border-slate-200 font-bold bg-white text-slate-600">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/40 even:bg-slate-50/50 transition-colors text-right">
                        <td className="px-4 py-3 font-bold text-center bg-white sticky left-0 z-10 border-r-2 border-slate-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">{row.date}</td>
                        {row.error ? (
                          <td colSpan="15" className="px-4 py-3 text-center text-red-500 font-bold bg-red-50/30">Gagal ambil data</td>
                        ) : (
                          Array.from({length: 15}).map((_, colIdx) => (
                            <td key={colIdx} className="px-3 py-3 border-r border-slate-100 last:border-0">{formatRp(Number(row.data[colIdx]))}</td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- TAB MARGIN --- */}
            {activeTab === 'margin' && (
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-center uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th rowSpan="2" className="px-4 py-3 bg-slate-100 border-r border-slate-200 sticky left-0 z-10 w-24">Tanggal</th>
                      <th colSpan="5" className="px-4 py-2 bg-blue-50 text-blue-600 border-b border-r border-slate-200">Margin P&VC</th>
                      <th colSpan="5" className="px-4 py-2 bg-amber-50 text-amber-600 border-b border-r border-slate-200">Margin ACC</th>
                      <th colSpan="5" className="px-4 py-2 bg-cyan-50 text-cyan-600 border-b border-slate-200">Margin Elektrik</th>
                      <th colSpan="5" className="px-4 py-2 bg-emerald-50 text-emerald-600 border-b border-slate-200">TOTAL MARGIN</th>
                    </tr>
                    <tr className="border-b border-slate-200">
                      {Array(4).fill(konterOrder).flat().map((k, i) => (
                        <th key={i} className="px-3 py-2 border-r border-slate-200 font-semibold">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 text-right">
                        <td className="px-4 py-2.5 font-bold text-center bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{row.date}</td>
                        {row.error ? (
                          <td colSpan="20" className="px-4 py-3 text-center text-red-500 font-medium">Gagal ambil data</td>
                        ) : (
                          Array.from({length: 20}).map((_, colIdx) => (
                            <td key={colIdx} className={`px-3 py-2.5 border-r border-slate-100 last:border-0 ${colIdx >= 15 ? 'font-bold text-emerald-600 bg-emerald-50/20' : ''}`}>
                              {formatRp(Number(row.data[15 + colIdx]))}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- TAB TERJUAL --- */}
            {activeTab === 'terjual' && (
              <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-sm bg-white">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 backdrop-blur-sm text-center uppercase font-bold text-slate-700 tracking-wider text-[11px] border-b-2 border-slate-200">
                    <tr>
                      <th rowSpan="2" className="px-4 py-3 bg-white border-r-2 border-slate-200 sticky left-0 z-10 w-24 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">Tanggal</th>
                      <th colSpan="5" className="px-4 py-3 bg-indigo-50/80 text-indigo-700 border-b border-r border-slate-200 shadow-sm">Terjual VC</th>
                      <th colSpan="5" className="px-4 py-3 bg-fuchsia-50/80 text-fuchsia-700 border-b border-r border-slate-200 shadow-sm">Terjual SP</th>
                      <th colSpan="5" className="px-4 py-3 bg-violet-50/80 text-violet-700 border-b border-slate-200 shadow-sm">Terjual ACC</th>
                    </tr>
                    <tr className="border-b border-slate-200">
                      {Array(3).fill(konterOrder).flat().map((k, i) => (
                        <th key={i} className="px-3 py-2 border-r border-slate-200 font-bold bg-white text-slate-600">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-indigo-50/40 even:bg-slate-50/50 transition-colors text-center">
                        <td className="px-4 py-3 font-bold bg-white sticky left-0 z-10 border-r-2 border-slate-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">{row.date}</td>
                        {row.error ? (
                          <td colSpan="15" className="px-4 py-3 text-red-500 font-bold bg-red-50/30">Gagal ambil data</td>
                        ) : (
                          Array.from({length: 15}).map((_, colIdx) => (
                            <td key={colIdx} className="px-3 py-3 border-r border-slate-100 last:border-0">
                              <span className={Number(row.data[35 + colIdx]) > 0 ? 'text-indigo-600 font-bold' : 'text-slate-300'}>
                                {Number(row.data[35 + colIdx]) || '-'}
                              </span>
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- TAB OPERASIONAL --- */}
            {activeTab === 'operasional' && (
              <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-sm bg-white">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 backdrop-blur-sm text-center uppercase font-bold text-slate-700 tracking-wider text-[11px] border-b-2 border-slate-200">
                    <tr>
                      <th rowSpan="3" className="px-4 py-3 bg-white border-r-2 border-slate-200 sticky left-0 z-10 w-24 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">Tanggal</th>
                      <th colSpan="10" className="px-4 py-3 bg-slate-100 text-slate-800 border-b border-r-2 border-slate-200 shadow-sm">INFO JAGA (PAGI - SORE)</th>
                      <th colSpan="10" className="px-4 py-3 bg-rose-50/80 text-rose-700 border-b border-slate-200 shadow-sm">SELISIH TOKO (PAGI - SORE)</th>
                    </tr>
                    <tr className="border-b border-slate-200">
                      {Array(2).fill(konterOrder).flat().map((k, i) => (
                        <th key={`head-${i}`} colSpan="2" className="px-2 py-2 bg-white text-slate-700 border-b border-r border-slate-200">{k}</th>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-200">
                      {Array(10).fill(['PG', 'SR']).flat().map((k, i) => (
                        <th key={`sub-${i}`} className={`px-2 py-2 border-r border-slate-200 bg-slate-50 text-slate-500`}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors text-center">
                        <td className="px-4 py-3 font-bold bg-white sticky left-0 z-10 border-r-2 border-slate-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">{row.date}</td>
                        {row.error ? (
                          <td colSpan="20" className="px-4 py-3 text-red-500 font-bold bg-red-50/30">Gagal ambil data</td>
                        ) : (
                          <>
                            {/* Karyawan (55-64) */}
                            {Array.from({length: 10}).map((_, colIdx) => (
                              <td key={`jaga-${colIdx}`} className="px-2 py-3 border-r border-slate-100 truncate max-w-[90px] text-[11px]" title={row.data[55 + colIdx]}>
                                 {row.data[55 + colIdx] === '-' ? <span className="text-slate-300">-</span> : <span className="font-semibold text-slate-800">{row.data[55 + colIdx]}</span>}
                              </td>
                            ))}
                            {/* Selisih (65-74) */}
                            {Array.from({length: 10}).map((_, colIdx) => {
                               const val = Number(row.data[65 + colIdx]) || 0;
                               return (
                                 <td key={`sel-${colIdx}`} className={`px-2 py-3 border-r border-slate-100 last:border-0 ${val < 0 ? 'text-red-600 font-bold bg-red-50/60 shadow-[inset_2px_0_4px_rgba(239,68,68,0.1)]' : val > 0 ? 'text-blue-600 font-bold bg-blue-50/60 shadow-[inset_2px_0_4px_rgba(59,130,246,0.1)]' : 'text-slate-300'}`}>
                                    {val !== 0 ? formatRp(val) : '-'}
                                 </td>
                               );
                            })}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- TAB INSENTIF --- */}
            {activeTab === 'insentif' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
                  <p className="text-sm text-blue-700 font-medium">Data Insentif memerlukan kalkulasi khusus dari file excel harian. Proses ini mungkin memakan waktu ~1 menit.</p>
                  <button 
                    className="px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-sm text-sm"
                    onClick={loadInsentifManual}
                    disabled={progress.show}
                  >
                    {progress.show ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4" />}
                    Muat Data Insentif
                  </button>
                </div>
                
                {Object.keys(reportData.insentifMap).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <HandCoins className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="font-medium text-sm">Belum ada data insentif. Klik "Muat Data Insentif" di atas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(reportData.insentifMap).map(([nama, data]) => (
                      <div key={nama} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
                        <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex justify-between items-center">
                           <span className="font-bold text-emerald-700 text-sm uppercase">{nama}</span>
                           <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold">{data.detil.length} Shift</span>
                        </div>
                        <div className="p-5">
                           <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Insentif</div>
                           <div className="text-2xl font-black text-slate-800">{formatRp(data.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* --- TAB BON & GAJI (INDEPENDENT FROM REPORT ROW LOOP) --- */}
      {(activeTab === 'bon' || activeTab === 'gaji') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
          <div className="flex flex-wrap gap-4 items-center mb-6 border-b border-slate-100 pb-5 justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Periode Data:</span>
              <input 
                type="month" 
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
              />
              {loadingGaji && <div className="flex items-center gap-2 text-primary text-sm font-medium"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>}
            </div>
            
            {/* Opsi Cetak Khusus Gaji */}
            {activeTab === 'gaji' && gajiData && (
              <div className="flex items-center gap-3">
                <button 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  onClick={handlePrintAllToggle}
                >
                  <CheckSquare className="w-4 h-4" /> Pilih Semua
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition shadow-sm"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4" /> Cetak Terpilih
                </button>
              </div>
            )}
          </div>

          {activeTab === 'bon' && (
            <div>
              {gajiData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                   {Object.keys(gajiData.bon || {}).length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed rounded-2xl bg-slate-50/50">
                        <Receipt className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="font-medium text-sm">Tidak ada kasbon tercatat di periode ini.</p>
                      </div>
                   ) : (
                     Object.entries(gajiData.bon).map(([nama, bonData]) => (
                        <div key={nama} className="border border-red-100 bg-red-50/30 rounded-2xl p-5 relative overflow-hidden group hover:border-red-200 transition">
                           <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                           <div className="flex justify-between items-center border-b border-red-100 pb-3 mb-3">
                              <span className="font-bold text-slate-800 uppercase text-sm">{nama}</span>
                              <span className="font-black text-red-600">{formatRp(bonData.total)}</span>
                           </div>
                           <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{bonData.ket || 'Tanpa keterangan'}</div>
                        </div>
                     ))
                   )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 border border-dashed rounded-2xl bg-slate-50/50">Memuat data kasbon...</div>
              )}
            </div>
          )}

          {activeTab === 'gaji' && (
            <div>
               {gajiData ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(gajiData.gaji || {}).map(([nama, gajiCfg]) => {
                       const insentifData = (reportData?.insentifMap?.[nama.toLowerCase()]?.total) || 0;
                       let selisihData = 0;
                       
                       if (reportData && reportData.selisihMap) {
                          const matchingKeys = Object.keys(reportData.selisihMap).filter(k => k.toLowerCase().includes(nama.toLowerCase()));
                          matchingKeys.forEach(k => { selisihData += reportData.selisihMap[k]; });
                       }

                       const kasbon = gajiData.bon[nama.toLowerCase()]?.total || 0;
                       const totalBersih = gajiCfg.gapok + gajiCfg.tunj + insentifData + selisihData - kasbon;

                       const isSelected = selectedPrint[nama];

                       return (
                         <div 
                           key={nama} 
                           onClick={() => togglePrint(nama)}
                           className={`border-2 rounded-2xl overflow-hidden shadow-sm transition cursor-pointer relative group
                             ${isSelected ? 'border-primary shadow-primary/20 bg-blue-50/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                         >
                            <div className="absolute top-4 right-4 z-10 bg-white rounded-full">
                               <input type="checkbox" className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary pointer-events-none" checked={isSelected || false} readOnly />
                            </div>

                            <div className={`p-4 text-white flex justify-between items-center transition-colors ${isSelected ? 'bg-primary' : 'bg-slate-800'}`}>
                               <span className="font-bold text-lg">{nama.toUpperCase()}</span>
                               <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold tracking-wider mr-8">SLIP GAJI</span>
                            </div>
                            <div className="p-5 text-sm space-y-3 font-medium text-slate-600">
                               <div className="flex justify-between"><span>Gaji Pokok</span> <span className="text-slate-800 font-bold">{formatRp(gajiCfg.gapok)}</span></div>
                               <div className="flex justify-between"><span>Tunjangan</span> <span className="text-slate-800 font-bold">{formatRp(gajiCfg.tunj)}</span></div>
                               <div className="flex justify-between"><span>Insentif ACC</span> <span className="text-emerald-600 font-bold">+{formatRp(insentifData)}</span></div>
                               <div className="flex justify-between border-b border-slate-100 pb-3">
                                 <span>Selisih Toko</span> 
                                 <span className={selisihData < 0 ? 'text-red-500 font-bold' : 'text-blue-500 font-bold'}>{selisihData < 0 ? '-' : '+'}{formatRp(Math.abs(selisihData))}</span>
                               </div>
                               
                               {selisihData < 0 && reportData?.selisihDetailsMap && (
                                  <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100 mt-2 space-y-1.5 shadow-sm">
                                    <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-2 border-b border-red-200/50 pb-1">Rincian Minus (Harian)</div>
                                    {Object.keys(reportData.selisihDetailsMap).filter(k => k.includes(nama.toLowerCase())).map(k => 
                                      reportData.selisihDetailsMap[k].filter(d => d.minus < 0).map((d, i) => (
                                        <div key={i} className="flex justify-between text-[11px] text-red-600 font-medium">
                                          <span>{d.tanggal.split(' ')[0]} <span className="text-red-400">({d.toko})</span></span>
                                          <span className="font-bold">-{formatRp(Math.abs(d.minus))}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                               )}
                               
                               <div className="flex justify-between text-red-500 pt-1"><span>Potongan Kasbon</span> <span className="font-bold">-{formatRp(kasbon)}</span></div>
                            </div>
                            <div className={`p-5 border-t transition-colors ${isSelected ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50/80 border-slate-100'}`}>
                               <div className="flex flex-col gap-1">
                                  <span className={`font-bold text-xs tracking-wider uppercase ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>TOTAL DITERIMA</span>
                                  <span className={`text-2xl font-black ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{formatRp(totalBersih)}</span>
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
               ) : (
                 <div className="text-center py-12 text-slate-400 border border-dashed rounded-2xl bg-slate-50/50">Memuat data penggajian...</div>
               )}
            </div>
          )}
        </div>
      )}

      {/* HIDDEN PRINT AREA */}
      <div id="print-area" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-4 z-[9999] min-h-screen">
        <style>{`
          @page { size: A4 portrait; margin: 10mm; }
          .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .slip-print { border: 1px solid #000; padding: 16px; border-radius: 8px; page-break-inside: avoid; }
        `}</style>
        <div className="print-grid">
          {gajiData && activeTab === 'gaji' && Object.entries(gajiData.gaji || {})
            .filter(([nama]) => selectedPrint[nama])
            .map(([nama, gajiCfg]) => {
               const insentifData = (reportData?.insentifMap?.[nama.toLowerCase()]?.total) || 0;
               let selisihData = 0;
               if (reportData && reportData.selisihMap) {
                  const matchingKeys = Object.keys(reportData.selisihMap).filter(k => k.toLowerCase().includes(nama.toLowerCase()));
                  matchingKeys.forEach(k => { selisihData += reportData.selisihMap[k]; });
               }
               const kasbon = gajiData.bon[nama.toLowerCase()]?.total || 0;
               const totalBersih = gajiCfg.gapok + gajiCfg.tunj + insentifData + selisihData - kasbon;

               return (
                 <div key={`print-${nama}`} className="slip-print font-sans">
                    <h3 className="text-center font-black text-xl m-0 p-0 mb-1 border-b-2 border-black pb-2">SLIP GAJI</h3>
                    <div className="flex justify-between items-center mb-4 text-sm font-bold mt-2">
                       <span>NAMA: {nama.toUpperCase()}</span>
                       <span>PERIODE: {filterBulan}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                       <div className="flex justify-between"><span>Gaji Pokok</span> <span>{formatRp(gajiCfg.gapok)}</span></div>
                       <div className="flex justify-between"><span>Tunjangan</span> <span>{formatRp(gajiCfg.tunj)}</span></div>
                       <div className="flex justify-between"><span>Insentif ACC</span> <span>+{formatRp(insentifData)}</span></div>
                       <div className="flex justify-between border-b border-dashed border-black pb-2">
                         <span>Selisih Toko</span> 
                         <span>{selisihData < 0 ? '-' : '+'}{formatRp(Math.abs(selisihData))}</span>
                       </div>
                       
                       {selisihData < 0 && reportData?.selisihDetailsMap && (
                          <div className="border border-black p-2 mt-2 text-xs" style={{marginTop: '4px'}}>
                             <div className="font-bold mb-1 border-b border-black pb-1">Rincian Minus:</div>
                             {Object.keys(reportData.selisihDetailsMap).filter(k => k.includes(nama.toLowerCase())).map(k => 
                               reportData.selisihDetailsMap[k].filter(d => d.minus < 0).map((d, i) => (
                                 <div key={i} className="flex justify-between" style={{fontSize: '10px', marginTop: '2px'}}>
                                   <span>Tgl {d.tanggal.split(' ')[0]} ({d.toko})</span>
                                   <span>-{formatRp(Math.abs(d.minus))}</span>
                                 </div>
                               ))
                             )}
                          </div>
                       )}

                       <div className="flex justify-between pt-1"><span>Potongan Kasbon</span> <span className="font-bold">-{formatRp(kasbon)}</span></div>
                    </div>

                    <div className="flex justify-between items-center font-bold text-lg border-t-2 border-black pt-2">
                       <span>TOTAL DITERIMA</span>
                       <span>{formatRp(totalBersih)}</span>
                    </div>

                    <div className="mt-8 flex justify-between text-center text-sm">
                       <div>
                         <p className="mb-12">Penerima</p>
                         <p>( {nama.toUpperCase()} )</p>
                       </div>
                       <div>
                         <p className="mb-12">Mengetahui</p>
                         <p>( Manajemen )</p>
                       </div>
                    </div>
                 </div>
               );
          })}
        </div>
      </div>

    </div>
  );
}
