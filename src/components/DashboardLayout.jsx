import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Dashboard from '../pages/Dashboard'
import DataStok from '../pages/DataStok'
import ManajemenSDM from '../pages/ManajemenSDM'
import DataKonter from '../pages/DataKonter'
import LogAktivitas from '../pages/LogAktivitas'
import LaporanBulanan from '../pages/LaporanBulanan'
import KeuanganKas from '../pages/KeuanganKas'
import Toast from './Toast'

const titles = {
  dashboard: 'Dashboard',
  stok: 'Data Stok Produk',
  sdm: 'Manajemen SDM',
  konter: 'Data Konter',
  log: 'Log Aktivitas',
  laporan: 'Laporan Bulanan',
  keuangan: 'Keuangan & Kas',
}

export default function DashboardLayout({ screen, setScreen, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = (text, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }

  const screenProps = { addToast }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      <Sidebar screen={screen} setScreen={setScreen} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={titles[screen]} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          {screen === 'dashboard' && <Dashboard {...screenProps} />}
          {screen === 'stok' && <DataStok {...screenProps} />}
          {screen === 'sdm' && <ManajemenSDM {...screenProps} />}
          {screen === 'konter' && <DataKonter {...screenProps} />}
          {screen === 'log' && <LogAktivitas {...screenProps} />}
          {screen === 'laporan' && <LaporanBulanan {...screenProps} />}
          {screen === 'keuangan' && <KeuanganKas {...screenProps} />}
        </main>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} text={t.text} type={t.type} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </div>
  )
}
