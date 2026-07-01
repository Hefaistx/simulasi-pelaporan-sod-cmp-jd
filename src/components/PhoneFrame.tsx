export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 375 }}>

      {/* Side buttons kiri */}
      <div className="absolute left-0 top-[108px] w-[4px] h-8 bg-[#2a2a2a] rounded-l-sm -translate-x-[4px]" />
      <div className="absolute left-0 top-[152px] w-[4px] h-14 bg-[#2a2a2a] rounded-l-sm -translate-x-[4px]" />
      <div className="absolute left-0 top-[222px] w-[4px] h-14 bg-[#2a2a2a] rounded-l-sm -translate-x-[4px]" />

      {/* Side button kanan (power) */}
      <div className="absolute right-0 top-[168px] w-[4px] h-20 bg-[#2a2a2a] rounded-r-sm translate-x-[4px]" />

      {/* Phone body */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 375,
          height: 812,
          background: '#111',
          borderRadius: 50,
          boxShadow: '0 0 0 1px #3a3a3a, 0 30px 80px rgba(0,0,0,0.55), 0 0 0 12px #1c1c1c, inset 0 0 0 2px #3a3a3a',
        }}
      >
        {/* Screen bezel inner */}
        <div className="absolute inset-[3px] rounded-[46px] overflow-hidden bg-white flex flex-col" style={{ zIndex: 1 }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 flex-shrink-0 bg-transparent"
            style={{ height: 44, position: 'relative', zIndex: 10 }}>
            <span className="text-[11px] font-bold text-white drop-shadow" style={{ letterSpacing: '-0.3px' }}>
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Dynamic island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-24 h-7 bg-black rounded-full" />
            <div className="flex items-center gap-1.5">
              {/* Signal */}
              <svg width="16" height="11" viewBox="0 0 16 11" fill="white">
                <rect x="0" y="7" width="2.5" height="4" rx="0.5" opacity="0.4"/>
                <rect x="3.5" y="5" width="2.5" height="6" rx="0.5" opacity="0.6"/>
                <rect x="7" y="3" width="2.5" height="8" rx="0.5" opacity="0.8"/>
                <rect x="10.5" y="0" width="2.5" height="11" rx="0.5"/>
              </svg>
              {/* Wifi */}
              <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
                <path d="M7.5 9a1 1 0 100 2 1 1 0 000-2z"/>
                <path d="M4.5 6.5a4.2 4.2 0 016 0" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                <path d="M2 4a7.5 7.5 0 0111 0" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-0.5">
                <div className="relative w-6 h-3 border border-white/80 rounded-[3px]">
                  <div className="absolute inset-[2px] right-[3px] bg-white rounded-[1px]" style={{ right: '3px' }} />
                </div>
                <div className="w-[2px] h-1.5 bg-white/60 rounded-r-sm" />
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="flex-1 overflow-hidden flex flex-col" style={{ marginTop: -44 }}>
            {children}
          </div>

          {/* Home indicator */}
          <div className="flex-shrink-0 flex items-center justify-center pb-2 pt-1 bg-transparent absolute bottom-0 left-0 right-0">
            <div className="w-32 h-[5px] bg-black/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
