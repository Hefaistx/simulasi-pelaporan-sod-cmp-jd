import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SOD Pelaporan',
  description: 'Sistem pelaporan kerusakan harian D\'Paragon',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
