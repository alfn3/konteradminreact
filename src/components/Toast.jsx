export default function Toast({ text, type, onClose }) {
  const colors = {
    success: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', icon: '✓' },
    error: { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626', icon: '✕' },
    info: { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8', icon: 'ℹ' },
  }
  const c = colors[type]

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        minWidth: 280,
        animation: 'slideIn 0.25s ease',
      }}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: c.text, color: '#fff' }}>
        {c.icon}
      </span>
      <span className="flex-1">{text}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 ml-1 cursor-pointer">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  )
}
