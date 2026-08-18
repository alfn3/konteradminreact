import { useState } from 'react'
import type { ToastMessage } from '../components/DashboardLayout'

interface Props {
  addToast: (text: string, type?: ToastMessage['type']) => void
}

type Tab = 'perdana' | 'voucher' | 'aksesoris' | 'pengeluaran' | 'uang' | 'elektrik'

const tabs: { id: Tab; label: string }[] = [
  { id: 'perdana', label: 'Perdana' },
  { id: 'voucher', label: 'Voucher' },
  { id: 'aksesoris', label: 'Aksesoris' },
  { id: 'pengeluaran', label: 'Pengeluaran' },
  { id: 'uang', label: 'Uang' },
  { id: 'elektrik', label: 'Elektrik' },
]

const stores = ['Semua Konter', 'M1 Pusat', 'M2 Selatan', 'M3 Utara', 'M4 Barat']
const storeColors: Record<string, string> = {
  'M1 Pusat': '#3B82F6',
  'M2 Selatan': '#10B981',
  'M3 Utara': '#F59E0B',
  'M4 Barat': '#EF4444',
}

interface StokItem {
  id: number
  nama: string
  awal: number
  topup: number
  akhir: number
  laku: number
  harga: number
  toko: string
}

const initialData: StokItem[] = [
  { id: 1, nama: 'Perdana Telkomsel', awal: 50, topup: 20, akhir: 70, laku: 35, harga: 5000, toko: 'M1 Pusat' },
  { id: 2, nama: 'Perdana XL Axiata', awal: 30, topup: 10, akhir: 40, laku: 18, harga: 4000, toko: 'M2 Selatan' },
  { id: 3, nama: 'Perdana Indosat IM3', awal: 25, topup: 15, akhir: 40, laku: 22, harga: 4500, toko: 'M1 Pusat' },
  { id: 4, nama: 'Perdana By.U', awal: 20, topup: 0, akhir: 20, laku: 8, harga: 10000, toko: 'M3 Utara' },
  { id: 5, nama: 'Perdana Smartfren', awal: 15, topup: 5, akhir: 20, laku: 6, harga: 3000, toko: 'M4 Barat' },
  { id: 6, nama: 'Perdana Axis', awal: 40, topup: 20, akhir: 60, laku: 30, harga: 3500, toko: 'M2 Selatan' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID').format(n)
}
function fmtRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
}

interface ModalState {
  open: boolean
  mode: 'edit' | 'tambah'
  item: Partial<StokItem>
}

export default function StokProdukPage({ addToast }: Props) {
  const [tab, setTab] = useState<Tab>('perdana')
  const [selectedStore, setSelectedStore] = useState('Semua Konter')
  const [data, setData] = useState<StokItem[]>(initialData)
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'tambah', item: {} })
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const filtered = data.filter(
    (d) => selectedStore === 'Semua Konter' || d.toko === selectedStore
  )

  const selisih = filtered.reduce((a, d) => a + (d.akhir - d.laku) * d.harga, 0)
  const jaga = 'Budi Santoso'

  const openEdit = (item: StokItem) => {
    setModal({ open: true, mode: 'edit', item: { ...item } })
  }
  const openTambah = () => {
    setModal({ open: true, mode: 'tambah', item: { awal: 0, topup: 0, laku: 0, harga: 0, toko: 'M1 Pusat' } })
  }
  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  const saveModal = () => {
    const item = modal.item as StokItem
    if (modal.mode === 'edit') {
      setData((prev) => prev.map((d) => (d.id === item.id ? { ...item, akhir: (item.awal || 0) + (item.topup || 0) } : d)))
      addToast('✅ Stok berhasil diupdate', 'success')
    } else {
      const newItem: StokItem = {
        ...item,
        id: Date.now(),
        nama: item.nama || 'Produk Baru',
        akhir: (item.awal || 0) + (item.topup || 0),
      } as StokItem
      setData((prev) => [...prev, newItem])
      addToast('✅ Produk baru berhasil ditambahkan', 'success')
    }
    closeModal()
  }

  const deleteItem = (id: number) => {
    setData((prev) => prev.filter((d) => d.id !== id))
    addToast('Item stok dihapus', 'info')
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            defaultValue="2026-08-18"
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
          />
        </div>

        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none"
        >
          {stores.map((s) => <option key={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Jaga: {jaga}
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: selisih >= 0 ? '#ECFDF5' : '#FEF2F2', color: selisih >= 0 ? '#15803D' : '#DC2626' }}
        >
          Selisih: {fmtRp(selisih)}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openTambah}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#0D6EFD' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0B5ED7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0D6EFD')}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: tab === t.id ? '#0D6EFD' : '#fff',
              color: tab === t.id ? '#fff' : '#64748B',
              border: tab === t.id ? '1px solid #0D6EFD' : '1px solid #E2E8F0',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm font-medium">Belum ada data stok</p>
            <p className="text-xs">Tambah produk untuk memulai pencatatan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Nama Produk', 'Konter', 'Awal', 'Topup', 'Akhir', 'Laku', 'Harga Satuan', 'Total', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const total = row.laku * row.harga
                  const storeColor = storeColors[row.toko] || '#64748B'
                  return (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: hoveredRow === row.id ? '#F8FAFC' : i % 2 === 0 ? '#fff' : '#FAFBFD',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{row.nama}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${storeColor}15`, color: storeColor }}>
                          {row.toko}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{fmt(row.awal)}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{fmt(row.topup)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{fmt(row.akhir)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-medium text-blue-600">{fmt(row.laku)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtRp(row.harga)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{fmtRp(total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(row)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600"
                            style={{ background: '#F1F5F9' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.color = '#2563EB' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B' }}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteItem(row.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500"
                            style={{ background: '#F1F5F9' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B' }}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                  <td colSpan={7} className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">Total Pendapatan:</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900 tabular-nums">
                    {fmtRp(filtered.reduce((a, d) => a + d.laku * d.harga, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: modal.mode === 'edit' ? '#0D6EFD' : '#0F172A' }}
            >
              <h3 className="text-white font-semibold text-sm">
                {modal.mode === 'edit' ? '✏️ Edit Stok Produk' : '➕ Tambah Produk Baru'}
              </h3>
              <button onClick={closeModal} className="text-white opacity-70 hover:opacity-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Nama Produk</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50"
                  value={modal.item.nama || ''}
                  onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, nama: e.target.value } }))}
                  placeholder="Nama produk..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Stok Awal</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50"
                    value={modal.item.awal || 0}
                    onChange={(e) => {
                      const awal = Number(e.target.value)
                      setModal((m) => ({ ...m, item: { ...m.item, awal, akhir: awal + (m.item.topup || 0) } }))
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Topup</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50"
                    value={modal.item.topup || 0}
                    onChange={(e) => {
                      const topup = Number(e.target.value)
                      setModal((m) => ({ ...m, item: { ...m.item, topup, akhir: (m.item.awal || 0) + topup } }))
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Stok Akhir (otomatis)</label>
                <div
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}
                >
                  {fmt((modal.item.awal || 0) + (modal.item.topup || 0))} unit
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Stok Laku</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50"
                    value={modal.item.laku || 0}
                    onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, laku: Number(e.target.value) } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50"
                    value={modal.item.harga || 0}
                    onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, harga: Number(e.target.value) } }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Konter</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50"
                  value={modal.item.toko || 'M1 Pusat'}
                  onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, toko: e.target.value } }))}
                >
                  {['M1 Pusat', 'M2 Selatan', 'M3 Utara', 'M4 Barat'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              {modal.item.laku !== undefined && modal.item.harga !== undefined && (
                <div className="p-3 rounded-lg text-xs flex items-center justify-between" style={{ background: '#ECFDF5', border: '1px solid #86EFAC' }}>
                  <span className="text-green-700 font-medium">Estimasi Pendapatan:</span>
                  <span className="font-bold text-green-800">{fmtRp((modal.item.laku || 0) * (modal.item.harga || 0))}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={saveModal}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#0D6EFD' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0B5ED7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0D6EFD')}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
