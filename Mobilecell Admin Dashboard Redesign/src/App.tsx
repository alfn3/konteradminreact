import { useState } from 'react'
import Login from './pages/Login'
import DashboardLayout from './components/DashboardLayout'

export type Screen = 'dashboard' | 'stok' | 'sdm' | 'konter' | 'log' | 'laporan'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [screen, setScreen] = useState<Screen>('dashboard')

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <DashboardLayout
      screen={screen}
      setScreen={setScreen}
      onLogout={() => setLoggedIn(false)}
    />
  )
}
