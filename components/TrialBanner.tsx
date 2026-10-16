'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap } from 'lucide-react'
import { irParaAssinatura } from '@/components/AvisoConta'

interface TrialBannerProps {
  fimTeste: string
  registrosUsados?: number | null
  registrosLimite?: number | null
}

export default function TrialBanner({ fimTeste, registrosUsados, registrosLimite }: TrialBannerProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState<number>(14)

  useEffect(() => {
    const calcular = () => {
      const exp = new Date(fimTeste).getTime()
      const diff = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24))
      setDiasRestantes(Math.max(0, diff))
    }
    calcular()
    const id = setInterval(calcular, 60_000)
    return () => clearInterval(id)
  }, [fimTeste])

  const temLimite = registrosLimite != null && registrosUsados != null
  const urgente = diasRestantes <= 3 || (temLimite && registrosLimite! - registrosUsados! <= 3)

  const assinar = async () => {
    setLoadingCheckout(true)
    if (!(await irParaAssinatura())) setLoadingCheckout(false)
  }

  return (
    <div className="flex items-center justify-end gap-2 mb-3 md:mb-0 md:fixed md:top-4 md:right-4 md:z-30">
      {/* Chip do teste: dias e registros */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
        urgente
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-white border-gray-200 text-gray-600'
      }`}>
        <Clock className={`w-3 h-3 ${urgente ? 'text-red-500' : 'text-gray-400'}`} />
        <span>
          {diasRestantes === 0 ? 'Teste termina hoje' : `Teste · ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`}
          {temLimite && ` · ${registrosUsados} de ${registrosLimite} registros`}
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
