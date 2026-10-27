'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap } from 'lucide-react'
import { useAssinar } from '@/components/AvisoConta'

const DIA = 1000 * 60 * 60 * 24

// Dia no calendário de Brasília (AAAA-MM-DD)
function diaBr(t: number) {
  return new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

interface TrialBannerProps {
  fimTeste: string
  registrosUsados?: number | null
  registrosLimite?: number | null
  cartao?: boolean
}

export default function TrialBanner({ fimTeste, registrosUsados, registrosLimite, cartao = false }: TrialBannerProps) {
  const [diasRestantes, setDiasRestantes] = useState<number>(14)
  const [encerrado, setEncerrado] = useState(false)

  useEffect(() => {
    const calcular = () => {
      const exp = new Date(fimTeste).getTime()
      if (cartao) {
        // Com cartão, fimTeste é a primeira cobrança e o último dia do teste é a véspera,
        // como nos e-mails. Conta os dias que faltam, hoje incluído; no último, "termina hoje".
        const dias = Math.round((Date.parse(diaBr(exp)) - Date.parse(diaBr(Date.now()))) / DIA)
        setDiasRestantes(dias <= 1 ? 0 : dias)
        setEncerrado(dias <= 0 || exp <= Date.now())
        return
      }
      const diff = Math.ceil((exp - Date.now()) / DIA)
      setDiasRestantes(Math.max(0, diff))
      setEncerrado(exp <= Date.now())
    }
    calcular()
    const id = setInterval(calcular, 60_000)
    return () => clearInterval(id)
  }, [fimTeste, cartao])

  const temLimite = registrosLimite != null && registrosUsados != null
  const urgente = diasRestantes <= 3 || (temLimite && registrosLimite! - registrosUsados! <= 3)

  const { abrir, abrindo } = useAssinar()

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
          {encerrado
            ? 'Teste encerrado · primeira cobrança em processamento'
            : diasRestantes === 0 ? 'Teste termina hoje' : `Teste · ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`}
          {temLimite && ` · ${registrosUsados} de ${registrosLimite} registros`}
        </span>
      </div>

      {/* Botão assinar: quem já informou o cartão não precisa dele */}
      {!cartao && <button
        onClick={abrir}
        disabled={abrindo}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
          urgente
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Zap className="w-3 h-3" />
        {abrindo ? '...' : 'Assinar'}
      </button>}
    </div>
  )
}
