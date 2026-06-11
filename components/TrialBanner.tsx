'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap } from 'lucide-react'
import { assinaturaApi } from '@/lib/api'
import Link from 'next/link'

interface TrialBannerProps {
  trialExpiresAt: string
}

export default function TrialBanner({ trialExpiresAt }: TrialBannerProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState<number>(30)

  useEffect(() => {
    const calcular = () => {
      const exp = new Date(trialExpiresAt).getTime()
      const diff = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24))
      setDiasRestantes(Math.max(0, diff))
    }
    calcular()
    const id = setInterval(calcular, 60_000)
    return () => clearInterval(id)
  }, [trialExpiresAt])

  const urgente = diasRestantes <= 5

  const assinar = async () => {
    setLoadingCheckout(true)
    try {
      const { init_point } = await assinaturaApi.checkoutTrial()
      window.location.href = init_point
    } catch {
      alert('Não foi possível iniciar o checkout. Tente novamente.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      {/* Chip de dias */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
        urgente
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-white border-gray-200 text-gray-600'
      }`}>
        <Clock className={`w-3 h-3 ${urgente ? 'text-red-500' : 'text-gray-400'}`} />
        <span>
          {diasRestantes === 0 ? 'Beta encerra hoje' : `Beta · ${diasRestantes}d`}
        </span>
      </div>

      {/* Botão assinar */}
      <button
        onClick={assinar}
        disabled={loadingCheckout}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
          urgente
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Zap className="w-3 h-3" />
        {loadingCheckout ? '...' : 'Assinar'}
      </button>
    </div>
  )
}
