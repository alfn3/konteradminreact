import React, { useEffect, useState } from 'react';
import { gasService } from '../services/gas';
import { Loader2 } from 'lucide-react';

const announcements = [
  { id: 1, title: 'Briefing Bulanan Agustus 2026', date: '15 Agu 2026', tag: 'Penting', color: '#EF4444' },
  { id: 2, title: 'Update Harga Voucher XL & Telkomsel', date: '12 Agu 2026', tag: 'Operasional', color: '#0D6EFD' },
  { id: 3, title: 'Jadwal Libur 17 Agustus 2026', date: '10 Agu 2026', tag: 'Umum', color: '#10B981' },
];

const jadwalHariIni = [
  { nama: 'Budi Santoso', shift: 'Pagi 07:00 - 14:00', toko: 'M1', color: '#3B82F6', absen: true },
  { nama: 'Rina Fitriani', shift: 'Pagi 07:00 - 14:00', toko: 'M2', color: '#10B981', absen: false },
  { nama: 'Ahmad Fauzan', shift: 'Sore 14:00 - 21:00', toko: 'M1', color: '#3B82F6', absen: true },
  { nama: 'Dewi Lestari', shift: 'Sore 14:00 - 21:00', toko: 'M3', color: '#F59E0B', absen: true },
];

function fmt(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard({ addToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await gasService.call('getDashboardStats');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
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
  const totalOmzet = laporan.reduce((a, s) => a + (s.omset || 0), 0);

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
              <h2 className="text-sm font-semibold text-slate-800">Performa Outlet (Kemarin)</h2>
              <p className="text-xs text-slate-400">Rincian Laporan {data.tglKemarin}</p>
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
                <div key={p.toko}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-medium text-slate-700 capitalize">{p.toko}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{fmt(p.omset)}</span>
                      <span
                        className="font-medium px-1.5 py-0.5 rounded"
                        style={{ background: p.selisih >= 0 ? '#DCFCE7' : '#FEE2E2', color: p.selisih >= 0 ? '#10B981' : '#EF4444' }}
                      >
                        Selisih: {fmt(p.selisih)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {laporan.length === 0 && <p className="text-center text-sm text-slate-400 py-4">Data tidak tersedia</p>}
          </div>
        </div>

        {/* Info Pusat */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Info Pusat</h2>
            <button
              onClick={() => addToast && addToast('Pengumuman baru telah dilihat', 'info')}
              className="text-xs font-medium cursor-pointer"
              style={{ color: '#0D6EFD' }}
            >
              Tandai dibaca
            </button>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="flex gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50"
                style={{ border: '1px solid #F1F5F9' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm"
                  style={{ background: a.color }}
                >
                  📣
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 leading-tight truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: `${a.color}15`, color: a.color }}
                    >
                      {a.tag}
                    </span>
                    <span className="text-xs text-slate-400">{a.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full mt-3 py-2 rounded-lg text-xs font-medium text-center cursor-pointer"
            style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}
            onClick={() => addToast && addToast('Memuat semua pengumuman...', 'info')}
          >
            Lihat Semua Pengumuman
          </button>
        </div>
      </div>

      {/* Jadwal Hari Ini (Mock) */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Jadwal Jaga Hari Ini (Simulasi)</h2>
          <span className="text-xs text-slate-400">{new Date().toLocaleDateString('id-ID')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jadwalHariIni.map((j) => (
            <div
              key={j.nama}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: j.absen ? '#F8FAFC' : '#FEF9C3', border: `1px solid ${j.absen ? '#E2E8F0' : '#FDE68A'}` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: j.color }}
              >
                {j.nama.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{j.nama}</p>
                <p className="text-xs text-slate-500 truncate">{j.shift}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${j.color}15`, color: j.color }}
                  >
                    {j.toko}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: j.absen ? '#DCFCE7' : '#FEF9C3',
                      color: j.absen ? '#15803D' : '#92400E',
                    }}
                  >
                    {j.absen ? '✓ Hadir' : '⚠️ Belum'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
