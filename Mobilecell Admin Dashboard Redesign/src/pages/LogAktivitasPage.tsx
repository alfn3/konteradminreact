import type { ToastMessage } from '../components/DashboardLayout'

interface Props {
  addToast: (text: string, type?: ToastMessage['type']) => void
}

const logs = [
  { id: 1, user: 'Budi Santoso', action: 'Update stok Perdana Telkomsel', toko: 'M1 Pusat', waktu: '08:35', tgl: 'Hari ini', type: 'stok', color: '#3B82F6' },
  { id: 2, user: 'Rina Fitriani', action: 'Login ke sistem', toko: 'M2 Selatan', waktu: '08:12', tgl: 'Hari ini', type: 'auth', color: '#10B981' },
  { id: 3, user: 'Admin Pusat', action: 'Tambah pengumuman baru: Briefing Agustus', toko: 'Pusat', waktu: '07:58', tgl: 'Hari ini', type: 'admin', color: '#8B5CF6' },
  { id: 4, user: 'Dewi Lestari', action: 'Input laporan stok harian', toko: 'M3 Utara', waktu: '07:45', tgl: 'Hari ini', type: 'stok', color: '#F59E0B' },
  { id: 5, user: 'Hendra Wijaya', action: 'Tambah pengeluaran operasional Rp 50.000', toko: 'M4 Barat', waktu: '07:30', tgl: 'Hari ini', type: 'keuangan', color: '#EF4444' },
  { id: 6, user: 'Ahmad Fauzan', action: 'Login ke sistem', toko: 'M1 Pusat', waktu: '21:05', tgl: 'Kemarin', type: 'auth', color: '#3B82F6' },
  { id: 7, user: 'Admin Pusat', action: 'Validasi karyawan: Dewi Lestari', toko: 'Pusat', waktu: '16:30', tgl: 'Kemarin', type: 'admin', color: '#8B5CF6' },
  { id: 8, user: 'Budi Santoso', action: 'Update jadwal jaga minggu ke-3', toko: 'M1 Pusat', waktu: '14:15', tgl: 'Kemarin', type: 'jadwal', color: '#3B82F6' },
  { id: 9, user: 'Rina Fitriani', action: 'Input laporan stok harian', toko: 'M2 Selatan', waktu: '13:50', tgl: 'Kemarin', type: 'stok', color: '#10B981' },
  { id: 10, user: 'Admin Pusat', action: 'Export laporan bulanan Juli 2026', toko: 'Pusat', waktu: '10:00', tgl: 'Kemarin', type: 'laporan', color: '#8B5CF6' },
]

const typeLabels: Record<string, { label: string; bg: string; color: string }> = {
  stok: { label: 'Stok', bg: '#DBEAFE', color: '#1D4ED8' },
  auth: { label: 'Login', bg: '#DCFCE7', color: '#15803D' },
  admin: { label: 'Admin', bg: '#F5F3FF', color: '#6D28D9' },
  keuangan: { label: 'Keuangan', bg: '#FEE2E2', color: '#DC2626' },
  jadwal: { label: 'Jadwal', bg: '#FEF9C3', color: '#92400E' },
  laporan: { label: 'Laporan', bg: '#F0FDF4', color: '#15803D' },
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function LogAktivitasPage({ addToast }: Props) {
  const grouped: Record<string, typeof logs> = {}
  logs.forEach((l) => {
    if (!grouped[l.tgl]) grouped[l.tgl] = []
    grouped[l.tgl].push(l)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{logs.length} aktivitas tercatat</p>
        <button
          onClick={() => addToast('Log berhasil diekspor', 'success')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Log
        </button>
      </div>

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{date}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {items.map((log, i) => {
              const t = typeLabels[log.type]
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: log.color }}
                  >
                    {initials(log.user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800">{log.user}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: t.bg, color: t.color }}>
                        {t.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{log.action}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{log.waktu}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: log.color }}>{log.toko}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
