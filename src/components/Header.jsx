import { useState, useEffect, useRef } from 'react'
import { gasService } from '../services/gas'

export default function Header({ title, onLogout }) {
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [query, setQuery] = useState('')
  const [notifications, setNotifications] = useState([])
  const lastNotifCount = useRef(0)

  // Request Notification Permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await gasService.call('getLogNotifikasi');
        if (res && res.data) {
          const errors = res.data.filter(row => {
            const status = String(row[6] || '').toLowerCase();
            return status.includes('gagal') || status.includes('salah') || status.includes('error') || status.includes('belum');
          });
          
          const notifs = errors.map((row, i) => ({
            id: i,
            text: `[${row[2] || 'Sistem'}] ${row[4] || row[3] || 'Aktivitas'} - ${row[6] || 'Gagal'}`,
            komentar: row[5] || '',
            time: (row[0] || '').split(' ')[1] || row[0],
            type: 'warning'
          }));
          
          setNotifications(notifs);
          
          // Trigger Push Notification if there are new errors
          if (notifs.length > lastNotifCount.current) {
            const newNotif = notifs[0]; // Ambil yang paling baru
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('MobileCell: Aktivitas Gagal/Salah', {
                body: `${newNotif.text}\nCatatan: ${newNotif.komentar || '-'}`,
                icon: '/vite.svg'
              });
            }
          }
          lastNotifCount.current = notifs.length;

          if ('setAppBadge' in navigator) {
            navigator.setAppBadge(notifs.length).catch(console.error);
          }
        }
      } catch (e) {
        console.error('Failed to fetch notifs', e);
      }
    };
    
    fetchNotifs();
    // Realtime polling setiap 10 detik
    const interval = setInterval(fetchNotifs, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 flex-shrink-0 relative z-30"
      style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', height: 60 }}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 leading-tight">{title}</h1>
        <p className="text-xs text-slate-400">{today}</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg w-52" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari data..."
          className="bg-transparent outline-none text-xs text-slate-700 placeholder-slate-400 w-full"
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer"
          style={{ background: showNotif ? '#F1F5F9' : 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={(e) => { if (!showNotif) e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifications.length > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
              style={{ background: '#EF4444', border: '2px solid #fff', width: '18px', height: '18px', fontSize: '9px' }}
            >
              {notifications.length > 99 ? '99+' : notifications.length}
            </span>
          )}
        </button>

        {showNotif && (
          <div
            className="absolute right-0 top-11 w-80 rounded-xl py-1 z-50"
            style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800">Notifikasi</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#0D6EFD' }}>
                {notifications.length} peringatan
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Hore! Tidak ada masalah hari ini.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: '#FEF9C3',
                        color: '#CA8A04'
                      }}
                    >
                      ⚠️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug font-medium">{n.text}</p>
                      {n.komentar && (
                        <p className="text-xs text-slate-600 mt-1 p-1.5 rounded bg-slate-100 border border-slate-200">
                          {n.komentar}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100">
              <button className="text-xs font-medium w-full text-center cursor-pointer" style={{ color: '#0D6EFD' }}>
                Lihat semua log aktivitas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: '#0D6EFD' }}
          >
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Admin Pusat</p>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2" className="hidden sm:block">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showProfile && (
          <div
            className="absolute right-0 top-11 w-48 rounded-xl py-1 z-50"
            style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0' }}
          >
            {[
              { label: 'Profil Saya', icon: '👤' },
              { label: 'Pengaturan', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left cursor-pointer"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
