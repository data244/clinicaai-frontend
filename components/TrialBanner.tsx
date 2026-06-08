'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap, X } from 'lucide-react'
import { assinaturaApi } from '@/lib/api'

interface TrialBannerProps {
  trialExpiresAt: string
}

export default function TrialBanner({ trialExpiresAt }: TrialBannerProps) {
  const [dispensado, setDispensado] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState<number>(0)

  useEffect(() => {
    const calcular = () => {
      const exp = new Date(trialExpiresAt).getTime()
      const agora = Date.now()
      const diff = Math.ceil((exp - agora) / (1000 * 60 * 60 * 24))
      setDiasRestantes(Math.max(0, diff))
    }
    calcular()
    const id = setInterval(calcular, 60_000)
    return () => clearInterval(id)
  }, [trialExpiresAt])

  // Banner dispensado por 24h via localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trial_banner_dispensado')
      if (saved && Date.now() - Number(saved) < 86_400_000) setDispensado(true)
    } catch { /* ignore */ }
  }, [])

  if (dispensado) return null

  const urgente = diasRestantes <= 5

  const assinar = async () => {
    setLoadingCheckout(true)
    try {
      const { init_point } = await assinaturaApi.checkoutTrial()
      window.location.href = init_point
    } catch (e) {
      alert('Não foi possível iniciar o checkout. Tente novamente.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  const dispensar = () => {
    try { localStorage.setItem('trial_banner_dispensado', String(Date.now())) } catch { /* ignore */ }
    setDispensado(true)
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
      urgente ? 'bg-red-600' : 'bg-indigo-600'
    } text-white`}>
      <Clock className="w-4 h-4 shrink-0" />
      <span className="flex-1 font-medium">
        {diasRestantes === 0
          ? 'Seu período beta encerra hoje!'
          : `Beta: ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''} · até 3 pacientes`}
      </span>
      <button
        onClick={assinar}
        disabled={loadingCheckout}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
          urgente
            ? 'bg-white text-red-600 hover:bg-red-50'
            : 'bg-white text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <Zap className="w-3.5 h-3.5" />
        {loadingCheckout ? 'Aguarde...' : 'Assinar agora'}
      </button>
      {!urgente && (
        <button onClick={dispensar} className="text-white/70 hover:text-white transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
