import { useState } from 'react'
import type { ToastMessage } from '../components/DashboardLayout'

interface Props {
  addToast: (text: string, type?: ToastMessage['type']) => void
}

interface Karyawan {
  id: number
  nama: string
  nik: string
  jabatan: string
  toko: string
  status: 'aktif' | 'tidak aktif'
  gaji: number
  masuk: string
  hp: string
  validasi: 'tervalidasi' | 'pending' | 'ditolak'
}

const storeColors: Record<string, string> = {
  'M1 Pusat': '#3B82F6',
  'M2 Selatan': '#10B981',
  'M3 Utara': '#F59E0B',
  'M4 Barat': '#EF4444',
}

const karyawanData: Karyawan[] = [
  { id: 1, nama: 'Budi Santoso', nik: 'MC-001', jabatan: 'Kasir', toko: 'M1 Pusat', status: 'aktif', gaji: 2800000, masuk: '2023-03-01', hp: '0812-3456-7890', validasi: 'tervalidasi' },
  { id: 2, nama: 'Rina Fitriani', nik: 'MC-002', jabatan: 'Penjaga Toko', toko: 'M2 Selatan', status: 'aktif', gaji: 2600000, masuk: '2023-06-15', hp: '0813-9876-5432', validasi: 'pending' },
  { id: 3, nama: 'Ahmad Fauzan', nik: 'MC-003', jabatan: 'Kasir', toko: 'M1 Pusat', status: 'aktif', gaji: 2750000, masuk: '2022-11-20', hp: '0857-1234-5678', validasi: 'tervalidasi' },
  { id: 4, nama: 'Dewi Lestari', nik: 'MC-004', jabatan: 'Penjaga Toko', toko: 'M3 Utara', status: 'aktif', gaji: 2500000, masuk: '2024-01-10', hp: '0821-5678-9012', validasi: 'tervalidasi' },
  { id: 5, nama: 'Hendra Wijaya', nik: 'MC-005', jabatan: 'Kasir', toko: 'M4 Barat', status: 'aktif', gaji: 2650000, masuk: '2023-09-05', hp: '0856-2345-6789', validasi: 'ditolak' },
  { id: 6, nama: 'Sari Indah', nik: 'MC-006', jabatan: 'Penjaga Toko', toko: 'M2 Selatan', status: 'tidak aktif', gaji: 0, masuk: '2022-08-01', hp: '0819-3456-7890', validasi: 'pending' },
]

const jadwal = [
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
  ]},
  { hari: 'Rabu, 20 Agu', shifts: [
    { nama: 'Dewi Lestari', shift: 'Pagi', jam: '07:00-14:00', toko: 'M3 Utara' },
    { nama: 'Hendra Wijaya', shift: 'Pagi', jam: '07:00-14:00', toko: 'M4 Barat' },
    { nama: 'Rina Fitriani', shift: 'Sore', jam: '14:00-21:00', toko: 'M2 Selatan' },
    { nama: 'Ahmad Fauzan', shift: 'Sore', jam: '14:00-21:00', toko: 'M1 Pusat' },
  ]},
]

function fmtRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
}
function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function ManajemenSDMPage({ addToast }: Props) {
  const [selected, setSelected] = useState<Karyawan | null>(null)
  const [tab, setTab] = useState<'karyawan' | 'jadwal'>('karyawan')
  const [filterStatus, setFilterStatus] = useState('semua')

  const filtered = karyawanData.filter(
    (k) => filterStatus === 'semua' || k.status === filterStatus || k.validasi === filterStatus
  )

  const validasiKaryawan = (id: number, status: 'tervalidasi' | 'ditolak') => {
    addToast(
      status === 'tervalidasi' ? '✅ Karyawan berhasil divalidasi' : '❌ Validasi ditolak',
      status === 'tervalidasi' ? 'success' : 'error'
    )
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
            onClick={() => setTab(t.id as 'karyawan' | 'jadwal')}
            className="px-5 py-2 rounded-lg text-xs font-semibold"
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
                { value: 'pending', label: 'Pending Validasi' },
                { value: 'ditolak', label: 'Ditolak' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
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
              const color = storeColors[k.toko] || '#64748B'
              const isSelected = selected?.id === k.id
              return (
                <div
                  key={k.id}
                  onClick={() => setSelected(isSelected ? null : k)}
                  className="bg-white rounded-xl p-4 cursor-pointer flex items-center gap-4"
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
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}15`, color }}>
                        {k.toko}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: k.validasi === 'tervalidasi' ? '#DCFCE7' : k.validasi === 'pending' ? '#FEF9C3' : '#FEE2E2',
                        color: k.validasi === 'tervalidasi' ? '#15803D' : k.validasi === 'pending' ? '#92400E' : '#DC2626',
                      }}
                    >
                      {k.validasi === 'tervalidasi' ? '✓ Valid' : k.validasi === 'pending' ? '⏳ Pending' : '✕ Ditolak'}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: k.status === 'aktif' ? '#ECFDF5' : '#F1F5F9',
                        color: k.status === 'aktif' ? '#15803D' : '#94A3B8',
                      }}
                    >
                      {k.status}
                    </span>
                  </div>
                </div>
              )
            })}
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
                    <p className="text-xs text-slate-400">{selected.nik} · {selected.jabatan}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Konter', value: selected.toko },
                    { label: 'Status', value: selected.status },
                    { label: 'No. HP', value: selected.hp },
                    { label: 'Tanggal Masuk', value: selected.masuk },
                    { label: 'Gaji Pokok', value: selected.gaji > 0 ? fmtRp(selected.gaji) : '-' },
                  ].map((info) => (
                    <div key={info.label} className="flex items-center justify-between">
                      <span className="text-slate-500">{info.label}</span>
                      <span className="font-medium text-slate-800">{info.value}</span>
                    </div>
                  ))}
                </div>

                {selected.validasi === 'pending' && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Tindakan Validasi</p>
                    <button
                      onClick={() => { validasiKaryawan(selected.id, 'tervalidasi'); setSelected(null) }}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white"
                      style={{ background: '#10B981' }}
                    >
                      ✓ Setujui & Validasi
                    </button>
                    <button
                      onClick={() => { validasiKaryawan(selected.id, 'ditolak'); setSelected(null) }}
                      className="w-full py-2 rounded-lg text-xs font-semibold"
                      style={{ background: '#FEE2E2', color: '#DC2626' }}
                    >
                      ✕ Tolak
                    </button>
                  </div>
                )}

                <button
                  onClick={() => addToast('Membuka form edit profil...', 'info')}
                  className="w-full mt-4 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Edit Profil Karyawan
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm font-medium mt-3">Pilih karyawan</p>
                <p className="text-xs text-center mt-1">Klik kartu karyawan untuk melihat detail profil</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'jadwal' && (
        <div className="space-y-4">
          {jadwal.map((hari) => (
            <div key={hari.hari} className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">{hari.hari}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hari.shifts.map((s, i) => {
                  const color = storeColors[s.toko] || '#64748B'
                  const isPagi = s.shift === 'Pagi'
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
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: isPagi ? '#FEF9C3' : '#DBEAFE', color: isPagi ? '#92400E' : '#1D4ED8' }}
                          >
                            {s.shift} {s.jam}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: `${color}15`, color }}
                      >
                        {s.toko.split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
