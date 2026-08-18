import React, { useEffect, useState } from 'react';
import { gasService } from '../services/gas';

const storeColors = {
  'M1 Pusat': '#3B82F6',
  'M2 Selatan': '#10B981',
  'M3 Utara': '#F59E0B',
  'M4 Barat': '#EF4444',
  'm1': '#3B82F6',
  'm2': '#10B981',
  'm3': '#F59E0B',
  'm4': '#EF4444',
};

const jadwalMock = [
  { hari: 'Senin, 18 Agu', shifts: [
    { nama: 'Budi Santoso', shift: 'Pagi', jam: '07:00-14:00', toko: 'M1 Pusat' },
    { nama: 'Rina Fitriani', shift: 'Pagi', jam: '07:00-14:00', toko: 'M2 Selatan' },
    { nama: 'Ahmad Fauzan', shift: 'Sore', jam: '14:00-21:00', toko: 'M1 Pusat' },
    { nama: 'Dewi Lestari', shift: 'Sore', jam: '14:00-21:00', toko: 'M3 Utara' },
  ]},
  { hari: 'Selasa, 19 Agu', shifts: [
    { nama: 'Ahmad Fauzan', shift: 'Pagi', jam: '07:00-14:00', toko: 'M1 Pusat' },
    { nama: 'Dewi Lestari', shift: 'Pagi', jam: '07:00-14:00', toko: 'M3 Utara' },
    { nama: 'Budi Santoso', shift: 'Sore', jam: '14:00-21:00', toko: 'M1 Pusat' },
    { nama: 'Hendra Wijaya', shift: 'Sore', jam: '14:00-21:00', toko: 'M4 Barat' },
  ]}
];

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
  const [tab, setTab] = useState('karyawan');
  const [filterStatus, setFilterStatus] = useState('semua');

  const fetchSDM = async () => {
    setLoading(true);
    try {
      const res = await gasService.call('getDataValidasi');
      if (res.success) {
        // Map from [timestamp, nama, shift/jabatan, toko, status]
        const mapped = res.data.map((row, idx) => ({
          id: idx,
          nama: row[1] || 'Anonim',
          nik: '-',
          jabatan: row[2] || 'Staff',
          toko: row[3] || 'M1 Pusat',
          status: row[4] || 'aktif',
          gaji: 0,
          masuk: row[0]?.substring(0, 10) || '-',
          hp: '-',
          validasi: 'tervalidasi'
        }));
        setDataValidasi(mapped);
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
    (k) => filterStatus === 'semua' || k.status === filterStatus || k.validasi === filterStatus
  );

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
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
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', height: 'fit-content' }}>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 flex-shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-2 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between border-b border-slate-50 pb-2">
                  <div className="h-2 bg-slate-200 rounded w-16"></div>
                  <div className="h-2 bg-slate-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab */}
      <div className="flex gap-1.5 bg-white rounded-xl p-1.5 w-fit" style={{ border: '1px solid #E2E8F0' }}>
        {[
          { id: 'karyawan', label: 'Data Karyawan' },
          { id: 'jadwal', label: 'Jadwal Jaga' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            style={{
              background: tab === t.id ? '#0D6EFD' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748B',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'karyawan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'semua', label: 'Semua' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                  style={{
                    background: filterStatus === f.value ? '#0F172A' : '#fff',
                    color: filterStatus === f.value ? '#fff' : '#64748B',
                    border: filterStatus === f.value ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filtered.map((k) => {
              const color = storeColors[k.toko] || '#64748B';
              const isSelected = selected?.id === k.id;
              return (
                <div
                  key={k.id}
                  onClick={() => setSelected(isSelected ? null : k)}
                  className="bg-white rounded-xl p-4 cursor-pointer flex items-center gap-4 transition-all"
                  style={{
                    border: isSelected ? '1px solid #0D6EFD' : '1px solid #E2E8F0',
                    boxShadow: isSelected ? '0 0 0 3px rgba(13,110,253,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: color }}
                  >
                    {initials(k.nama)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{k.nama}</p>
                      <span className="text-xs text-slate-400">{k.nik}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">{k.jabatan}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}15`, color }}>
                        {k.toko}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: k.status === 'aktif' ? '#ECFDF5' : '#F1F5F9',
                        color: k.status === 'aktif' ? '#15803D' : '#94A3B8',
                      }}
                    >
                      {k.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-slate-400 p-4">Tidak ada data karyawan.</p>}
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {selected ? (
              <div>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: storeColors[selected.toko] || '#64748B' }}
                  >
                    {initials(selected.nama)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selected.nama}</h3>
                    <p className="text-xs text-slate-400">{selected.nik} - {selected.jabatan}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Konter', value: selected.toko },
                    { label: 'Status', value: selected.status },
                    { label: 'No. HP', value: selected.hp },
                    { label: 'Tanggal Masuk', value: selected.masuk },
                  ].map((info) => (
                    <div key={info.label} className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-500">{info.label}</span>
                      <span className="font-medium text-slate-800">{info.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addToast && addToast('Membuka form edit profil...', 'info')}
                  className="w-full mt-4 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Edit Profil Karyawan
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-sm font-medium mt-3">Pilih karyawan</p>
                <p className="text-xs text-center mt-1">Klik kartu karyawan untuk melihat detail profil</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'jadwal' && (
        <div className="space-y-4">
          {jadwalMock.map((hari) => (
            <div key={hari.hari} className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">{hari.hari}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hari.shifts.map((s, i) => {
                  const color = storeColors[s.toko] || '#64748B';
                  const isPagi = s.shift === 'Pagi';
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: isPagi ? '#FFFBEB' : '#EFF6FF', border: `1px solid ${isPagi ? '#FDE68A' : '#BFDBFE'}` }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: color }}
                      >
                        {initials(s.nama)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{s.nama}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: isPagi ? '#FEF9C3' : '#DBEAFE', color: isPagi ? '#92400E' : '#1D4ED8' }}
                          >
                            {s.shift} {s.jam}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: `${color}15`, color }}
                      >
                        {s.toko.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
