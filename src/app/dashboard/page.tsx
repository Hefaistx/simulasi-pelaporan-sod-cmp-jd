'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import PhoneFrame from '@/components/PhoneFrame'
import ImageUpload from '@/components/ImageUpload'
import DateRangePicker from '@/components/DateRangePicker'

/* ─── Types ─────────────────────────────────────────────── */
type Role = 'STAFF' | 'HEAD_OUTLET'
type Status = 'MENUNGGU' | 'SELESAI'
type Session = { sub: string; name: string; role: Role; propertyId: string | null }
type Property = { id: string; name: string; code: string }
type Report = {
  id: string; code: string; status: Status; createdAt: string; description: string
  photoUrl?: string | null
  area?: string | null
  denahId: string | null; denahCellR: number | null; denahCellC: number | null
  property: Property
  createdBy: { name: string }
  confirmation?: { description: string; photoUrl?: string | null; confirmedAt: string; confirmedBy: { name: string; role: Role } } | null
  history: { action: string; createdAt: string; user: { name: string } }[]
}
type Stats = { total: number; menunggu: number; selesai: number }
type Tab = 'statistik' | 'daftar' | 'pengerjaan'
type Filter = 'semua' | 'menunggu' | 'selesai'
type Screen = 'main' | 'input' | 'detail' | 'denah-view' | 'filter-stat' | 'filter-daftar' | 'filter-pj' | 'confirm'
type Pic = { id: string; name: string }

/* ─── Colours ────────────────────────────────────────────── */
const P = '#48b9ef', AMB = '#F5A623', GRN = '#4CAF50', GRY = '#9AAEBB'

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, menunggu: 0, selesai: 0 })
  const [reports, setReports] = useState<Report[]>([])
  const [tab, setTab] = useState<Tab>('statistik')
  const [filter, setFilter] = useState<Filter>('semua')
  const [screen, setScreen] = useState<Screen>('main')
  const [detail, setDetail] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [pics, setPics] = useState<Pic[]>([])

  // Applied filter state
  const [fStartDate, setFStartDate] = useState('')
  const [fEndDate, setFEndDate] = useState('')
  const [fPropertyId, setFPropertyId] = useState('')
  const [fPicId, setFPicId] = useState('')

  // Filter panel temp state
  const [tmpStart, setTmpStart] = useState('')
  const [tmpEnd, setTmpEnd] = useState('')
  const [tmpPropId, setTmpPropId] = useState('')
  const [tmpPicId, setTmpPicId] = useState('')
  const [tmpFilter, setTmpFilter] = useState<Filter>('semua')

  // Input form state
  const [inpPropertyId, setInpPropertyId] = useState('')
  const [inpArea, setInpArea] = useState('')
  const [inpDesc, setInpDesc] = useState('')
  const [inpDenahCell, setInpDenahCell] = useState<{ r: number; c: number } | null>(null)
  const [inpPhoto, setInpPhoto] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Confirm modal
  const [confirmDesc, setConfirmDesc] = useState('')
  const [confirmPhoto, setConfirmPhoto] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)

  // Denah mode: 'input' = set titik baru, 'view' = lihat titik dari detail
  const [denahMode, setDenahMode] = useState<'input' | 'view'>('input')

  // Denah tutorial
  const [tutorialOpen, setTutorialOpen] = useState(false)

  // Export panel
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Success toast
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)

  /* ─── Init ──────────────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(s => { if (s) setSession(s) })
  }, [router])

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams()
    if (fStartDate) params.set('startDate', fStartDate)
    if (fEndDate) params.set('endDate', fEndDate)
    if (fPropertyId) params.set('propertyId', fPropertyId)
    if (fPicId) params.set('createdById', fPicId)
    const qs = params.toString() ? `?${params.toString()}` : ''

    const [s, r, p] = await Promise.all([
      fetch(`/api/stats${qs}`).then(r => r.json()),
      fetch(`/api/reports${qs}`).then(r => r.json()),
      fetch('/api/properties').then(r => r.ok ? r.json() : []),
    ])
    setStats(s)
    setReports(Array.isArray(r) ? r : [])
    setProperties(Array.isArray(p) ? p : [])
    setLoading(false)
  }, [fStartDate, fEndDate, fPropertyId, fPicId])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  useEffect(() => {
    if (!session) return
    fetch('/api/users').then(r => r.ok ? r.json() : []).then(u => setPics(Array.isArray(u) ? u : []))
  }, [session])

  /* ─── Helpers ────────────────────────────────────────────── */
  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function goScreen(s: Screen, r?: Report) {
    setScreen(s)
    if (r) setDetail(r)
  }

  function switchTab(t: Tab, f?: Filter) {
    setTab(t)
    if (f) setFilter(f)
    setScreen('main')
  }

  /* ─── Submit laporan ─────────────────────────────────────── */
  async function submitLaporan() {
    if (!inpPropertyId) { alert('Pilih properti'); return }
    if (!inpArea) { alert('Pilih area'); return }
    if (!inpDesc.trim()) { alert('Isi deskripsi kerusakan'); return }
    if (!inpPhoto) { alert('Tambahkan foto bukti kerusakan'); return }
    setSubmitting(true)
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: inpPropertyId,
        area: inpArea || null,
        description: inpDesc,
        photoUrl: inpPhoto,
        denahId: inpDenahCell ? '492321' : null,
        denahCellR: inpDenahCell?.r ?? null,
        denahCellC: inpDenahCell?.c ?? null,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setInpPropertyId(''); setInpArea(''); setInpDesc(''); setInpDenahCell(null); setInpPhoto(null)
      await fetchData()
      switchTab('daftar', 'menunggu')
      showToast('Laporan berhasil disimpan!')
    } else {
      alert('Gagal menyimpan laporan')
    }
  }

  /* ─── Konfirmasi selesai ─────────────────────────────────── */
  async function doConfirm() {
    if (!confirmDesc.trim()) { alert('Isi deskripsi pengerjaan'); return }
    if (!confirmPhoto) { alert('Tambahkan foto bukti pengerjaan'); return }
    if (!confirmTargetId) return
    setConfirming(true)
    const res = await fetch(`/api/reports/${confirmTargetId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: confirmDesc, photoUrl: confirmPhoto }),
    })
    setConfirming(false)
    if (res.ok) {
      setConfirmDesc(''); setConfirmPhoto(null)
      await fetchData()
      if (screen === 'detail' && detail?.id === confirmTargetId) {
        const updated = await fetch(`/api/reports/${confirmTargetId}`).then(r => r.json())
        setDetail(updated)
      }
      switchTab('pengerjaan')
      showToast('Pengerjaan dikonfirmasi selesai!')
    } else {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      alert(`Gagal konfirmasi: ${err.error}`)
    }
  }

  /* ─── Filter helpers ────────────────────────────────────── */
  function openFilter() {
    setTmpStart(fStartDate); setTmpEnd(fEndDate)
    setTmpPropId(fPropertyId); setTmpPicId(fPicId)
    setTmpFilter(filter)
    if (tab === 'statistik') setScreen('filter-stat')
    else if (tab === 'daftar') setScreen('filter-daftar')
    else setScreen('filter-pj')
  }

  function applyFilter() {
    setFStartDate(tmpStart); setFEndDate(tmpEnd)
    setFPropertyId(tmpPropId); setFPicId(tmpPicId)
    setFilter(tmpFilter)
    setScreen('main')
  }

  function resetFilter() {
    setTmpStart(''); setTmpEnd(''); setTmpPropId(''); setTmpPicId('')
    setTmpFilter('semua')
  }

  function clearAllFilters() {
    setFStartDate(''); setFEndDate(''); setFPropertyId(''); setFPicId('')
    setFilter('semua')
  }

  /* ─── Export helpers ─────────────────────────────────────── */
  function exportFilename(ext: string) {
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`
    return `Daftar_Pelaporan_${ts}.${ext}`
  }

  function roleLabel(role: Role) {
    return role === 'HEAD_OUTLET' ? 'Head Outlet' : 'Staff'
  }

  function buildExportRows(data: Report[]) {
    return data.map((r, i) => [
      i + 1,
      r.code,
      formatDate(r.createdAt),
      r.createdBy.name,
      r.property.name,
      r.area || '-',
      r.denahId || '-',
      r.description,
      r.photoUrl || '-',
      r.status === 'MENUNGGU' ? 'Menunggu Pengerjaan' : 'Selesai',
      r.confirmation?.description || '-',
      r.confirmation?.photoUrl || '-',
      r.confirmation
        ? `${r.confirmation.confirmedBy.name} - ${roleLabel(r.confirmation.confirmedBy.role)}`
        : '-',
      r.confirmation ? formatDate(r.confirmation.confirmedAt) : '-',
    ])
  }

  const EXPORT_HEADERS = [
    'No', 'ID Laporan', 'Tanggal Laporan', 'PIC Pelapor', 'Properti', 'Area',
    'ID Denah', 'Deskripsi Laporan', 'Foto Laporan', 'Status',
    'Hasil Pengerjaan - Keterangan', 'Hasil Pengerjaan - Foto',
    'Hasil Pengerjaan - PIC', 'Hasil Pengerjaan - Tanggal',
  ]

  async function exportPDF() {
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      const exportedBy = session ? `${session.name} - ${roleLabel(session.role)}` : '-'
      const exportedAt = formatDate(new Date())

      const pageW = doc.internal.pageSize.getWidth()
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('PT ROYAL DPARAGON LAND', pageW / 2, 14, { align: 'center' })
      doc.setFontSize(10)
      doc.text('REKAP DATA PELAPORAN SOD', pageW / 2, 20, { align: 'center' })

      const hasFilter = !!(fStartDate || fEndDate || fPropertyId || fPicId)
      if (hasFilter) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        const filterInfo: string[] = []
        if (fStartDate || fEndDate) filterInfo.push(`Periode: ${periodLabel()}`)
        if (fPropertyId) filterInfo.push(`Properti: ${properties.find(p => p.id === fPropertyId)?.name || fPropertyId}`)
        if (fPicId) filterInfo.push(`PIC: ${pics.find(u => u.id === fPicId)?.name || fPicId}`)
        doc.text(filterInfo.join('  |  '), pageW / 2, 25, { align: 'center' })
      }

      autoTable(doc, {
        startY: hasFilter ? 29 : 24,
        head: [EXPORT_HEADERS],
        body: buildExportRows(filtered),
        styles: { fontSize: 6, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [72, 185, 239], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 6 },
        columnStyles: {
          0:  { halign: 'center', cellWidth: 6 },
          1:  { cellWidth: 26 },
          2:  { cellWidth: 20 },
          3:  { cellWidth: 18 },
          4:  { cellWidth: 18 },
          5:  { cellWidth: 13 },
          6:  { cellWidth: 13 },
          7:  { cellWidth: 28 },
          8:  { cellWidth: 22 },
          9:  { cellWidth: 16 },
          10: { cellWidth: 26 },
          11: { cellWidth: 22 },
          12: { cellWidth: 20 },
          13: { cellWidth: 20 },
        },
        alternateRowStyles: { fillColor: [235, 247, 255] },
        didDrawPage: () => {
          const pageH = doc.internal.pageSize.getHeight()
          doc.setFontSize(6)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(120)
          doc.text(
            `Exported by: ${exportedBy}  |  Exported at: ${exportedAt}`,
            pageW / 2, pageH - 5, { align: 'center' }
          )
          doc.setTextColor(0)
        },
      })

      doc.save(exportFilename('pdf'))
    } finally {
      setExporting(false)
      setExportOpen(false)
    }
  }

  async function exportExcel() {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const rows = buildExportRows(filtered)

      const exportedBy = session ? `${session.name} - ${roleLabel(session.role)}` : '-'
      const exportedAt = formatDate(new Date())

      const filterRows: (string | number)[][] = []
      if (fStartDate || fEndDate || fPropertyId || fPicId) {
        if (fStartDate || fEndDate) filterRows.push([`Periode: ${periodLabel()}`])
        if (fPropertyId) filterRows.push([`Properti: ${properties.find(p => p.id === fPropertyId)?.name || fPropertyId}`])
        if (fPicId) filterRows.push([`PIC: ${pics.find(u => u.id === fPicId)?.name || fPicId}`])
        filterRows.push([])
      }

      const COL = EXPORT_HEADERS.length
      const dataRowStart = 3 + filterRows.length // 0-based row index of EXPORT_HEADERS

      const data: (string | number)[][] = [
        ['PT ROYAL DPARAGON LAND'],
        ['REKAP DATA PELAPORAN SOD'],
        [],
        ...filterRows,
        EXPORT_HEADERS,
        ...rows,
        [],
        ['Exported by', exportedBy],
        ['Exported at', exportedAt],
      ]

      const ws = XLSX.utils.aoa_to_sheet(data)

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
      ]

      void dataRowStart

      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 26 }, // ID Laporan
        { wch: 22 }, // Tanggal Laporan
        { wch: 20 }, // PIC Pelapor
        { wch: 20 }, // Properti
        { wch: 14 }, // Area
        { wch: 14 }, // ID Denah
        { wch: 35 }, // Deskripsi Laporan
        { wch: 35 }, // Foto Laporan
        { wch: 22 }, // Status
        { wch: 30 }, // HP - Keterangan
        { wch: 35 }, // HP - Foto
        { wch: 25 }, // HP - PIC
        { wch: 22 }, // HP - Tanggal
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan SOD')
      XLSX.writeFile(wb, exportFilename('xlsx'))
    } finally {
      setExporting(false)
      setExportOpen(false)
    }
  }

  const activeFilterCount = [fStartDate || fEndDate, fPropertyId, fPicId].filter(Boolean).length

  function fmtFilterDate(d: string) {
    const [y, m, day] = d.split('-')
    const mn = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
    return `${parseInt(day)} ${mn[parseInt(m) - 1]} ${y}`
  }

  function periodLabel() {
    if (!fStartDate && !fEndDate) return 'Semua laporan'
    if (fStartDate && fEndDate) return `${fmtFilterDate(fStartDate)} – ${fmtFilterDate(fEndDate)}`
    if (fStartDate) return `Dari ${fmtFilterDate(fStartDate)}`
    return `S/d ${fmtFilterDate(fEndDate)}`
  }

  /* ─── Filtered reports ───────────────────────────────────── */
  const filtered = reports.filter(r => filter === 'semua' || r.status.toLowerCase() === filter)
  const waiting  = reports.filter(r => r.status === 'MENUNGGU')
  const pct      = stats.total ? Math.round(stats.selesai / stats.total * 100) : 0

  /* ─── Denah grid ─────────────────────────────────────────── */
  function DenahGrid({ onSelect, selectedCell }: {
    onSelect?: (r: number, c: number) => void
    selectedCell?: { r: number; c: number } | null
  }) {
    const COLS = 13, ROWS = 16
    return (
      <div className="absolute inset-0 grid" style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}>
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const r = Math.floor(i / COLS), c = i % COLS
          const selected = selectedCell && selectedCell.r === r && selectedCell.c === c
          return (
            <div
              key={i}
              onClick={() => onSelect?.(r, c)}
              className={`${onSelect ? 'cursor-crosshair hover:bg-red-500/20' : ''} transition-colors`}
              style={selected ? { background: 'rgba(220,38,38,0.55)' } : {}}
            />
          )
        })}
      </div>
    )
  }

  const FloorPlanSVG = () => (
    <svg width="260" height="320" viewBox="0 0 260 320" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <pattern id="g" width="13" height="13" patternUnits="userSpaceOnUse">
          <path d="M 13 0 L 0 0 0 13" fill="none" stroke="#d8d8d8" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="260" height="320" fill="url(#g)" />
      <rect x="8" y="8" width="244" height="304" fill="white" />
      <rect x="8" y="8" width="244" height="304" fill="none" stroke="black" strokeWidth="5" />
      <line x1="8" y1="162" x2="252" y2="162" stroke="black" strokeWidth="3.5" />
      <line x1="130" y1="8" x2="130" y2="312" stroke="black" strokeWidth="3.5" />
      {[[5,5],[246,5],[5,308],[246,308]].map(([x,y],i) => <rect key={i} x={x} y={y} width="9" height="9" fill="black" />)}
      {[[124,5],[124,308],[5,157],[246,157]].map(([x,y],i) => <rect key={i} x={x} y={y} width="12" height="10" fill="black" />)}
      <line x1="8" y1="50" x2="70" y2="50" stroke="black" strokeWidth="2" />
      <line x1="70" y1="8" x2="70" y2="50" stroke="black" strokeWidth="2" />
      <ellipse cx="35" cy="30" rx="11" ry="8" fill="none" stroke="black" strokeWidth="1.5" />
      <rect x="75" y="15" width="14" height="11" rx="3" fill="none" stroke="black" strokeWidth="1.5" />
      <path d="M 130 65 A 28 28 0 0 0 102 65" fill="none" stroke="black" strokeWidth="1.5" />
      <line x1="130" y1="37" x2="130" y2="65" stroke="black" strokeWidth="1.5" />
      <text x="80" y="115" fontSize="18" fontFamily="Arial" fontWeight="bold" textAnchor="middle" transform="rotate(-90,80,115)">06</text>
      <rect x="208" y="8" width="44" height="44" fill="none" stroke="black" strokeWidth="1.5" />
      <line x1="208" y1="8" x2="252" y2="52" stroke="black" strokeWidth="1" />
      <line x1="252" y1="8" x2="208" y2="52" stroke="black" strokeWidth="1" />
      <path d="M 130 95 A 28 28 0 0 1 158 95" fill="none" stroke="black" strokeWidth="1.5" />
      <text x="180" y="115" fontSize="18" fontFamily="Arial" fontWeight="bold" textAnchor="middle" transform="rotate(-90,180,115)">07</text>
      <line x1="8" y1="275" x2="70" y2="275" stroke="black" strokeWidth="2" />
      <line x1="70" y1="275" x2="70" y2="312" stroke="black" strokeWidth="2" />
      <ellipse cx="35" cy="296" rx="11" ry="8" fill="none" stroke="black" strokeWidth="1.5" />
      <path d="M 102 220 A 28 28 0 0 1 102 248" fill="none" stroke="black" strokeWidth="1.5" />
      <line x1="102" y1="220" x2="130" y2="220" stroke="black" strokeWidth="1.5" />
      <text x="80" y="240" fontSize="18" fontFamily="Arial" fontWeight="bold" textAnchor="middle" transform="rotate(-90,80,240)">05</text>
      <rect x="175" y="180" width="68" height="50" rx="4" fill="none" stroke="black" strokeWidth="1.5" />
      <line x1="175" y1="200" x2="243" y2="200" stroke="black" strokeWidth="1" />
      <path d="M 158 220 A 28 28 0 0 0 158 248" fill="none" stroke="black" strokeWidth="1.5" />
      <line x1="130" y1="220" x2="158" y2="220" stroke="black" strokeWidth="1.5" />
      <text x="180" y="240" fontSize="18" fontFamily="Arial" fontWeight="bold" textAnchor="middle" transform="rotate(-90,180,240)">04</text>
    </svg>
  )

  /* ─── Render ─────────────────────────────────────────────── */
  if (!session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#b0b0b0]">
        <div className="text-white text-sm">Memuat...</div>
      </div>
    )
  }

  const isHead = session.role === 'HEAD_OUTLET'

  return (
    <div className="min-h-screen flex items-start justify-center gap-5 bg-[#1a1a2e] p-6 flex-wrap">

      {/* ── Info Panel ── */}
      <div className="w-60 bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg sticky top-6 self-start text-xs border border-white/10">
        <div className="font-bold text-sm text-white mb-3">👤 Sesi Aktif</div>
        <div className="bg-white/10 rounded-lg p-3 mb-3">
          <p className="font-bold text-white">{session.name}</p>
          <p className="text-white/60 mt-0.5">{isHead ? '👔 Head Outlet' : '🧑 Staff'}</p>
        </div>
        <button onClick={logout} className="w-full text-red-300 border border-red-400/30 rounded-lg py-2 font-semibold hover:bg-red-500/20 transition-colors">
          Keluar
        </button>
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-white/50">
          <p className="font-semibold text-white/70 mb-2">Quick Stats</p>
          <div className="flex justify-between"><span>Total</span><span className="font-bold text-white">{stats.total}</span></div>
          <div className="flex justify-between"><span>Menunggu</span><span className="font-bold text-[#9AAEBB]">{stats.menunggu}</span></div>
          <div className="flex justify-between"><span>Selesai</span><span className="font-bold text-green-400">{stats.selesai}</span></div>
        </div>
      </div>

      {/* ── Phone Frame ── */}
      <PhoneFrame>

        {/* ════ SCREEN: MAIN ════ */}
        {screen === 'main' && (
          <>
            {/* Header */}
            <div className="relative overflow-hidden flex-shrink-0" style={{ background: P, paddingTop: 40, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="absolute -right-4 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div style={{ width: 32, visibility: 'hidden' }} />
              <span className="text-white font-bold text-base z-10">Pelaporan SOD Campagna</span>
              <button onClick={openFilter} className="z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white rounded-t-[20px] -mt-4 p-3.5">
              {/* Top Tabs */}
              <div className="flex gap-1 p-1 rounded-lg mb-3.5" style={{ background: '#FFF3D4' }}>
                {(['statistik','daftar'] as Tab[]).concat(isHead ? ['pengerjaan' as Tab] : []).map(t => (
                  <button key={t} onClick={() => switchTab(t)}
                    className="flex-1 py-2 rounded-md text-xs font-semibold transition-all capitalize"
                    style={tab === t ? { background: AMB, color: 'white' } : { color: '#999', background: 'transparent' }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* ── TAB: STATISTIK ── */}
              {tab === 'statistik' && (
                <>
                  <div className="rounded-xl p-4 mb-3" style={{ background: '#EBF7FF' }}>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                      <span>Total Laporan</span>
                      <span className="text-gray-400">{periodLabel()}</span>
                    </div>
                    <div className="text-4xl font-black text-gray-900 my-1.5">{stats.total}</div>
                    <div className="flex gap-2 mb-2.5">
                      <button onClick={() => switchTab('daftar', 'selesai')} className="px-3 py-1 rounded-full text-xs text-white font-bold" style={{ background: GRN }}>{stats.selesai} Selesai</button>
                      <button onClick={() => switchTab('daftar', 'menunggu')} className="px-3 py-1 rounded-full text-xs text-white font-bold" style={{ background: GRY }}>{stats.menunggu} Menunggu</button>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GRN}, ${P})` }} />
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB: DAFTAR ── */}
              {tab === 'daftar' && (
                <>
                  <div className="rounded-lg px-3 py-2 mb-3 text-xs text-gray-500" style={{ background: '#EBF7FF' }}>
                    Berikut hasil untuk tanggal = {periodLabel()}
                    {fPicId && pics.find(u => u.id === fPicId) && ` · PIC: ${pics.find(u => u.id === fPicId)?.name}`}
                  </div>
                  <div className="flex gap-2 mb-3">
                    {(['semua','menunggu','selesai'] as Filter[]).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize"
                        style={filter === f ? { background: P, color: 'white', borderColor: P } : { background: 'white', color: '#888', borderColor: '#e0e0e0' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-300"><div className="text-4xl mb-2">📋</div><div className="text-sm">Tidak ada laporan</div></div>
                  ) : filtered.map(r => <ReportCard key={r.id} r={r} onPress={() => goScreen('detail', r)} />)}
                  <div className="h-14" />
                </>
              )}

              {/* ── TAB: PENGERJAAN ── */}
              {tab === 'pengerjaan' && isHead && (
                <>
                  <div className="rounded-lg px-3 py-2 mb-3 text-xs text-gray-500" style={{ background: '#EBF7FF' }}>
                    Laporan menunggu konfirmasi Anda sebagai Head Outlet on duty.
                  </div>
                  {waiting.length === 0 ? (
                    <div className="text-center py-10 text-gray-300"><div className="text-4xl mb-2">✅</div><div className="text-sm">Semua laporan sudah dikonfirmasi</div></div>
                  ) : waiting.map(r => (
                    <div key={r.id} className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm border border-gray-100">
                      <div className="p-3 cursor-pointer" onClick={() => goScreen('detail', r)}>
                        <p className="font-bold text-sm text-gray-900 mb-1.5">{r.property.name}</p>
                        <Row label="ID Laporan" value={r.code} />
                        <Row label="Tanggal Pelaporan" value={formatDate(r.createdAt)} />
                        <Row label="Dilaporkan oleh" value={r.createdBy.name} />
                      </div>
                      <button onClick={() => { setConfirmTargetId(r.id); setConfirmDesc(''); setConfirmPhoto(null); setScreen('confirm') }}
                        className="w-full py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                        style={{ background: GRN }}>
                        ✅ Konfirmasi Selesai
                      </button>
                      <div className="py-2 text-center text-xs font-bold text-white" style={{ background: GRY }}>Menunggu Pengerjaan</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* FABs */}
            {(tab === 'statistik' || tab === 'daftar') && (
              <button onClick={() => { setScreen('input'); setInpPropertyId(session.propertyId ?? '') }}
                className="absolute right-3.5 flex items-center justify-center rounded-full shadow-lg z-20 text-white"
                style={{ bottom: 44, width: 52, height: 52, background: P }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {tab === 'daftar' && (
              <button onClick={() => setExportOpen(true)}
                className="absolute right-3.5 flex items-center justify-center rounded-full shadow-lg z-20 text-white"
                style={{ bottom: 104, width: 52, height: 52, background: AMB }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v13M7 11l5 5 5-5M5 20h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* Bottom bar */}
            <div className="h-7 bg-white flex items-center justify-center flex-shrink-0">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>
          </>
        )}

        {/* ════ SCREEN: INPUT ════ */}
        {screen === 'input' && (
          <>
            <Header title="Input Laporan SOD" onBack={() => setScreen('main')} />
            <div className="flex-1 overflow-y-auto p-3.5">
              <FormSection>
                <Label>Properti *</Label>
                <select value={inpPropertyId} onChange={e => setInpPropertyId(e.target.value)} className={input}>
                  <option value="">-- Pilih Properti --</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </FormSection>
              <FormSection>
                <Label>Area *</Label>
                <select value={inpArea} onChange={e => setInpArea(e.target.value)} className={input}>
                  <option value="">-- Pilih Area --</option>
                  <option value="DAPUR">DAPUR</option>
                  <option value="COUNTER">COUNTER</option>
                </select>
              </FormSection>
              <FormSection>
                <Label>Deskripsi Kerusakan *</Label>
                <textarea value={inpDesc} onChange={e => setInpDesc(e.target.value)}
                  className={`${input} resize-none h-20`} placeholder="Jelaskan kerusakan yang ditemukan..." />
              </FormSection>
              <FormSection>
                <Label>Foto Bukti Kerusakan *</Label>
                <ImageUpload value={inpPhoto} onChange={setInpPhoto} placeholder="Tambah Foto Bukti Kerusakan" />
              </FormSection>
              <FormSection>
                <Label>Titik Denah</Label>
                <p className="text-xs text-gray-400 mb-2">ID Denah: <b className="text-[#48b9ef]">492321</b> · Lantai 1</p>
                <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center overflow-hidden mb-2">
                  <svg width="90" height="70" viewBox="0 0 260 320" style={{ opacity: 0.5 }}>
                    <rect x="8" y="8" width="244" height="304" fill="white" />
                    <rect x="8" y="8" width="244" height="304" fill="none" stroke="#333" strokeWidth="5" />
                    <line x1="8" y1="162" x2="252" y2="162" stroke="#333" strokeWidth="3" />
                    <line x1="130" y1="8" x2="130" y2="312" stroke="#333" strokeWidth="3" />
                    {inpDenahCell && (
                      <rect x={inpDenahCell.c * (260/13)} y={inpDenahCell.r * (320/16)}
                        width={260/13} height={320/16} fill="rgba(220,38,38,0.6)" />
                    )}
                  </svg>
                </div>
                <button onClick={() => { setDenahMode('input'); setTutorialOpen(true); setScreen('denah-view') }}
                  className="w-full py-3 rounded-xl text-white text-xs font-bold" style={{ background: P }}>
                  🗺 SET TITIK DENAH
                </button>
                {inpDenahCell && <p className="text-xs text-green-500 text-center mt-1.5">✅ Titik denah sudah ditandai</p>}
              </FormSection>
              <div className="h-4" />
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0">
              <button onClick={submitLaporan} disabled={submitting}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60" style={{ background: P }}>
                {submitting ? 'Menyimpan...' : 'SIMPAN LAPORAN'}
              </button>
            </div>
          </>
        )}

        {/* ════ SCREEN: DENAH INPUT (set titik baru) ════ */}
        {screen === 'denah-view' && denahMode === 'input' && (
          <>
            <Header title="Denah Pelaporan" onBack={() => setScreen('input')}
              right={<button onClick={() => setTutorialOpen(true)} className="w-8 h-8 rounded-full bg-white/20 text-white text-sm font-black">?</button>} />
            <div className="flex-1 flex items-center justify-center overflow-auto" style={{ background: '#9e9e9e' }}>
              <div className="relative shadow-2xl">
                <FloorPlanSVG />
                <DenahGrid onSelect={(r, c) => setInpDenahCell({ r, c })} selectedCell={inpDenahCell} />
              </div>
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0">
              <button onClick={() => { if (!inpDenahCell) { alert('Pilih titik kerusakan di denah'); return }; setScreen('input') }}
                className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: P }}>
                SIMPAN
              </button>
            </div>

            {/* Tutorial */}
            {tutorialOpen && (
              <div className="absolute inset-0 bg-black/55 z-50 flex items-center justify-center p-5">
                <div className="bg-white rounded-2xl p-5 w-full">
                  <h4 className="font-bold text-center text-sm mb-3">Cara Penggunaan &amp; Ketentuan :</h4>
                  {['Pilih area yang terjadi kerusakan hingga kotak / grid berubah menjadi warna MERAH',
                    'Jika sudah sesuai titik dan berwarna MERAH, tekan tombol SIMPAN untuk proses selanjutnya.',
                    'Area yang di pilih hanya bisa 1 titik aja.',
                    'Pastikan pilih tombol SIMPAN, jika pilih tombol kembali tidak akan menyimpan titik terbaru.',
                  ].map((t, i) => <p key={i} className="text-xs text-gray-600 mb-2 leading-relaxed">{i+1}. {t}</p>)}
                  <button onClick={() => setTutorialOpen(false)} className="block mx-auto mt-3 px-8 py-2 rounded-lg text-white text-sm font-bold" style={{ background: P }}>
                    Mengerti
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════ SCREEN: DETAIL ════ */}
        {screen === 'detail' && detail && (
          <>
            <Header title="Detail Laporan" onBack={() => setScreen('main')} />
            <div className="flex-1 overflow-y-auto p-3.5">
              {/* Denah card */}
              <p className="font-bold text-sm text-gray-900 mb-2">Denah Pelaporan</p>
              <div className="rounded-xl p-3.5 mb-3 flex items-center gap-3" style={{ background: '#EBF7FF' }}>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{detail.property.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Lantai 1</p>
                  <div className="flex gap-2 mt-1.5 text-xs font-semibold text-[#48b9ef]">
                    <span>🏗 1</span>
                    <span>ID {detail.denahId || '-'}</span>
                  </div>
                </div>
                {detail.denahCellR !== null && (
                  <button onClick={() => { setDenahMode('view'); setScreen('denah-view') }}
                    className="bg-white text-[#48b9ef] text-xs font-bold px-4 py-2 rounded-full shadow-sm whitespace-nowrap">
                    Lihat Denah
                  </button>
                )}
              </div>

              {/* Info */}
              <p className="font-bold text-sm text-gray-900 mb-2">Informasi Pelaporan</p>
              <div className="rounded-xl p-3.5 mb-3" style={{ background: '#EBF7FF' }}>
                <span className="inline-block px-3 py-1 rounded-full text-xs text-white font-bold mb-3"
                  style={{ background: detail.status === 'MENUNGGU' ? GRY : GRN }}>
                  {detail.status === 'MENUNGGU' ? 'MENUNGGU PENGERJAAN' : 'SELESAI'}
                </span>
                <FieldRow label="ID Denah" value={detail.denahId || '-'} />
                <FieldRow label="Kode Laporan" value={detail.code} />
                <FieldRow label="Dilaporkan oleh" value={detail.createdBy.name} />
                <FieldRow label="Tanggal Pelaporan" value={formatDate(detail.createdAt)} />
                <FieldRow label="Deskripsi Pelaporan" value={detail.description} />
                {detail.photoUrl && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-400 mb-1.5">Lampiran</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detail.photoUrl} alt="Bukti kerusakan" className="w-full rounded-lg object-cover" style={{ maxHeight: 180 }} />
                  </div>
                )}

                {detail.confirmation && (
                  <div className="mt-3 rounded-lg p-3" style={{ background: '#E8F5E9' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: GRN }}>✅ Dikonfirmasi Selesai</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{detail.confirmation.description}</p>
                    {detail.confirmation.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detail.confirmation.photoUrl} alt="Bukti pengerjaan" className="w-full rounded-lg object-cover mt-2" style={{ maxHeight: 160 }} />
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      oleh {detail.confirmation.confirmedBy.name} · {formatDate(detail.confirmation.confirmedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Riwayat */}
              <p className="font-bold text-sm text-gray-900 mb-2">Riwayat</p>
              <div className="rounded-xl p-3.5 mb-5" style={{ background: '#EBF7FF' }}>
                {detail.history.map((h, i) => (
                  <div key={i} className="flex gap-3 mb-3 last:mb-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{h.action} oleh {h.user.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer aksi Head */}
            {isHead && detail.status === 'MENUNGGU' && (
              <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0">
                <button onClick={() => { setConfirmTargetId(detail.id); setConfirmDesc(''); setConfirmPhoto(null); setScreen('confirm') }}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: GRN }}>
                  ✅ Konfirmasi Pengerjaan Selesai
                </button>
              </div>
            )}
          </>
        )}

        {/* ════ SCREEN: DENAH VIEW (read-only dari detail) ════ */}
        {screen === 'denah-view' && denahMode === 'view' && detail && detail.denahCellR !== null && (
          <>
            <Header title="Denah Pelaporan" onBack={() => setScreen('detail')} />
            <div className="flex-1 flex items-center justify-center overflow-auto" style={{ background: '#9e9e9e' }}>
              <div className="relative shadow-2xl">
                <FloorPlanSVG />
                {/* Fixed red mark at saved cell */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(13, 1fr)`,
                  gridTemplateRows: `repeat(16, 1fr)`,
                }}>
                  {Array.from({ length: 16 * 13 }).map((_, i) => {
                    const r = Math.floor(i / 13), c = i % 13
                    const marked = r === detail.denahCellR && c === detail.denahCellC
                    return <div key={i} style={marked ? { background: 'rgba(220,38,38,0.6)' } : {}} />
                  })}
                </div>
              </div>
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setScreen('detail')} className="w-full py-3 rounded-xl border-2 text-sm font-bold" style={{ borderColor: P, color: P }}>
                Kembali
              </button>
            </div>
          </>
        )}

        {/* ════ SCREEN: FILTER STATISTIK ════ */}
        {screen === 'filter-stat' && (
          <>
            <Header title="Filter Statistik" onBack={() => setScreen('main')} />
            <div className="flex-1 overflow-y-auto p-4">
              <p className="font-bold text-sm text-gray-800 mb-3">Range Tanggal</p>
              <DateRangePicker
                startDate={tmpStart} endDate={tmpEnd}
                onChange={(s, e) => { setTmpStart(s); setTmpEnd(e) }}
              />
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0 flex flex-col gap-2">
              <button onClick={applyFilter} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: P }}>Terapkan</button>
              <button onClick={resetFilter} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: '#bbb' }}>Reset</button>
            </div>
          </>
        )}

        {/* ════ SCREEN: FILTER DAFTAR ════ */}
        {screen === 'filter-daftar' && (
          <>
            <Header title="Filter Daftar" onBack={() => setScreen('main')} />
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-5">
                <p className="font-bold text-sm text-gray-800 mb-3">Range Tanggal</p>
                <DateRangePicker
                  startDate={tmpStart} endDate={tmpEnd}
                  onChange={(s, e) => { setTmpStart(s); setTmpEnd(e) }}
                />
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm text-gray-800">Status</p>
                  <button onClick={() => setTmpFilter('semua')} className="text-xs font-semibold" style={{ color: P }}>Hapus Pilihan</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['semua','menunggu','selesai'] as Filter[]).map(f => (
                    <button key={f} onClick={() => setTmpFilter(f)}
                      className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
                      style={tmpFilter === f ? { background: P, color: 'white', borderColor: P } : { background: 'white', color: '#888', borderColor: '#e0e0e0' }}>
                      {f === 'semua' ? 'Semua' : f === 'menunggu' ? 'Menunggu' : 'Selesai'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <p className="font-bold text-sm text-gray-800 mb-3">PIC</p>
                <select value={tmpPicId} onChange={e => setTmpPicId(e.target.value)} className={input}>
                  <option value="">Pilih PIC</option>
                  {pics.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0 flex flex-col gap-2">
              <button onClick={applyFilter} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: P }}>Terapkan</button>
              <button onClick={resetFilter} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: '#bbb' }}>Reset</button>
            </div>
          </>
        )}

        {/* ════ SCREEN: FILTER PENGERJAAN ════ */}
        {screen === 'filter-pj' && (
          <>
            <Header title="Filter Pengerjaan" onBack={() => setScreen('main')} />
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-5">
                <p className="font-bold text-sm text-gray-800 mb-3">Range Tanggal</p>
                <DateRangePicker
                  startDate={tmpStart} endDate={tmpEnd}
                  onChange={(s, e) => { setTmpStart(s); setTmpEnd(e) }}
                />
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm text-gray-800">Status</p>
                  <button onClick={() => setTmpFilter('semua')} className="text-xs font-semibold" style={{ color: P }}>Hapus Pilihan</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['semua','menunggu','selesai'] as Filter[]).map(f => (
                    <button key={f} onClick={() => setTmpFilter(f)}
                      className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
                      style={tmpFilter === f ? { background: P, color: 'white', borderColor: P } : { background: 'white', color: '#888', borderColor: '#e0e0e0' }}>
                      {f === 'semua' ? 'Semua' : f === 'menunggu' ? 'Menunggu' : 'Selesai'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <p className="font-bold text-sm text-gray-800 mb-3">PIC</p>
                <select value={tmpPicId} onChange={e => setTmpPicId(e.target.value)} className={input}>
                  <option value="">Pilih PIC</option>
                  {pics.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0 flex flex-col gap-2">
              <button onClick={applyFilter} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: P }}>Terapkan</button>
              <button onClick={resetFilter} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: '#bbb' }}>Reset</button>
            </div>
          </>
        )}

        {/* ════ MODAL: Export ════ */}
        {exportOpen && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-white rounded-t-2xl p-5 w-full">
              <p className="font-bold text-sm mb-1">Export Laporan</p>
              <p className="text-xs text-gray-400 mb-4">
                {filtered.length} laporan · {periodLabel()}
              </p>
              <div className="flex gap-2.5 mb-3">
                <button onClick={exportPDF} disabled={exporting || filtered.length === 0}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#e74c3c' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="white" strokeWidth="2" strokeLinecap="round"/><polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                  {exporting ? 'Menyiapkan...' : 'Export PDF'}
                </button>
                <button onClick={exportExcel} disabled={exporting || filtered.length === 0}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#27ae60' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/><path d="M3 9h18M3 15h18M9 3v18" stroke="white" strokeWidth="2"/></svg>
                  {exporting ? 'Menyiapkan...' : 'Export Excel'}
                </button>
              </div>
              <button onClick={() => setExportOpen(false)}
                className="w-full py-2.5 rounded-xl border-2 text-sm font-bold"
                style={{ borderColor: P, color: P }}>
                Batal
              </button>
            </div>
          </div>
        )}

        {/* ════ SCREEN: KONFIRMASI PENGERJAAN ════ */}
        {screen === 'confirm' && (
          <>
            <Header title="Konfirmasi Pengerjaan" onBack={() => setScreen(detail ? 'detail' : 'main')} />
            <div className="flex-1 overflow-y-auto p-3.5">
              <FormSection>
                <Label>Deskripsi Pengerjaan *</Label>
                <textarea value={confirmDesc} onChange={e => setConfirmDesc(e.target.value)}
                  className={`${input} resize-none h-28`} placeholder="Jelaskan pengerjaan yang sudah dilakukan..." />
              </FormSection>
              <FormSection>
                <Label>Foto Bukti Pengerjaan *</Label>
                <ImageUpload value={confirmPhoto} onChange={setConfirmPhoto} placeholder="Tambah Foto Bukti Pengerjaan" />
              </FormSection>
              <div className="h-4" />
            </div>
            <div className="p-3.5 bg-white border-t border-gray-100 flex-shrink-0 flex flex-col gap-2">
              <button onClick={doConfirm} disabled={confirming}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60"
                style={{ background: GRN }}>
                {confirming ? 'Menyimpan...' : '✅ Konfirmasi Selesai'}
              </button>
              <button onClick={() => setScreen(detail ? 'detail' : 'main')}
                className="w-full py-3 rounded-xl border-2 text-sm font-bold"
                style={{ borderColor: P, color: P }}>
                Batal
              </button>
            </div>
          </>
        )}

        {/* ════ TOAST ════ */}
        {toast && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-lg whitespace-nowrap transition-all"
            style={{ background: GRN }}>
            ✅ {toast}
          </div>
        )}
      </PhoneFrame>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────── */
function Header({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden flex-shrink-0 flex items-center justify-between px-4"
      style={{ background: '#48b9ef', paddingTop: 40, paddingBottom: 16 }}>
      <div className="absolute -right-4 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <button onClick={onBack} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#48b9ef] font-bold z-10">←</button>
      <span className="text-white font-bold text-sm z-10">{title}</span>
      {right ?? <span style={{ width: 32 }} />}
    </div>
  )
}

function FormSection({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl p-3.5 mb-3" style={{ background: '#EBF7FF' }}>{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-gray-500 mb-1.5">{children}</label>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-xs my-0.5">
      <span className="text-gray-400 w-[44%]">{label}</span>
      <span className="text-gray-700 font-semibold">: {value}</span>
    </div>
  )
}

function FieldRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`py-2 ${!last ? 'border-b border-black/5' : ''}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800 mt-0.5 leading-snug">{value}</p>
    </div>
  )
}

function ReportCard({ r, onPress }: { r: Report; onPress: () => void }) {
  const isWait = r.status === 'MENUNGGU'
  return (
    <div className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm border cursor-pointer active:scale-[0.99] transition-transform"
      style={{ borderColor: isWait ? '#9AAEBB' : '#4CAF50' }} onClick={onPress}>
      <div className="p-3 pb-2">
        <p className="font-extrabold text-sm text-gray-900 mb-2">{r.property.name}</p>
        <Row label="ID Laporan" value={r.code} />
        <Row label="ID Denah" value={r.denahId || '-'} />
        <Row label="Tanggal Pelaporan" value={formatDate(r.createdAt)} />
        <Row label="Dilaporkan oleh" value={r.createdBy.name} />
      </div>
      <div className="py-2 text-center text-xs font-bold text-white"
        style={{ background: isWait ? '#9AAEBB' : '#4CAF50' }}>
        {isWait ? 'Menunggu Pengerjaan' : 'Selesai'}
      </div>
    </div>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#48b9ef]'
