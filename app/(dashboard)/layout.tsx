'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { perfilApi, EVENTO_BLOQUEIO, Bloqueio } from '@/lib/api'
import type { AcessoConta } from '@/types'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/TrialBanner'
import { AvisoModoLeitura, ModalBloqueio } from '@/components/AvisoConta'
import OnboardingWizard from '@/components/OnboardingWizard'
import MarinaHelper from '@/components/MarinaHelper'
import { RodapeLegal } from '@/components/EmpresaResponsavel'
import AceiteNoPainel from '@/components/AceiteNoPainel'
import { VERSAO_TERMOS } from '@/lib/termos'
import { Loader2, AlertCircle } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  // Situação da conta vem do servidor (GET /auth/me). Quem grava é o servidor que decide;
  // aqui só mostramos o aviso certo.
  const [acesso, setAcesso] = useState<AcessoConta | null>(null)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [bloqueio, setBloqueio] = useState<Bloqueio | null>(null)
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState<string | undefined>()
  // Conta que ainda não aceitou esta versão dos Termos
  const [pedirAceite, setPedirAceite] = useState(false)
  const primeiraLeitura = useRef(true)

  useEffect(() => {
    if (!isLoading && !token) router.push('/login')
  }, [token, isLoading, router])

  // Lê a situação da conta ao entrar e a cada troca de página (o contador de registros muda).
  useEffect(() => {
    let vivo = true
    if (token) {
      perfilApi.get()
        .then(p => {
          if (!vivo) return
          const a: AcessoConta = p.acesso ?? {
            completo: false, situacao: 'leitura', fim_teste: null, acesso_ate: null,
            registros_usados: null, registros_limite: null,
          }
          // Antes do cartão aprovado a conta não entra no painel: vai para a tela "Falta o cartão"
          if (a.situacao === 'falta_cartao') { router.replace('/cartao'); return }
          setNomeUsuario(p.nome)
          setPedirAceite(p.aceite_no_painel === true && p.termos_versao !== VERSAO_TERMOS)
          // Boas-vindas só na primeira leitura e só para quem pode criar
          if (primeiraLeitura.current && a.completo && !p.onboarding_completo) setMostrarOnboarding(true)
          primeiraLeitura.current = false
          setAcesso(a)
          setFalhou(false)
        })
        // Sem resposta do servidor, não abre o painel: mostra a tela de tentar de novo
        .catch(() => { if (vivo) setFalhou(true) })
    }
    return () => { vivo = false }
  }, [token, pathname, tentativa, router])

  // O servidor recusou uma gravação: mostra o aviso e relê a situação
  useEffect(() => {
    const aoBloquear = (e: Event) => {
      setBloqueio((e as CustomEvent<Bloqueio>).detail)
      setTentativa(n => n + 1)
    }
    window.addEventListener(EVENTO_BLOQUEIO, aoBloquear)
    return () => window.removeEventListener(EVENTO_BLOQUEIO, aoBloquear)
  }, [])

  if (token && !acesso && falhou) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-2xl mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Não foi possível carregar sua conta</h1>
          <p className="text-sm text-gray-600 mb-6">Verifique a internet e tente de novo em instantes.</p>
          <button onClick={() => { setFalhou(false); setTentativa(n => n + 1) }} className="btn-primary w-full mb-3">
            Tentar de novo
          </button>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Sair
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || (token && !acesso)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!token) return null

  if (pedirAceite) return <AceiteNoPainel onAceito={() => setPedirAceite(false)} onSair={logout} />

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

  return (
    <>
    {mostrarOnboarding && (
      <OnboardingWizard nomeUsuario={nomeUsuario} onClose={fecharOnboarding} />
    )}
    {bloqueio && <ModalBloqueio bloqueio={bloqueio} onFechar={() => setBloqueio(null)} />}
    <div className="flex min-h-screen">
      {/* Fundo da aplicação: foto sutil + overlay claro */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <img src="/login-bg.jpg" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gray-50/94 backdrop-blur-[3px]" />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex flex-1">
          <Sidebar />
          <main className="
            flex-1 overflow-auto
            md:p-8
            p-4 pt-[calc(3.5rem+1rem)] pb-[calc(3.5rem+1rem)]
          ">
            {/* No celular o aviso do teste fica acima do título; no computador, fixo no canto */}
            {acesso?.completo && acesso.situacao === 'teste' && acesso.fim_teste && (
              <TrialBanner
                fimTeste={acesso.fim_teste}
                registrosUsados={acesso.registros_usados}
                registrosLimite={acesso.registros_limite}
                cartao={!!acesso.cartao}
              />
            )}
            {acesso && <AvisoModoLeitura acesso={acesso} />}
            {children}
            <RodapeLegal className="mt-12" />
          </main>
        </div>
      </div>
    </div>
    <MarinaHelper key={mostrarOnboarding ? "wizard-ativo" : "livre"} pathname={pathname} />
    </>
  )
}
