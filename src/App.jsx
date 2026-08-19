import React, { useState } from 'react'
import DashboardLayout from './components/DashboardLayout'
import { Eye, EyeOff, Lock, User, Smartphone } from 'lucide-react'
import { gasService } from './services/gas'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [screen, setScreen] = useState('dashboard')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setErrorMsg('')
    try {
      const res = await gasService.call('checkLogin', { username, password })
      if (res && res.success) {
        setLoggedIn(true)
      } else {
        setErrorMsg(res.message || 'Username atau Password salah!')
      }
    } catch (err) {
      setErrorMsg('Error saat terhubung ke server: ' + err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen bg-white">
        {/* LEFT PANEL - Branding (Hidden on very small screens) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] text-white flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600 fill-blue-600" />
              </div>
              <span className="text-2xl font-bold tracking-wide">Mobilecell</span>
            </div>
            <p className="text-blue-200/80 text-[13px] ml-12 -mt-2">Admin Management System</p>
          </div>

          <div className="max-w-md">
            <h1 className="text-[2.75rem] font-bold leading-tight mb-5">
              Kelola Toko<br />Lebih Cerdas
            </h1>
            <p className="text-blue-100/90 text-base mb-8 leading-relaxed">
              Pantau stok, karyawan, dan performa konter Anda dalam satu platform terintegrasi.
            </p>
            
            <div className="flex flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <span className="text-xs font-medium text-white/90">Realtime Sinkronisasi</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-xs font-medium text-white/90">Multi-Konter</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                <span className="text-xs font-medium text-white/90">Sistem Kasir</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                <span className="text-xs font-medium text-white/90">Manajemen SDM</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-blue-200/60 text-xs">
              &copy;{new Date().getFullYear()} Mobilecell. All rights reserved.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Selamat datang kembali</h2>
              <p className="text-slate-500 text-sm">Masuk ke akun admin Anda untuk melanjutkan.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
                    placeholder="admin atau nama karyawan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                    Ingat saya
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-primary hover:text-blue-700 transition-colors">
                  Lupa password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-primary hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
              >
                {isLoggingIn ? 'Memeriksa...' : 'Masuk ke Dashboard'}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-xs text-slate-400">
                Mobilecell Admin v2.0 - Sistem Informasi Operasional
              </p>
            </div>
          </div>
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
