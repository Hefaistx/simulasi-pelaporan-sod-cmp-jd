'use client'
import { useState } from 'react'

const P = '#48b9ef'
const MO_LONG = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const MO_S    = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const DAY_HDR = ['Mi','Se','Se','Ra','Ka','Ju','Sa']

function fmt(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${parseInt(d)} ${MO_S[parseInt(m)-1]} ${y}`
}

function fmtShort(iso: string) {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${parseInt(d)}/${parseInt(m)}/${y}`
}

interface Props {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
}

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const initDate = startDate ? new Date(startDate + 'T00:00:00') : new Date()
  const [open, setOpen]         = useState(false)
  const [viewYear, setViewYear] = useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initDate.getMonth())
  const [tmpStart, setTmpStart] = useState(startDate)
  const [tmpEnd,   setTmpEnd]   = useState(endDate)
  const [step, setStep]         = useState<1 | 2>(1)

  function openPicker() {
    setTmpStart(startDate)
    setTmpEnd(endDate)
    setStep(1)
    const d = startDate ? new Date(startDate + 'T00:00:00') : new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setOpen(true)
  }

  function handleDay(iso: string) {
    if (step === 1) {
      setTmpStart(iso); setTmpEnd(iso); setStep(2)
    } else {
      if (iso >= tmpStart) { setTmpEnd(iso) }
      else { setTmpStart(iso); setTmpEnd(iso); setStep(2) }
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate()

  const displayText = startDate
    ? endDate && endDate !== startDate
      ? `${fmt(startDate)} - ${fmt(endDate)}`
      : fmt(startDate)
    : ''

  return (
    <>
      {/* Trigger field */}
      <div onClick={openPicker}
        className="border border-gray-200 rounded-xl px-4 py-3 cursor-pointer flex items-center justify-between bg-white">
        <div>
          {displayText
            ? <p className="font-bold text-sm text-gray-800">{displayText}</p>
            : <p className="text-sm text-gray-400">Pilih rentang tanggal</p>
          }
          <p className="text-xs text-gray-400 mt-0.5">Tap untuk memilih tanggal</p>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {/* Calendar popup — fixed so it breaks out of phone frame overflow */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 font-bold text-xl text-gray-600">
                ‹
              </button>
              <p className="font-bold text-base text-gray-800">{MO_LONG[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 font-bold text-xl text-gray-600">
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HDR.map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const iso = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const isStart   = iso === tmpStart
                const isEnd     = iso === tmpEnd
                const inRange   = tmpStart && tmpEnd && iso > tmpStart && iso < tmpEnd
                const selected  = isStart || isEnd || !!inRange

                return (
                  <button key={day} onClick={() => handleDay(iso)}
                    className="flex items-center justify-center h-9 w-full rounded-xl text-sm font-semibold transition-all"
                    style={selected
                      ? { background: P, color: 'white' }
                      : { color: '#333' }
                    }>
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Range summary */}
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Mulai</p>
                <p className="font-bold text-sm text-gray-800">{fmtShort(tmpStart)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Selesai</p>
                <p className="font-bold text-sm text-gray-800">{fmtShort(tmpEnd)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl border-2 font-bold text-sm text-gray-600"
                style={{ borderColor: '#ddd' }}>
                Cancel
              </button>
              <button onClick={() => { onChange(tmpStart, tmpEnd); setOpen(false) }}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: P }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
