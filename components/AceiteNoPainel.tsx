'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import AceiteTermos from '@/components/AceiteTermos'
import { RodapeLegal } from '@/components/EmpresaResponsavel'
import { authApi } from '@/lib/api'
import { VERSAO_TERMOS, MSG_ACEITE_CONTA } from '@/lib/termos'

// Quem já tinha conta antes dos Termos (ou de uma versão nova deles) aceita aqui,
// antes de abrir o painel. A versão e a hora ficam no perfil, como no cadastro.
export default function AceiteNoPainel({ onAceito, onSair }: { onAceito: () => void; onSair: () => void }) {
  const [marcado, setMarcado] = useState(false)
  const [indo, setIndo] = useState(false)
  const [erro, setErro] = useState('')

  const continuar = async () => {
    if (!marcado) { setErro(MSG_ACEITE_CONTA); return }
    setIndo(true)
    setErro('')
    try {
      await authApi.aceitarTermos(VERSAO_TERMOS)
      onAceito()
    } catch (e: unknown) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível gravar o aceite agora. Tente de novo em instantes.')
      setIndo(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-2xl mb-4">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Termos de Uso e Política de Privacidade</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Para continuar usando o Clínica.ai, leia e aceite os Termos de Uso e a Política de Privacidade.
          </p>
          <AceiteTermos marcado={marcado} onChange={m => { setMarcado(m); setErro('') }} />
          {erro && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mt-4">{erro}</div>
          )}
          <button
            onClick={continuar} disabled={indo}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {indo && <Loader2 className="w-4 h-4 animate-spin" />}
            Continuar
          </button>
          <div className="text-center mt-4">
            <button onClick={onSair} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Sair</button>
          </div>
        </div>
        <RodapeLegal centro className="mt-6" />
      </div>
    </div>
  )
}
