'use client'
import { useRef } from 'react'

interface Props {
  value: string | null
  onChange: (base64: string | null) => void
  placeholder?: string
}

export default function ImageUpload({ value, onChange, placeholder = 'Tambah Foto' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        // Kompres ke max 900px, JPEG 75%
        const MAX = 900
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        onChange(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  function clear() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Foto" className="w-full object-cover" style={{ maxHeight: 180 }} />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-semibold"
          >
            Ganti Foto
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[#48b9ef] rounded-xl p-5 text-center cursor-pointer text-[#48b9ef] text-sm transition-colors hover:bg-blue-50 active:bg-blue-100"
        >
          <div className="text-3xl mb-1">📷</div>
          <div>{placeholder}</div>
          <div className="text-xs text-gray-400 mt-1">Klik untuk buka kamera / galeri</div>
        </div>
      )}
    </>
  )
}
