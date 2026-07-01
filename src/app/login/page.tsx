'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneFrame from '@/components/PhoneFrame'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Login gagal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] px-6">
      <PhoneFrame>
        {/* Header */}
        <div className="bg-[#48b9ef] px-6 pt-16 pb-8 text-white text-center relative overflow-hidden flex-shrink-0">
          <div className="absolute -right-5 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -left-8 top-10 w-24 h-24 rounded-full bg-white/05" />
          <p className="text-xs opacity-75 mb-1 tracking-widest uppercase">D&apos;Paragon Property</p>
          <h1 className="text-2xl font-bold">Pelaporan SOD</h1>
          <p className="text-xs opacity-75 mt-1">Campagna &amp; Jede</p>
        </div>

        <div className="flex-1 px-6 py-8 bg-white rounded-t-3xl -mt-4 overflow-y-auto">
          <p className="text-sm text-gray-400 mb-6 text-center">Masuk ke akun Anda</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#48b9ef] focus:ring-2 focus:ring-[#48b9ef]/20 transition-all"
                placeholder="email@dparagon.com" required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#48b9ef] focus:ring-2 focus:ring-[#48b9ef]/20 transition-all"
                placeholder="••••••••" required
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center bg-red-50 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#48b9ef] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60 shadow-lg shadow-[#48b9ef]/30 transition-all active:scale-95">
              {loading ? 'Masuk...' : 'MASUK'}
            </button>
          </form>
        </div>
      </PhoneFrame>
    </div>
  )
}
