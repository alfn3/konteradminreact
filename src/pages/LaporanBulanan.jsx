import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { gasService } from '../services/gas';

const formatRp = (angka) => 'Rp ' + new Intl.NumberFormat('id-ID').format(angka || 0);
const storeColors = { 'M1': '#EF4444', 'M2': '#F59E0B', 'M3': '#10B981', 'M4': '#3B82F6', 'Jaya Cell': '#0dcaf0' };

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
    fetchList();
  }, []);

  const startLoadReport = async () => {
    if (fileList.length === 0) {
      addToast && addToast('Tidak ada data bulan ini', 'error');
      return;
    }

    setProgress({ show: true, current: 0, total: fileList.length, text: 'Memulai unduhan data...' });
    
    const aggregated = {
      chartData: { labels: [], omset: [], margin: [], storeMargin: [0, 0, 0, 0, 0] },
      rows: [],
      insentifRaw: [],
      insentifMap: {},
      selisihMap: {},
      hadirMap: {},
      totalTerjual: 0
    };

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setProgress({ show: true, current: i + 1, total: fileList.length, text: `Memuat: ${file.date}` });
      
      try {
        const res = await gasService.call('getReportDetail', file.id);
        if (res && res.success && res.data) {
          aggregated.rows.push({ date: file.date, data: res.data });
          
          // Agregasi Chart & Terjual
          let dailyOmset = 0;
          for(let k=0; k<15; k++) dailyOmset += (Number(res.data[k]) || 0);
          
          let dailyMargin = 0;
          [30, 31, 32, 33, 34].forEach((idx, storeIdx) => {
             const val = Number(res.data[idx]) || 0;
             dailyMargin += val;
             aggregated.chartData.storeMargin[storeIdx] += val; 
          });
          
          for(let k=35; k<50; k++) aggregated.totalTerjual += (Number(res.data[k]) || 0);
          
          aggregated.chartData.labels.push(file.date);
          aggregated.chartData.omset.push(dailyOmset);
          aggregated.chartData.margin.push(dailyMargin);

          // Agregasi Insentif
          if (res.insentif && res.insentif.length > 0) {
            res.insentif.forEach(ins => {
              const nm = ins.nama.trim();
              if(!aggregated.insentifMap[nm]) aggregated.insentifMap[nm] = { total: 0, detil: [] };
              aggregated.insentifMap[nm].total += ins.dapat;
              aggregated.insentifMap[nm].detil.push({ date: file.date, toko: ins.toko, rincian: ins.detil, dapat: ins.dapat });
            });
          }

          // Agregasi Operasional
          const mapToko = [
            { nama: 'M1', selisih: [65, 66], jaga: [55, 56] }, 
            { nama: 'M2', selisih: [67, 68], jaga: [57, 58] },
            { nama: 'M3', selisih: [69, 70], jaga: [59, 60] },
            { nama: 'M4', selisih: [71, 72], jaga: [61, 62] },
            { nama: 'Jaya', selisih: [73, 74], jaga: [63, 64] }
          ];

          mapToko.forEach(st => {
            for(let j=0; j<2; j++) {
              const idxJ = st.jaga[j];
              const idxS = st.selisih[j];
              const rawN = res.data[idxJ];
              const valS = Number(res.data[idxS]) || 0;
              if (rawN && rawN !== '-' && rawN !== '0') {
                const names = String(rawN).split(/[\/&,]| dan /i).map(n=>n.trim()).filter(n=>n);
                const uniq = [...new Set(names)];
                if (uniq.length > 0) {
                  const pOrang = valS / uniq.length;
                  uniq.forEach(n => {
                    aggregated.hadirMap[n] = (aggregated.hadirMap[n] || 0) + 1;
                    if(valS !== 0) {
                      aggregated.selisihMap[n] = (aggregated.selisihMap[n] || 0) + pOrang;
                    }
                  });
                }
              }
            }
          });

        } else {
          aggregated.rows.push({ date: file.date, error: true });
        }
      } catch (err) {
        aggregated.rows.push({ date: file.date, error: true });
      }
    }

    setProgress({ show: false, current: 0, total: 0, text: '' });
    setReportData(aggregated);
  };

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

  return (
    <div className="space-y-4 pb-10">
      
      {/* Header Info */}
      <div className="bg-white rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-3 shadow-sm border border-slate-200">
        <div>
          <h2 className="font-bold text-lg text-slate-800">Laporan Bulanan & Penggajian</h2>
          <p className="text-sm text-slate-500">Terdapat {fileList.length} data harian bulan ini siap direkap.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            className="btn btn-primary w-full md:w-auto flex items-center justify-center gap-2"
            onClick={startLoadReport}
            disabled={progress.show || loadingList}
          >
            {progress.show ? <Loader2 className="w-4 h-4 animate-spin" /> : <i className="fa-solid fa-play"></i>}
            {progress.show ? 'Merekap...' : 'Muat Data'}
          </button>
        </div>
      </div>

      {progress.show && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
            <span>{progress.text}</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}></div>
          </div>
        </div>
      )}

      {reportData && !progress.show && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* TABS */}
          <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar bg-slate-50">
            {[
              { id: 'grafik', name: 'Grafik', icon: 'fa-chart-bar' },
              { id: 'omset', name: 'Data Omset', icon: 'fa-wallet' },
              { id: 'margin', name: 'Data Margin', icon: 'fa-sack-dollar' },
              { id: 'terjual', name: 'Barang Terjual', icon: 'fa-box-open' },
              { id: 'operasional', name: 'Operasional', icon: 'fa-users' },
              { id: 'insentif', name: 'Insentif', icon: 'fa-hand-holding-dollar' },
              { id: 'bon', name: 'Data Kasbon', icon: 'fa-file-invoice-dollar' },
              { id: 'gaji', name: 'Slip Gaji', icon: 'fa-envelope-open-text' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <i className={`fa-solid ${tab.icon}`}></i> {tab.name}
              </button>
            ))}
          </div>

          <div className="p-4 overflow-x-auto">
            {/* --- TAB GRAFIK --- */}
            {activeTab === 'grafik' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                     <div className="text-blue-500 font-bold mb-1">Total Omset Bulan Ini</div>
                     <div className="text-2xl font-black text-slate-800">{formatRp(reportData.chartData.omset.reduce((a,b)=>a+b,0))}</div>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                     <div className="text-green-500 font-bold mb-1">Total Margin Bulan Ini</div>
                     <div className="text-2xl font-black text-slate-800">{formatRp(reportData.chartData.margin.reduce((a,b)=>a+b,0))}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                     <div className="text-amber-500 font-bold mb-1">Total Item Terjual</div>
                     <div className="text-2xl font-black text-slate-800">{reportData.totalTerjual} Item</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {konterOrder.map((k, i) => (
                    <div key={k} className="p-3 border border-slate-200 rounded-xl text-center shadow-sm">
                       <div className="text-xs font-bold text-slate-500 uppercase">{k} Margin</div>
                       <div className="font-bold text-slate-800">{formatRp(reportData.chartData.storeMargin[i])}</div>
                    </div>
                  ))}
                </div>
                <div className="p-12 text-center text-slate-400 border border-dashed rounded-xl bg-slate-50">
                   <p>Data grafik siap. (Visualisasi chart belum diimplementasikan untuk simplifikasi, namun datanya sudah diagregasi)</p>
                </div>
              </div>
            )}

            {/* --- TAB OMSET --- */}
            {activeTab === 'omset' && (
              <table className="table table-sm table-bordered align-middle text-[11px] mb-0" style={{ minWidth: '1200px' }}>
                <thead className="table-light text-center align-middle">
                  <tr>
                    <th rowSpan="2" className="bg-slate-100 position-sticky start-0 z-1" style={{width:'80px'}}>TANGGAL</th>
                    <th colSpan="5" className="bg-primary bg-opacity-10 text-primary">OMSET P&VC</th>
                    <th colSpan="5" className="bg-warning bg-opacity-10 text-warning">OMSET ACC</th>
                    <th colSpan="5" className="bg-info bg-opacity-10 text-info">OMSET ELEKTRIK</th>
                  </tr>
                  <tr>
                    {Array(3).fill(konterOrder).flat().map((k, i) => <th key={i} className="text-muted">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="text-end">
                      <td className="text-center fw-bold bg-white position-sticky start-0 z-1 border-end shadow-sm" style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                      {row.error ? (
                        <td colSpan="15" className="text-center text-danger">Gagal ambil data</td>
                      ) : (
                        Array.from({length: 15}).map((_, colIdx) => (
                          <td key={colIdx}>{formatRp(Number(row.data[colIdx]))}</td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* --- TAB MARGIN --- */}
            {activeTab === 'margin' && (
              <table className="table table-sm table-bordered align-middle text-[11px] mb-0" style={{ minWidth: '1500px' }}>
                <thead className="table-light text-center align-middle">
                  <tr>
                    <th rowSpan="2" className="bg-slate-100 position-sticky start-0 z-1" style={{width:'80px'}}>TANGGAL</th>
                    <th colSpan="5" className="bg-primary bg-opacity-10 text-primary">MARGIN P&VC</th>
                    <th colSpan="5" className="bg-warning bg-opacity-10 text-warning">MARGIN ACC</th>
                    <th colSpan="5" className="bg-info bg-opacity-10 text-info">MARGIN ELEKTRIK</th>
                    <th colSpan="5" className="bg-success bg-opacity-10 text-success">TOTAL MARGIN</th>
                  </tr>
                  <tr>
                    {Array(4).fill(konterOrder).flat().map((k, i) => <th key={i} className="text-muted">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="text-end">
                      <td className="text-center fw-bold bg-white position-sticky start-0 z-1 border-end shadow-sm" style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                      {row.error ? (
                        <td colSpan="20" className="text-center text-danger">Gagal ambil data</td>
                      ) : (
                        Array.from({length: 20}).map((_, colIdx) => (
                          <td key={colIdx} className={colIdx >= 15 ? 'fw-bold text-success' : ''}>{formatRp(Number(row.data[15 + colIdx]))}</td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* --- TAB TERJUAL --- */}
            {activeTab === 'terjual' && (
              <table className="table table-sm table-bordered align-middle text-[11px] mb-0" style={{ minWidth: '1000px' }}>
                <thead className="table-light text-center align-middle">
                  <tr>
                    <th rowSpan="2" className="bg-slate-100 position-sticky start-0 z-1" style={{width:'80px'}}>TANGGAL</th>
                    <th colSpan="5" className="bg-primary bg-opacity-10 text-primary">TERJUAL VC</th>
                    <th colSpan="5" className="bg-warning bg-opacity-10 text-warning">TERJUAL SP</th>
                    <th colSpan="5" className="bg-info bg-opacity-10 text-info">TERJUAL ACC</th>
                  </tr>
                  <tr>
                    {Array(3).fill(konterOrder).flat().map((k, i) => <th key={i} className="text-muted">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="text-center">
                      <td className="fw-bold bg-white position-sticky start-0 z-1 border-end shadow-sm" style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                      {row.error ? (
                        <td colSpan="15" className="text-center text-danger">Gagal ambil data</td>
                      ) : (
                        Array.from({length: 15}).map((_, colIdx) => (
                          <td key={colIdx}>{Number(row.data[35 + colIdx]) || 0}</td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* --- TAB OPERASIONAL --- */}
            {activeTab === 'operasional' && (
              <table className="table table-sm table-bordered align-middle text-[11px] mb-0" style={{ minWidth: '1500px' }}>
                <thead className="table-light text-center align-middle">
                  <tr>
                    <th rowSpan="2" className="bg-slate-100 position-sticky start-0 z-1" style={{width:'80px'}}>TANGGAL</th>
                    <th colSpan="10" className="bg-secondary bg-opacity-10">INFO JAGA (PAGI - SORE)</th>
                    <th colSpan="10" className="bg-danger bg-opacity-10 text-danger">SELISIH TOKO (PAGI - SORE)</th>
                  </tr>
                  <tr>
                    {Array(2).fill(konterOrder.flatMap(k => [k + ' Pg', k + ' Sr'])).flat().map((k, i) => <th key={i} className="text-muted">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="text-center">
                      <td className="fw-bold bg-white position-sticky start-0 z-1 border-end shadow-sm" style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                      {row.error ? (
                        <td colSpan="20" className="text-center text-danger">Gagal ambil data</td>
                      ) : (
                        <>
                          {/* Info Jaga (55-64) */}
                          {Array.from({length: 10}).map((_, colIdx) => (
                            <td key={`jaga-${colIdx}`} className="text-truncate" style={{maxWidth: '100px'}} title={row.data[55 + colIdx]}>{row.data[55 + colIdx] || '-'}</td>
                          ))}
                          {/* Selisih (65-74) */}
                          {Array.from({length: 10}).map((_, colIdx) => {
                             const val = Number(row.data[65 + colIdx]) || 0;
                             return (
                               <td key={`sel-${colIdx}`} className={val < 0 ? 'text-danger fw-bold' : val > 0 ? 'text-primary fw-bold' : ''}>
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
            )}

            {/* --- TAB INSENTIF --- */}
            {activeTab === 'insentif' && (
              <div className="space-y-4">
                {Object.keys(reportData.insentifMap).length === 0 ? (
                  <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl">Belum ada data insentif ACC bulan ini.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(reportData.insentifMap).map(([nama, data]) => (
                      <div key={nama} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="bg-primary bg-opacity-10 p-3 border-b border-primary border-opacity-20 flex justify-between items-center">
                           <span className="font-bold text-primary text-sm">{nama}</span>
                           <span className="badge bg-primary rounded-pill">{data.detil.length} Shift</span>
                        </div>
                        <div className="p-3 bg-white">
                           <div className="text-xs text-slate-500 mb-1">Total Insentif Didapat</div>
                           <div className="text-lg font-black text-slate-800">{formatRp(data.total)}</div>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex gap-4 items-center mb-4 border-b border-slate-100 pb-4">
            <span className="text-sm font-semibold text-slate-700">Pilih Bulan:</span>
            <input 
              type="month" 
              className="form-control form-control-sm w-48"
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
            />
            {loadingGaji && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>

          {activeTab === 'bon' && (
            <div>
              {gajiData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.keys(gajiData.bon || {}).length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-slate-500 border border-dashed rounded-xl">Tidak ada kasbon tercatat di bulan ini.</div>
                   ) : (
                     Object.entries(gajiData.bon).map(([nama, bonData]) => (
                        <div key={nama} className="border border-red-200 bg-red-50 rounded-xl p-4">
                           <div className="flex justify-between border-b border-red-200 pb-2 mb-2">
                              <span className="font-bold text-red-700">{nama.toUpperCase()}</span>
                              <span className="font-bold text-red-700">{formatRp(bonData.total)}</span>
                           </div>
                           <div className="text-xs text-red-600 whitespace-pre-wrap">{bonData.ket || '-'}</div>
                        </div>
                     ))
                   )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">Memuat data...</div>
              )}
            </div>
          )}

          {activeTab === 'gaji' && (
            <div>
               {gajiData ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(gajiData.gaji || {}).map(([nama, gajiCfg]) => {
                       const insentifData = (reportData?.insentifMap?.[nama.toLowerCase()]?.total) || 0;
                       let selisihData = 0;
                       
                       if (reportData && reportData.selisihMap) {
                          const matchingKeys = Object.keys(reportData.selisihMap).filter(k => k.toLowerCase().includes(nama.toLowerCase()));
                          matchingKeys.forEach(k => { selisihData += reportData.selisihMap[k]; });
                       }

                       const kasbon = gajiData.bon[nama.toLowerCase()]?.total || 0;
                       const totalBersih = gajiCfg.gapok + gajiCfg.tunj + insentifData + selisihData - kasbon;

                       return (
                         <div key={nama} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-800 p-3 text-white flex justify-between">
                               <span className="font-bold">{nama.toUpperCase()}</span>
                               <span className="badge bg-white text-dark">Gajian</span>
                            </div>
                            <div className="p-3 text-sm space-y-2">
                               <div className="flex justify-between"><span>Gaji Pokok:</span> <span className="font-semibold">{formatRp(gajiCfg.gapok)}</span></div>
                               <div className="flex justify-between"><span>Tunjangan:</span> <span className="font-semibold">{formatRp(gajiCfg.tunj)}</span></div>
                               <div className="flex justify-between"><span>Insentif ACC:</span> <span className="font-semibold text-success">+{formatRp(insentifData)}</span></div>
                               <div className="flex justify-between border-b pb-2"><span>Selisih Toko:</span> <span className={selisihData < 0 ? 'text-danger font-semibold' : 'text-primary font-semibold'}>{selisihData < 0 ? '-' : '+'}{formatRp(Math.abs(selisihData))}</span></div>
                               
                               <div className="flex justify-between text-danger"><span>Kasbon/Bon:</span> <span className="font-semibold">-{formatRp(kasbon)}</span></div>
                            </div>
                            <div className="bg-slate-50 p-3 border-t border-slate-200">
                               <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-500">TOTAL DITERIMA</span>
                                  <span className="text-xl font-black text-slate-800">{formatRp(totalBersih)}</span>
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-400">Memuat data...</div>
               )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
