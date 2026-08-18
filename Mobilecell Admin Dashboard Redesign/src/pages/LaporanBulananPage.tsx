import { useState } from 'react'
import type { ToastMessage } from '../components/DashboardLayout'

interface Props {
  addToast: (text: string, type?: ToastMessage['type']) => void
}

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus']

const laporanData = [
  { bulan: 'Juli 2026', m1: 4100000, m2: 2950000, m3: 2600000, m4: 1820000 },
  { bulan: 'Juni 2026', m1: 3900000, m2: 3200000, m3: 2400000, m4: 1950000 },
  { bulan: 'Mei 2026', m1: 4300000, m2: 2800000, m3: 2750000, m4: 2100000 },
  { bulan: 'April 2026', m1: 3700000, m2: 2600000, m3: 2300000, m4: 1700000 },
]

const storeColors = { m1: '#3B82F6', m2: '#10B981', m3: '#F59E0B', m4: '#EF4444' }
const storeNames = { m1: 'M1 Pusat', m2: 'M2 Selatan', m3: 'M3 Utara', m4: 'M4 Barat' }

function fmtRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
}

export default function LaporanBulananPage({ addToast }: Props) {
  const [selectedMonth, setSelectedMonth] = useState('Juli')

  const latestData = laporanData[0]
  const total = latestData.m1 + latestData.m2 + latestData.m3 + latestData.m4
  const maxVal = Math.max(latestData.m1, latestData.m2, latestData.m3, latestData.m4)

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-3 flex-wrap" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <span className="text-xs font-medium text-slate-500">Pilih Bulan:</span>
        <div className="flex gap-1.5 flex-wrap">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: selectedMonth === m ? '#0D6EFD' : '#F1F5F9',
                color: selectedMonth === m ? '#fff' : '#64748B',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={() => addToast('Laporan berhasil diekspor ke PDF', 'success')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#0F172A' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1E293B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['m1', 'm2', 'm3', 'm4'] as const).map((key) => {
          const val = latestData[key]
          const pct = Math.round((val / total) * 100)
          const color = storeColors[key]
          return (
            <div
              key={key}
              className="bg-white rounded-xl p-4"
              style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color }}>{storeNames[key]}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${color}15`, color }}>{pct}%</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{fmtRp(val)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${(val / maxVal) * 100}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Rekap Laporan Bulanan</h2>
          <span className="text-xs text-slate-400">Tahun 2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Bulan</th>
                {(['m1', 'm2', 'm3', 'm4'] as const).map((key) => (
                  <th key={key} className="px-5 py-3 text-left font-semibold" style={{ color: storeColors[key] }}>
                    {storeNames[key]}
                  </th>
                ))}
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Total</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {laporanData.map((row, i) => {
                const rowTotal = row.m1 + row.m2 + row.m3 + row.m4
                return (
                  <tr
                    key={row.bulan}
                    className="hover:bg-slate-50"
                    style={{ borderBottom: i < laporanData.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800">{row.bulan}</td>
                    {(['m1', 'm2', 'm3', 'm4'] as const).map((key) => (
                      <td key={key} className="px-5 py-3.5 tabular-nums text-slate-700">{fmtRp(row[key])}</td>
                    ))}
                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">{fmtRp(rowTotal)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => addToast(`Detail laporan ${row.bulan} dibuka`, 'info')}
                        className="text-xs font-medium px-3 py-1 rounded-lg"
                        style={{ background: '#EFF6FF', color: '#0D6EFD' }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
