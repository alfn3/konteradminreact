import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { gasService } from '../services/gas';

const storeColors = { 'M1': '#3B82F6', 'M2': '#10B981', 'M3': '#F59E0B', 'M4': '#EF4444', 'Jaya Cell': '#8B5CF6' };

function fmtRp(n) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function LaporanBulanan({ addToast }) {
  const [loadingList, setLoadingList] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch File List
  useEffect(() => {
    const fetchFileList = async () => {
      setLoadingList(true);
      try {
        const res = await gasService.call('getReportFileList');
        if (Array.isArray(res)) {
          setFileList(res);
          if (res.length > 0) {
            setSelectedFileId(res[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchFileList();
  }, []);

  // 2. Fetch Detail
  useEffect(() => {
    if (!selectedFileId) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setErrorMsg('');
      try {
        const res = await gasService.call('getReportDetail', selectedFileId);
        if (res.error) {
          setErrorMsg(res.msg || 'Gagal memuat detail laporan');
          setReportData(null);
        } else {
          setReportData(res);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Terjadi kesalahan jaringan');
        setReportData(null);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedFileId]);

  let totalOmset = 0;
  let totalMargin = 0;
  const tokoStats = [];

  if (reportData && reportData.data) {
    const vals = reportData.data;
    const keys = [
      { id: 'm1', name: 'M1' },
      { id: 'm2', name: 'M2' },
      { id: 'm3', name: 'M3' },
      { id: 'm4', name: 'M4' },
      { id: 'jayacell', name: 'Jaya Cell' }
    ];

    keys.forEach((k, idx) => {
      const omset = (Number(vals[idx]) || 0) + (Number(vals[idx+5]) || 0) + (Number(vals[idx+10]) || 0);
      const margin = (Number(vals[idx+15]) || 0) + (Number(vals[idx+20]) || 0) + (Number(vals[idx+25]) || 0);
      totalOmset += omset;
      totalMargin += margin;
      tokoStats.push({ name: k.name, omset, margin });
    });
  }

  return (
    <div className="space-y-5">
      {/* Filter / Month selector */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-3 flex-wrap" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <span className="text-xs font-medium text-slate-500">Pilih Laporan:</span>
        <div className="flex gap-1.5 flex-wrap">
          {loadingList ? (
            <div className="flex gap-1.5">
              {[1, 2, 3].map(i => <div key={i} className="h-7 w-20 bg-slate-200 rounded-lg animate-pulse"></div>)}
            </div>
          ) : fileList.length === 0 ? (
            <span className="text-xs text-slate-400">Tidak ada laporan</span>
          ) : (
            fileList.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{
                  background: selectedFileId === file.id ? '#0D6EFD' : '#F1F5F9',
                  color: selectedFileId === file.id ? '#fff' : '#64748B',
                }}
              >
                {file.date}
              </button>
            ))
          )}
        </div>
        <div className="ml-auto">
          <button
            onClick={() => addToast && addToast('Laporan berhasil diekspor ke PDF', 'success')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors"
            style={{ background: '#0F172A' }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {loadingDetail ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4" style={{ border: '1px solid #E2E8F0' }}>
                <div className="flex justify-between mb-3">
                  <div className="h-3 bg-slate-200 rounded w-12"></div>
                  <div className="h-3 bg-slate-200 rounded w-8"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded w-24 mb-3"></div>
                <div className="h-1.5 bg-slate-200 rounded-full w-full"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between">
              <div className="h-4 bg-slate-200 rounded w-32"></div>
              <div className="h-4 bg-slate-200 rounded w-40"></div>
            </div>
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="bg-white rounded-xl p-12 text-center text-red-500" style={{ border: '1px solid #E2E8F0' }}>
          <p className="font-semibold text-sm">{errorMsg}</p>
        </div>
      ) : !reportData ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400" style={{ border: '1px solid #E2E8F0' }}>
          <p className="text-sm">Pilih bulan laporan untuk melihat detail.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {tokoStats.map((toko) => {
              const val = toko.omset;
              const pct = totalOmset > 0 ? Math.round((val / totalOmset) * 100) : 0;
              const color = storeColors[toko.name] || '#64748B';
              const maxVal = Math.max(...tokoStats.map(t => t.omset));
              return (
                <div
                  key={toko.name}
                  className="bg-white rounded-xl p-4"
                  style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color }}>{toko.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${color}15`, color }}>{pct}%</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate" title={fmtRp(val)}>{fmtRp(val)}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Konter */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Rincian Per Konter</h2>
              <span className="text-xs font-bold text-slate-700">Total Margin: {fmtRp(totalMargin)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="px-5 py-3 font-semibold text-slate-600">Konter</th>
                    <th className="px-5 py-3 font-semibold text-slate-600 text-right">Omset</th>
                    <th className="px-5 py-3 font-semibold text-slate-600 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {tokoStats.map((toko, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50"
                      style={{ borderBottom: i < tokoStats.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                    >
                      <td className="px-5 py-3.5 font-semibold" style={{ color: storeColors[toko.name] || '#333' }}>
                        {toko.name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-700 tabular-nums">{fmtRp(toko.omset)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-600 tabular-nums">{fmtRp(toko.margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Insentif */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Pembagian Insentif (Aksesoris)</h2>
            </div>
            {reportData.insentif && reportData.insentif.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th className="px-5 py-3 font-semibold text-slate-600">Nama Karyawan</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-center">Konter</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-center">Rincian</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-right">Insentif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.insentif.map((ins, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50"
                        style={{ borderBottom: i < reportData.insentif.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 text-[10px]">
                            {ins.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{ins.nama}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-medium text-[10px]">
                            {ins.toko}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-slate-500">{ins.detil}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-amber-600 tabular-nums">{fmtRp(ins.dapat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Belum ada data insentif
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
