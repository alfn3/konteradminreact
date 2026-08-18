import type { ToastMessage } from '../components/DashboardLayout'

interface Props {
  addToast: (text: string, type?: ToastMessage['type']) => void
}

const konter = [
  { kode: 'M1', nama: 'M1 Pusat', alamat: 'Jl. Merdeka No. 12, Jakarta Pusat', telp: '021-5551234', karyawan: 4, omzet: 4250000, color: '#3B82F6', bg: '#EFF6FF', status: 'Aktif', buka: '07:00', tutup: '21:00', kepala: 'Budi Santoso' },
  { kode: 'M2', nama: 'M2 Selatan', alamat: 'Jl. Raya Kebayoran No. 5, Jakarta Selatan', telp: '021-7778901', karyawan: 3, omzet: 3100000, color: '#10B981', bg: '#ECFDF5', status: 'Aktif', buka: '08:00', tutup: '21:00', kepala: 'Rina Fitriani' },
  { kode: 'M3', nama: 'M3 Utara', alamat: 'Jl. Sunter Indah Blok C No. 3, Jakarta Utara', telp: '021-6664567', karyawan: 3, omzet: 2750000, color: '#F59E0B', bg: '#FFFBEB', status: 'Aktif', buka: '07:30', tutup: '21:00', kepala: 'Dewi Lestari' },
  { kode: 'M4', nama: 'M4 Barat', alamat: 'Jl. Puri Kembangan No. 18, Jakarta Barat', telp: '021-5889012', karyawan: 2, omzet: 1980000, color: '#EF4444', bg: '#FEF2F2', status: 'Aktif', buka: '08:00', tutup: '20:00', kepala: 'Hendra Wijaya' },
]

function fmtRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
}

export default function DataKonterPage({ addToast }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {konter.map((k) => (
          <div
            key={k.kode}
            className="bg-white rounded-xl overflow-hidden"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            {/* Card header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: k.bg, borderBottom: `2px solid ${k.color}` }}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: k.color }}
              >
                {k.kode}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">{k.nama}</h3>
                <p className="text-xs text-slate-500">{k.alamat}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#DCFCE7', color: '#15803D' }}>
                {k.status}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              {[
                { label: 'Karyawan', value: `${k.karyawan} orang` },
                { label: 'Omzet Bulan Ini', value: fmtRp(k.omzet) },
                { label: 'Jam Operasional', value: `${k.buka}–${k.tutup}` },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
                  <p className="text-xs font-semibold text-slate-800">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {k.telp}
                <span className="text-slate-300">·</span>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Kepala: {k.kepala}
              </div>
              <button
                onClick={() => addToast(`Membuka detail konter ${k.nama}...`, 'info')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: k.bg, color: k.color, border: `1px solid ${k.color}33` }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Detail →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
