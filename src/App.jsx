import React, { useState } from 'react'
import DashboardLayout from './components/DashboardLayout'

// Jika Anda ingin membuat halaman Login asli, bisa diaktifkan kembali.
// Saat ini kita langsung masuk ke Dashboard agar tidak ribet saat testing.

export default function App() {
  const [loggedIn, setLoggedIn] = useState(true) // Langsung true untuk dev
  const [screen, setScreen] = useState('dashboard')

  if (!loggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
         <div className="bg-white p-8 rounded shadow text-center">
            <h1 className="text-xl font-bold mb-4">Mobilecell Admin</h1>
            <button 
              onClick={() => setLoggedIn(true)}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              Login Dummy
            </button>
         </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      screen={screen}
      setScreen={setScreen}
      onLogout={() => setLoggedIn(false)}
    />
  )
}
