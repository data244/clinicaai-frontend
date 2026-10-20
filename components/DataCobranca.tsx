'use client'

import { useEffect, useState } from 'react'

// Data da primeira cobrança para quem se cadastra hoje: o fim do teste de 14 dias.
// Calculada no navegador, porque a página é montada uma vez só, no build.
// Mostra "em 03/11/2026"; antes de o navegador calcular, "no 15º dia".
export default function DataCobranca() {
  const [data, setData] = useState('')
  useEffect(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    setData(d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
  }, [])
  return <>{data ? `em ${data}` : 'no 15º dia'}</>
}
