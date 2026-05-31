'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/layout/Sidebar'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !token) router.push('/login')
  }, [token, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!token) return null

  return (
    <div className="flex min-h-screen">
      {/* Fundo da aplicação: foto sutil + overlay claro (mantém a leitura confortável) */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <img src="/login-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gray-50/92 backdrop-blur-[2px]" />
      </div>

      <Sidebar />
      {/* Desktop: flex-1, offset by sidebar. Mobile: full width, offset top bar + bottom nav */}
      <main className="
        flex-1 overflow-auto
        md:p-8
        p-4 pt-[calc(3.5rem+1rem)] pb-[calc(3.5rem+1rem)]
      ">
        {children}
      </main>
    </div>
  )
}
