import React, { useEffect, useState } from 'react';
import { gasService } from '../services/gas';
import { Loader2 } from 'lucide-react';



function fmt(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard({ addToast }) {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await gasService.call('getDashboardStats');
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const logRes = await gasService.call('getLogDashboard');
      if (logRes && logRes.success && Array.isArray(logRes.data)) {
        setLogs(logRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    // Jalankan secara berurutan agar Google Apps Script tidak memblokir (ERR_FAILED / CORS)
    // karena terlalu banyak request serentak ke endpoint yang sama.
    fetchDashboard().then(() => {
      fetchLogs();
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
              </div>
              <div>
                <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="h-4 bg-slate-200 rounded w-40 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 w-full"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="h-4 bg-slate-200 rounded w-32 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ border: '1px solid #F1F5F9' }}>
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-red-500">Gagal memuat data dashboard.</div>;
  }

  const stats = data.stats || {};
  const laporan = data.laporan || [];
  const totalOmzet = data.finance?.now?.omset || laporan.reduce((a, s) => a + (s.omset || 0), 0);
  const totalMargin = data.finance?.now?.margin || laporan.reduce((a, s) => a + (s.margin || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Konter',
            value: `${stats.konter || 0} Konter`,
            sub: 'Semua aktif beroperasi',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0D6EFD" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
            iconBg: '#EFF6FF',
            accent: '#0D6EFD',
          },
          {
            label: 'Info Pusat',
            value: `${stats.info || 0} Info`,
            sub: 'Info aktif saat ini',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            ),
            iconBg: '#ECFDF5',
            accent: '#10B981',
          },
          {
            label: 'Belum Absen',
            value: `${stats.belumAbsen || 0} Orang`,
            sub: 'Perlu tindak lanjut',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            iconBg: '#FFFBEB',
            accent: '#F59E0B',
            alert: true,
          },
          {
            label: 'Total Omzet Kemarin',
            value: fmt(totalOmzet),
            sub: `Tanggal: ${data.tglKemarin || '-'}`,
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#8B5CF6" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            iconBg: '#F5F3FF',
            accent: '#8B5CF6',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-4 flex flex-col gap-3"
            style={{
              border: card.alert ? '1px solid #FDE68A' : '1px solid #E2E8F0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.iconBg }}
              >
                {card.icon}
              </div>
              {card.alert && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FEF9C3', color: '#92400E' }}>
                  Peringatan
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{card.label}</p>
              <p className="text-xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs mt-0.5" style={{ color: card.alert ? '#D97706' : '#64748B' }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performa Konter */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Ringkasan Per Konter</h2>
              <p className="text-xs text-slate-400">Rincian Laporan {data.tglKemarin} x {data.tglLalu}</p>
            </div>
            <button 
              onClick={fetchDashboard}
              className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer flex items-center" 
              style={{ background: '#EFF6FF', color: '#0D6EFD' }}
            >
              Refresh Data
            </button>
          </div>

          <div className="space-y-4">
            {laporan.map((p, i) => {
              const maxVal = Math.max(...laporan.map((x) => x.omset || 0));
              const pct = maxVal > 0 ? ((p.omset || 0) / maxVal) * 100 : 0;
              const color = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5];
              return (
                <div key={p.toko} className="bg-white border border-slate-100 rounded-lg p-3 transition-all hover:shadow-sm hover:border-slate-200">
                  <div className="flex justify-between items-center mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-bold text-slate-700 capitalize">{p.toko}</span>
                        {p.jaga && <span className="text-[10px] text-slate-400">({p.jaga})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                        <span>Bulan Lalu: <span className="font-semibold text-slate-600">{fmt(p.omsetPrev)}</span></span>
                        {p.omsetPrev > 0 && (() => {
                          const diff = (p.omset || 0) - p.omsetPrev;
                          const pctDiff = (Math.abs(diff) / p.omsetPrev) * 100;
                          const isUp = diff >= 0;
                          return (
                            <span className={`font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isUp ? '▲' : '▼'} {pctDiff.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">{fmt(p.omset)}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${p.selisih >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Selisih: {fmt(p.selisih)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
            {laporan.length === 0 && <p className="text-center text-sm text-slate-400 py-4">Data tidak tersedia</p>}
          </div>
        </div>

        {/* Aktivitas Log Terbaru */}
        <div className="bg-white rounded-xl p-5 flex flex-col" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Aktivitas Log Terbaru</h2>
            <button
              onClick={() => fetchLogs()}
              className="text-xs font-medium cursor-pointer flex items-center gap-1"
              style={{ color: '#0D6EFD' }}
            >
              {loadingLogs ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {loadingLogs ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-4">
                Tidak ada log aktivitas hari ini.
              </div>
            ) : (
              logs.map((log, idx) => {
                const ts = log[0] ? log[0].split(' ')[1] : '';
                const konter = log[2] || '';
                const aksi = log[3] || '';
                const komen = log[5] || '';
                const isSuccess = log[6] === 'Sukses';
                return (
                  <div key={idx} className="flex gap-3 text-sm border-b border-slate-50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <div>
                      <p className="text-slate-700 font-medium capitalize">{konter} <span className="font-normal text-slate-500 normal-case">{aksi}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">{ts} • {komen}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Jadwal Hari Ini (Mock) */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Jadwal Jaga Hari Ini</h2>
          <span className="text-xs text-slate-400">{new Date().toLocaleDateString('id-ID')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.laporan?.filter(l => l.jaga && l.jaga !== '-').map((j, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-blue-500"
              >
                {j.jaga.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate capitalize">{j.jaga}</p>
                <p className="text-xs text-slate-500 truncate uppercase">{j.toko}</p>
              </div>
            </div>
          ))}
          {(!data?.laporan || data.laporan.filter(l => l.jaga && l.jaga !== '-').length === 0) && (
            <div className="col-span-full p-4 text-center text-slate-500 text-sm">
              Belum ada karyawan yang tercatat jaga hari ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
