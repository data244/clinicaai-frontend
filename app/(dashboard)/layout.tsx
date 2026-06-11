'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { perfilApi, assinaturaApi } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/TrialBanner'
import OnboardingWizard from '@/components/OnboardingWizard'
import MarinaHelper from '@/components/MarinaHelper'
import { Loader2, Clock, Zap } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [acesso, setAcesso] = useState<'verificando' | 'liberado' | 'bloqueado' | 'trial_expirado'>('verificando')
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null)
  const [loadingAssinar, setLoadingAssinar] = useState(false)
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState<string | undefined>()

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
          if (p.status_conta === 'ativo') {
            setNomeUsuario(p.nome)
            if (!p.onboarding_completo) setMostrarOnboarding(true)
            setAcesso('liberado')
          } else if (p.status_conta === 'trial') {
            const exp = p.trial_expires_at ? new Date(p.trial_expires_at) : null
            if (exp && exp < new Date()) {
              setAcesso('trial_expirado')
            } else {
              setNomeUsuario(p.nome)
              if (!p.onboarding_completo) setMostrarOnboarding(true)
              setTrialExpiresAt(p.trial_expires_at ?? null)
              setAcesso('liberado')
            }
          } else {
            setAcesso('bloqueado')
          }
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

  const fecharOnboarding = async () => {
    setMostrarOnboarding(false)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://clinicaai-backend-production.up.railway.app'
    try {
      await fetch(`${apiUrl}/api/v1/onboarding/completar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pulou: false }),
      })
    } catch (e) { console.error('onboarding completar falhou:', e) }
    router.push('/pacientes')
  }

  const assinarAgora = async () => {
    setLoadingAssinar(true)
    try {
      const { init_point } = await assinaturaApi.checkoutTrial()
      window.location.href = init_point
    } catch {
      alert('Não foi possível iniciar o checkout. Tente novamente.')
    } finally {
      setLoadingAssinar(false)
    }
  }

  if (acesso === 'trial_expirado') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="card max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl mb-4">
            <Clock className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Seu período beta encerrou</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Obrigado por fazer parte da fase beta do Clínica.ai! Seus pacientes e histórico estão preservados.
            Assine para continuar com acesso completo e ilimitado.
          </p>
          <button
            onClick={assinarAgora}
            disabled={loadingAssinar}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-3"
          >
            <Zap className="w-4 h-4" />
            {loadingAssinar ? 'Aguarde...' : 'Assinar o Clínica.ai'}
          </button>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Sair
          </button>
        </div>
      </div>
    )
  }

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
    <>
    {mostrarOnboarding && (
      <OnboardingWizard nomeUsuario={nomeUsuario} onClose={fecharOnboarding} />
    )}
    <div className="flex min-h-screen">
      {/* Fundo da aplicação: foto sutil + overlay claro */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <img src="/login-bg.jpg" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gray-50/94 backdrop-blur-[3px]" />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        {trialExpiresAt && <TrialBanner trialExpiresAt={trialExpiresAt} />}
        <div className="flex flex-1">
          <Sidebar />
          <main className="
            flex-1 overflow-auto
            md:p-8
            p-4 pt-[calc(3.5rem+1rem)] pb-[calc(3.5rem+1rem)]
          ">
            {children}
          </main>
        </div>
      </div>
    </div>
    <MarinaHelper key={mostrarOnboarding ? "wizard-ativo" : "livre"} pathname={pathname} />
    </>
  )
}
