import React, { useEffect, useState } from 'react';
import { gasService } from '../services/gas';
import { X, Calendar as CalendarIcon, User, Phone, MapPin, Briefcase, Activity, CheckCircle, XCircle } from 'lucide-react';



function fmtRp(n) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

function initials(name) {
  return (name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function ManajemenSDM({ addToast }) {
  const [dataValidasi, setDataValidasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [storeColors, setStoreColors] = useState({});

  const fetchSDM = async () => {
    setLoading(true);
    try {
      const res = await gasService.call('getDataValidasi');
      if (res.success) {
        // Filter out empty rows where name (row[1]) is missing
        const validRows = res.data.filter(row => row && row[1] && String(row[1]).trim() !== '');
        
        const mapped = validRows.map((row, idx) => ({
          id: idx,
          nama: String(row[1]).trim(),
          nik: '-',
          jabatan: row[2] || 'Staff',
          toko: row[3] || '-',
          status: row[4] || 'aktif',
          gaji: 0,
          masuk: row[0]?.substring(0, 10) || '-',
          hp: '-',
          validasi: 'tervalidasi'
        }));
        setDataValidasi(mapped);
        
        if (res.options?.konterColors) {
          setStoreColors(res.options.konterColors);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSDM();
  }, []);

  const filtered = dataValidasi.filter(
    (k) => filterStatus === 'semua' || k.status.toLowerCase() === filterStatus || k.validasi === filterStatus
  );

  // Generate Dynamic Jadwal from Active Employees
  const activeStaff = dataValidasi.filter(k => k.status.toLowerCase() === 'aktif');
  
  const dynamicJadwal = [];
  if (activeStaff.length > 0) {
    dynamicJadwal.push({
      hari: 'Jadwal Karyawan Aktif',
      shifts: activeStaff.map(k => {
        const jbt = (k.jabatan || '').toLowerCase();
        let jam = '-';
        if (jbt.includes('pagi')) jam = '07:00 - 14:00';
        else if (jbt.includes('sore')) jam = '14:00 - 21:00';
        else if (jbt.includes('full')) jam = '07:00 - 21:00';
        
        return {
          nama: k.nama,
          shift: (k.jabatan === '-' || !k.jabatan) ? 'Belum Diatur' : k.jabatan,
          jam,
          toko: k.toko
        };
      })
    });
  }

  const validasiKaryawan = (id, status) => {
    addToast && addToast(
      status === 'tervalidasi' ? 'Karyawan berhasil divalidasi' : 'Validasi ditolak',
      status === 'tervalidasi' ? 'success' : 'error'
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64 mb-6"></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-8 bg-slate-200 rounded-full w-full max-w-sm mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4" style={{ border: '1px solid #E2E8F0' }}>
                <div className="w-11 h-11 rounded-xl bg-slate-200 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded-full w-16"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 h-96">
            <div className="h-5 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
               <div className="h-12 bg-slate-200 rounded-xl"></div>
               <div className="h-12 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Container utama: 2 kolom (Karyawan & Jadwal) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: Profil Karyawan & Status Validasi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Data Karyawan
            </h2>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
              {[
                { value: 'semua', label: 'Semua' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide uppercase transition-all ${filterStatus === f.value ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((k) => {
              const color = storeColors[k.toko] || '#64748B';
              return (
                <div
                  key={k.id}
                  onClick={() => setSelected(k)}
                  className="bg-white rounded-xl p-4 cursor-pointer flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-200 group"
                  style={{ border: '1px solid #E2E8F0' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm"
                    style={{ background: color }}
                  >
                    {initials(k.nama)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{k.nama}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">{k.jabatan}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}15`, color }}>
                        {k.toko}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                      style={{
                        background: k.status === 'aktif' ? '#ECFDF5' : '#F8FAFC',
                        color: k.status === 'aktif' ? '#059669' : '#64748B',
                        border: `1px solid ${k.status === 'aktif' ? '#A7F3D0' : '#E2E8F0'}`
                      }}
                    >
                      {k.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
                Tidak ada data karyawan.
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: Jadwal Jaga */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> Jadwal Jaga
            </h2>
          </div>

          <div className="space-y-5">
            {dynamicJadwal.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
                Belum ada karyawan aktif untuk dijadwalkan.
              </div>
            ) : (
              dynamicJadwal.map((hari) => (
                <div key={hari.hari} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   {hari.hari}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hari.shifts.map((s, i) => {
                    const color = storeColors[s.toko] || '#64748B';
                    const isPagi = s.shift === 'Pagi';
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ 
                          background: isPagi ? '#FFFBEB' : '#EFF6FF', 
                          border: `1px solid ${isPagi ? '#FEF08A' : '#BFDBFE'}`,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                          style={{ background: color }}
                        >
                          {initials(s.nama)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{s.nama}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm"
                              style={{ background: isPagi ? '#FEF9C3' : '#DBEAFE', color: isPagi ? '#92400E' : '#1D4ED8' }}
                            >
                              {s.shift} {s.jam}
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{ background: `${color}20`, color }}
                        >
                          {s.toko}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Detail Profil Karyawan */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative pt-8 pb-6 px-6 text-center" style={{ background: storeColors[selected.toko] || '#64748B' }}>
              <button 
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-lg" style={{ color: storeColors[selected.toko] || '#64748B' }}>
                {initials(selected.nama)}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{selected.nama}</h3>
              <p className="text-white/80 text-sm font-medium">{selected.jabatan}</p>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4 bg-slate-50 flex-1">
              <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Penempatan Konter</p>
                    <p className="text-sm font-bold text-slate-800">{selected.toko}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Nomor Handphone</p>
                    <p className="text-sm font-semibold text-slate-800">{selected.hp || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Status Pekerjaan</p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{selected.status}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Tanggal Masuk</p>
                    <p className="text-sm font-semibold text-slate-800">{selected.masuk}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
               <button
                 onClick={() => {
                   validasiKaryawan(selected.id, 'ditolak');
                   setSelected(null);
                 }}
                 className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
               >
                 <XCircle className="w-4 h-4" /> Tolak
               </button>
               <button
                 onClick={() => {
                   validasiKaryawan(selected.id, 'tervalidasi');
                   setSelected(null);
                 }}
                 className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
               >
                 <CheckCircle className="w-4 h-4" /> Validasi
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
