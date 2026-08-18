import type { ToastMessage } from '../components/DashboardLayout'

interface Props {
  addToast: (text: string, type?: ToastMessage['type']) => void
}

const stores = [
  { name: 'M1 Pusat', color: '#3B82F6', bg: '#EFF6FF', karyawan: 4, omzet: 4250000, stok: 82 },
  { name: 'M2 Selatan', color: '#10B981', bg: '#ECFDF5', karyawan: 3, omzet: 3100000, stok: 67 },
  { name: 'M3 Utara', color: '#F59E0B', bg: '#FFFBEB', karyawan: 3, omzet: 2750000, stok: 54 },
  { name: 'M4 Barat', color: '#EF4444', bg: '#FEF2F2', karyawan: 2, omzet: 1980000, stok: 38 },
]

const announcements = [
  { id: 1, title: 'Briefing Bulanan Agustus 2026', date: '15 Agu 2026', tag: 'Penting', color: '#EF4444' },
  { id: 2, title: 'Update Harga Voucher XL & Telkomsel', date: '12 Agu 2026', tag: 'Operasional', color: '#0D6EFD' },
  { id: 3, title: 'Jadwal Libur 17 Agustus 2026', date: '10 Agu 2026', tag: 'Umum', color: '#10B981' },
]

const jadwalHariIni = [
  { nama: 'Budi Santoso', shift: 'Pagi 07:00 - 14:00', toko: 'M1', color: '#3B82F6', absen: true },
  { nama: 'Rina Fitriani', shift: 'Pagi 07:00 - 14:00', toko: 'M2', color: '#10B981', absen: false },
  { nama: 'Ahmad Fauzan', shift: 'Sore 14:00 - 21:00', toko: 'M1', color: '#3B82F6', absen: true },
  { nama: 'Dewi Lestari', shift: 'Sore 14:00 - 21:00', toko: 'M3', color: '#F59E0B', absen: true },
]

const performa = [
  { toko: 'M1 Pusat', kemarin: 850000, hariIni: 960000, color: '#3B82F6' },
  { toko: 'M2 Selatan', kemarin: 620000, hariIni: 580000, color: '#10B981' },
  { toko: 'M3 Utara', kemarin: 540000, hariIni: 650000, color: '#F59E0B' },
  { toko: 'M4 Barat', kemarin: 390000, hariIni: 420000, color: '#EF4444' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function DashboardPage({ addToast }: Props) {
  const belumAbsen = jadwalHariIni.filter((j) => !j.absen).length
  const totalKaryawan = stores.reduce((a, s) => a + s.karyawan, 0)
  const totalOmzet = stores.reduce((a, s) => a + s.omzet, 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Konter',
            value: '4 Konter',
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
            label: 'Total Karyawan',
            value: `${totalKaryawan} Orang`,
            sub: 'Aktif di semua konter',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            iconBg: '#ECFDF5',
            accent: '#10B981',
          },
          {
            label: 'Belum Absen',
            value: `${belumAbsen} Orang`,
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
            label: 'Total Omzet Bulan Ini',
            value: fmt(totalOmzet),
            sub: '↑ 8.3% vs bulan lalu',
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
              <h2 className="text-sm font-semibold text-slate-800">Performa Outlet</h2>
              <p className="text-xs text-slate-400">Perbandingan omzet kemarin vs hari ini</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: '#EFF6FF', color: '#0D6EFD' }}>
              Agustus 2026
            </span>
          </div>

          <div className="space-y-4">
            {performa.map((p) => {
              const maxVal = Math.max(...performa.map((x) => Math.max(x.kemarin, x.hariIni)))
              const pctKemarin = (p.kemarin / maxVal) * 100
              const pctHariIni = (p.hariIni / maxVal) * 100
              const naik = p.hariIni >= p.kemarin
              return (
                <div key={p.toko}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-xs font-medium text-slate-700">{p.toko}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{fmt(p.hariIni)}</span>
                      <span
                        className="font-medium"
                        style={{ color: naik ? '#10B981' : '#EF4444' }}
                      >
                        {naik ? '↑' : '↓'} {Math.abs(Math.round(((p.hariIni - p.kemarin) / p.kemarin) * 100))}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full opacity-50"
                        style={{ width: `${pctKemarin}%`, background: p.color }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pctHariIni}%`, background: p.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-1.5 rounded-full bg-slate-300 opacity-50" />
              Kemarin
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-1.5 rounded-full bg-slate-400" />
              Hari ini
            </div>
          </div>
        </div>

        {/* Info Pusat */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Info Pusat</h2>
            <button
              onClick={() => addToast('Pengumuman baru telah dilihat', 'info')}
              className="text-xs font-medium"
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
                  📢
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 leading-tight truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
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
            className="w-full mt-3 py-2 rounded-lg text-xs font-medium text-center"
            style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}
            onClick={() => addToast('Memuat semua pengumuman...', 'info')}
          >
            Lihat Semua Pengumuman
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Cards */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Ringkasan Per Konter</h2>
          <div className="grid grid-cols-2 gap-3">
            {stores.map((s) => (
              <div
                key={s.name}
                className="p-3 rounded-xl"
                style={{ background: s.bg, border: `1px solid ${s.color}22` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-semibold" style={{ color: s.color }}>{s.name}</span>
                </div>
                <p className="text-base font-bold text-slate-800">{fmt(s.omzet)}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{s.karyawan} karyawan</span>
                  <span>{s.stok} item stok</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal Hari Ini */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Jadwal Jaga Hari Ini</h2>
            <span className="text-xs text-slate-400">18 Agustus 2026</span>
          </div>
          <div className="space-y-2.5">
            {jadwalHariIni.map((j) => (
              <div
                key={j.nama}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: j.absen ? '#F8FAFC' : '#FEF9C3', border: `1px solid ${j.absen ? '#E2E8F0' : '#FDE68A'}` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: j.color }}
                >
                  {j.nama.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{j.nama}</p>
                  <p className="text-xs text-slate-400">{j.shift}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: j.absen ? '#DCFCE7' : '#FEF9C3',
                      color: j.absen ? '#15803D' : '#92400E',
                    }}
                  >
                    {j.absen ? '✓ Hadir' : '⏳ Belum'}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${j.color}15`, color: j.color }}
                  >
                    {j.toko}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
