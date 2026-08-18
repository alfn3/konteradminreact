import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import DashboardPage from '../pages/DashboardPage'
import StokProdukPage from '../pages/StokProdukPage'
import ManajemenSDMPage from '../pages/ManajemenSDMPage'
import DataKonterPage from '../pages/DataKonterPage'
import LogAktivitasPage from '../pages/LogAktivitasPage'
import LaporanBulananPage from '../pages/LaporanBulananPage'
import Toast from './Toast'
import type { Screen } from '../App'

interface Props {
  screen: Screen
  setScreen: (s: Screen) => void
  onLogout: () => void
}

const titles: Record<Screen, string> = {
  dashboard: 'Dashboard',
  stok: 'Data Stok Produk',
  sdm: 'Manajemen SDM',
  konter: 'Data Konter',
  log: 'Log Aktivitas',
  laporan: 'Laporan Bulanan',
}

export interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

export default function DashboardLayout({ screen, setScreen, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (text: string, type: ToastMessage['type'] = 'success') => {
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
          {screen === 'dashboard' && <DashboardPage {...screenProps} />}
          {screen === 'stok' && <StokProdukPage {...screenProps} />}
          {screen === 'sdm' && <ManajemenSDMPage {...screenProps} />}
          {screen === 'konter' && <DataKonterPage {...screenProps} />}
          {screen === 'log' && <LogAktivitasPage {...screenProps} />}
          {screen === 'laporan' && <LaporanBulananPage {...screenProps} />}
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
