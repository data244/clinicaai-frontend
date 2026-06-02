'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminApi, ContaAdmin } from '@/lib/api'
import { ShieldCheck, Loader2, Check, Ban, Lock, KeyRound, Copy, X, Trash2 } from 'lucide-react'

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  ativo:              { label: 'Ativo',       cls: 'bg-green-50 text-green-700 border-green-200' },
  pendente_pagamento: { label: 'Aguardando',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  suspenso:           { label: 'Suspenso',    cls: 'bg-red-50 text-red-700 border-red-200' },
  trial:              { label: 'Teste',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export default function AdminPage() {
  const [contas, setContas] = useState<ContaAdmin[]>([])
  const [filtro, setFiltro] = useState<'pendente_pagamento' | ''>('pendente_pagamento')
  const [loading, setLoading] = useState(true)
  const [restrito, setRestrito] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)
  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; senha: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.listarContas(filtro || undefined)
      setContas(res.contas)
      setRestrito(false)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setRestrito(true)
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { carregar() }, [carregar])

  const alterar = async (id: string, status: string) => {
    setProcessando(id)
    try { await adminApi.alterarStatus(id, status) } finally {
      await carregar(); setProcessando(null)
    }
  }

  const redefinirSenha = async (c: ContaAdmin) => {
    setProcessando(c.id)
    try {
      const r = await adminApi.resetSenha(c.id)
      setSenhaGerada({ nome: c.nome || c.email, senha: r.senha_temporaria })
      setCopiado(false)
    } catch {
      // ignora; admin pode tentar de novo
    } finally {
      setProcessando(null)
    }
  }

  const deletarConta = async (c: ContaAdmin) => {
    if (!confirm(`Deletar a conta de "${c.nome || c.email}"?\n\nEsta ação é irreversível e libera o e-mail para reutilização.`)) return
    setProcessando(c.id)
    try {
      await adminApi.deletarConta(c.id)
      setContas(prev => prev.filter(x => x.id !== c.id))
    } catch {
      alert('Não foi possível deletar a conta.')
    } finally {
      setProcessando(null)
    }
  }

  if (restrito) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-2xl mb-4">
          <Lock className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Acesso restrito</h1>
        <p className="text-sm text-gray-500">Esta área é exclusiva do administrador.</p>
      </div>
    )
  }

  const fmtData = (s: string) => { try { return new Date(s).toLocaleDateString('pt-BR') } catch { return '' } }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Admin — Contas</h1>
      </div>
      <p className="text-sm text-gray-600 mb-5 ml-12">Libere o acesso de novos profissionais ou redefina a senha de alguém.</p>

      <div className="flex gap-2 mb-4">
        {([['pendente_pagamento', 'Aguardando'], ['', 'Todas']] as const).map(([val, lbl]) => (
          <button
            key={lbl}
            onClick={() => setFiltro(val as 'pendente_pagamento' | '')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === val ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : contas.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {filtro ? 'Nenhuma conta aguardando liberação.' : 'Nenhuma conta encontrada.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contas.map(c => {
              const info = STATUS_INFO[c.status_conta] || { label: c.status_conta, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
              const busy = processando === c.id
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nome || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  </div>
                  <div className="hidden md:block text-xs text-gray-400 w-24 shrink-0">{fmtData(c.created_at)}</div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${info.cls} shrink-0`}>{info.label}</span>
                  <div className="flex items-center gap-3 justify-end shrink-0 w-44">
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <button onClick={() => deletarConta(c)} title="Deletar conta"
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => redefinirSenha(c)} title="Redefinir senha"
                          className="text-gray-400 hover:text-indigo-600 transition-colors">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {c.status_conta === 'ativo' ? (
                          <button onClick={() => alterar(c.id, 'suspenso')}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
                            <Ban className="w-3.5 h-3.5" /> Suspender
                          </button>
                        ) : (
                          <button onClick={() => alterar(c.id, 'ativo')}
                            className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">
                            <Check className="w-3.5 h-3.5" /> Liberar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: senha temporária gerada */}
      {senhaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSenhaGerada(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Senha temporária</h2>
              <button onClick={() => setSenhaGerada(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Nova senha de <span className="font-medium text-gray-900">{senhaGerada.nome}</span>. Envie a ela e peça para trocar em Configurações depois de entrar.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <code className="flex-1 text-base font-mono text-gray-900 tracking-wide select-all">{senhaGerada.senha}</code>
              <button
                onClick={() => { navigator.clipboard?.writeText(senhaGerada.senha); setCopiado(true) }}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
