import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, FileSpreadsheet, Check, X, Search } from 'lucide-react';
import { gasService } from '../services/gas';

const typeLabels = {
  'STOK': { label: 'Stok', bg: '#DBEAFE', color: '#1D4ED8' },
  'PERDANA': { label: 'Perdana', bg: '#DBEAFE', color: '#1D4ED8' },
  'VOUCHER': { label: 'Voucher', bg: '#E0E7FF', color: '#4338CA' },
  'AKSESORIS': { label: 'Aksesoris', bg: '#F3E8FF', color: '#7E22CE' },
  'ELEKTRIK': { label: 'Elektrik', bg: '#FFEDD5', color: '#C2410C' },
  'UANG': { label: 'Uang', bg: '#ECFCCB', color: '#4D7C0F' },
  'SYNC STOK AWAL': { label: 'Auto Sync', bg: '#CFFAFE', color: '#0E7490' },
  'UPDATE MASSAL': { label: 'Mass Update', bg: '#E0E7FF', color: '#4F46E5' },
  'LOGIN': { label: 'Login', bg: '#DCFCE7', color: '#15803D' },
  'ADMIN': { label: 'Admin', bg: '#F5F3FF', color: '#6D28D9' },
  'PENGELUARAN': { label: 'Pengeluaran', bg: '#FEE2E2', color: '#DC2626' },
  'JADWAL': { label: 'Jadwal', bg: '#FEF9C3', color: '#92400E' },
  'LAPORAN': { label: 'Laporan', bg: '#F0FDF4', color: '#15803D' },
  'DEFAULT': { label: 'Info', bg: '#F1F5F9', color: '#64748B' },
};

function initials(name) {
  return (name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getColor(name) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  let sum = 0;
  for (let i = 0; i < (name || '').length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

export default function LogAktivitas({ addToast }) {
  const [tanggal, setTanggal] = useState(() => {
    return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await gasService.call('getDataLog', tanggal);
      if (res.error) {
        setErrorMsg(res.message);
      } else {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tanggal]);

  const handleKoreksiToggle = async (item, currentStatus) => {
    const newStatus = currentStatus === 'TRUE' || currentStatus === true ? false : true;
    setLogs(prev => prev.map(log => {
      if (log.realRow === item.realRow) {
        const newData = [...log.data];
        newData[8] = newStatus;
        return { ...log, data: newData };
      }
      return log;
    }));

    try {
      const index = item.realRow - 2;
      const res = await gasService.call('updateLogKoreksi', index, newStatus);
      if (res.error) throw new Error(res.message);
    } catch (err) {
      addToast && addToast("Gagal mengupdate koreksi: " + err.message, 'error');
      fetchLogs();
    }
  };

  const filteredLogs = logs.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.data.some(val => String(val).toLowerCase().includes(query));
  });

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Log Aktivitas</h1>
          <p className="text-sm text-slate-500">Pencatatan riwayat perubahan data sistem</p>
        </div>
      </div>

      {/* Header & Filter */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Pilih Tanggal:</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={tanggal}
                max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                onChange={(e) => setTanggal(e.target.value)}
                className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
            <input 
              type="text" 
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-primary w-48 sm:w-64 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-400">{filteredLogs.length} aktivitas</p>
          <button
            onClick={() => { fetchLogs(); addToast && addToast('Log diperbarui', 'info') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 bg-slate-200 rounded w-32"></div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: i < 5 ? '1px solid #F1F5F9' : 'none' }}>
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 rounded-full w-16"></div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="h-2 bg-slate-200 rounded w-10"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : errorMsg ? (
        <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center text-red-500 text-center" style={{ border: '1px solid #E2E8F0' }}>
          <p className="font-semibold text-sm mb-1">Terjadi Kesalahan</p>
          <p className="text-xs">{errorMsg}</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center text-slate-500 text-center" style={{ border: '1px solid #E2E8F0' }}>
          <Search className="w-12 h-12 text-slate-200 mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">Pencarian Tidak Ditemukan</h3>
          <p className="text-xs max-w-sm">Tidak ada log yang cocok dengan kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {filteredLogs.map((item, i) => {
              const [waktuFull, email, konter, kategori, produk, komentar, status, koreksi] = item.data;
              const isKoreksi = String(koreksi).toUpperCase() === 'TRUE';
              const waktuStr = waktuFull ? waktuFull.split(' ')[1] || waktuFull : '-';
              
              const typeKey = (kategori || '').toUpperCase();
              const t = typeLabels[typeKey] || typeLabels['DEFAULT'];
              const uColor = getColor(email || 'User');

              return (
                <div
                  key={item.realRow}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 group transition-colors"
                  style={{ borderBottom: i < logs.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: uColor }}
                  >
                    {initials(email || 'Anon')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800">{email || 'User'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: t.bg, color: t.color }}>
                        {t.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-2">
                      <span className="font-medium text-slate-700">{produk || '-'}</span>
                      {komentar && <span className="text-slate-400">- {komentar}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">{waktuStr}</p>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: uColor }}>{konter || '-'}</p>
                      <p className={`text-[9px] font-bold mt-0.5 ${String(status).toLowerCase().includes('sukses') ? 'text-emerald-500' : 'text-red-500'}`}>{status || '-'}</p>
                    </div>
                    <button
                      onClick={() => handleKoreksiToggle(item, koreksi)}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                        isKoreksi 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 opacity-0 group-hover:opacity-100'
                      }`}
                      title={isKoreksi ? "Tandai sudah dikoreksi" : "Tandai butuh koreksi"}
                    >
                      {isKoreksi ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
