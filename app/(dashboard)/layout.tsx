'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { perfilApi } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import { Loader2, Clock } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading, logout } = useAuth()
  const router = useRouter()
  const [acesso, setAcesso] = useState<'verificando' | 'liberado' | 'bloqueado'>('verificando')

  useEffect(() => {
    if (!isLoading && !token) router.push('/login')
  }, [token, isLoading, router])

  // Portão de acesso: conta precisa estar liberada (ativo/trial) para usar o app.
  useEffect(() => {
    let vivo = true
    if (token) {
      perfilApi.get()
        .then(p => {
          if (!vivo) return
          const ok = p.status_conta === 'ativo' || p.status_conta === 'trial'
          setAcesso(ok ? 'liberado' : 'bloqueado')
        })
        .catch(() => { if (vivo) setAcesso('liberado') }) // fail-open: erro transitório não bloqueia
    }
    return () => { vivo = false }
  }, [token])

  if (isLoading || (token && acesso === 'verificando')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!token) return null

  if (acesso === 'bloqueado') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary-50 to-blue-100">
        <div className="card max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mb-4">
            <Clock className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Conta em análise</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Recebemos seu cadastro! Seu acesso ao Clínica.ai está sendo liberado — avisaremos assim que estiver pronto. Obrigado pelo interesse.
          </p>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Fundo da aplicação: foto sutil + overlay claro */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <img src="/login-bg.jpg" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gray-50/94 backdrop-blur-[3px]" />
      </div>

      <Sidebar />
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
