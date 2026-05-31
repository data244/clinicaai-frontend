'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { iaApi, pacientesApi } from '@/lib/api'
import { Paciente } from '@/types'
import { Brain, Send, Loader2, Sparkles, FileText, User, Bot, ChevronDown, Plus, TrendingUp, MessageSquare } from 'lucide-react'

type Fonte = { id: string; data: string; tipo: string; queixa: string; similaridade: number }
type Mensagem = { role: 'user' | 'assistant'; content: string; fontes?: Fonte[] }
type Conversa = { id: string; paciente_id: string | null; titulo: string; mensagens: Mensagem[]; updatedAt: string }

const LS_KEY = 'clinicaai_copiloto_conversas'

function loadConversas(): Conversa[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveConversas(list: Conversa[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 50))) } catch {}
}
function fmtQuando(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const MD = {
  p: (p: any) => <p className="my-1 leading-relaxed" {...p} />,
  strong: (p: any) => <strong className="font-semibold" {...p} />,
  ul: (p: any) => <ul className="list-disc pl-5 space-y-0.5 my-1.5" {...p} />,
  ol: (p: any) => <ol className="list-decimal pl-5 space-y-0.5 my-1.5" {...p} />,
  h1: (p: any) => <h3 className="font-bold text-base mt-3 mb-1" {...p} />,
  h2: (p: any) => <h3 className="font-semibold text-sm mt-3 mb-1 text-gray-900" {...p} />,
  h3: (p: any) => <h4 className="font-semibold text-sm mt-2 mb-0.5 text-gray-800" {...p} />,
  code: (p: any) => <code className="bg-gray-100 text-[0.85em] px-1 py-0.5 rounded" {...p} />,
  a: (p: any) => <a className="text-primary-600 underline" {...p} />,
  table: (p: any) => <div className="overflow-x-auto my-2"><table className="min-w-full text-xs border-collapse" {...p} /></div>,
  thead: (p: any) => <thead className="bg-gray-50" {...p} />,
  th: (p: any) => <th className="border border-gray-200 px-2.5 py-1.5 text-left font-semibold text-gray-700" {...p} />,
  td: (p: any) => <td className="border border-gray-200 px-2.5 py-1.5 align-top text-gray-700" {...p} />,
  hr: () => <hr className="my-3 border-gray-100" />,
}

export default function CopilotoPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedFontes, setExpandedFontes] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { pacientesApi.list().then(setPacientes).catch(console.error) }, [])
  useEffect(() => { setConversas(loadConversas()) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens, loading])

  const nomePaciente = useCallback((id: string | null) => pacientes.find(p => p.id === id)?.nome || 'Geral', [pacientes])

  const novaConversa = () => { setMensagens([]); setConversaId(null); setError(''); setTimeout(() => inputRef.current?.focus(), 50) }
  const abrirConversa = (c: Conversa) => {
    setMensagens(c.mensagens); setConversaId(c.id); setSelectedPaciente(c.paciente_id || ''); setError('')
  }

  const persistir = (msgs: Mensagem[], cid: string) => {
    const titulo = (msgs.find(m => m.role === 'user')?.content || 'Conversa').slice(0, 70)
    const conv: Conversa = { id: cid, paciente_id: selectedPaciente || null, titulo, mensagens: msgs, updatedAt: new Date().toISOString() }
    setConversas(prev => {
      const list = [conv, ...prev.filter(c => c.id !== cid)]
      saveConversas(list)
      return list
    })
  }

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return
    if (!selectedPaciente) { setError('Selecione um paciente acima para conversar.'); return }

    const historicoAtual = [...mensagens, { role: 'user', content: texto } as Mensagem]
    setMensagens(historicoAtual)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const historico = mensagens.map(m => ({ role: m.role, content: m.content }))
      const res = await iaApi.coPiloto(texto, selectedPaciente || undefined, historico)
      const completo = [...historicoAtual, { role: 'assistant', content: res.resposta, fontes: res.fontes } as Mensagem]
      setMensagens(completo)
      const cid = conversaId || String(Date.now())
      if (!conversaId) setConversaId(cid)
      persistir(completo, cid)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao consultar o copiloto')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const sugestoes = [
    'Quais são os principais padrões clínicos deste paciente?',
    'Houve evolução nas últimas sessões?',
    'O que tende a se repetir no histórico?',
    'Quais pontos merecem atenção daqui pra frente?',
  ]

  const conversasPaciente = selectedPaciente ? conversas.filter(c => c.paciente_id === selectedPaciente) : []

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Coluna principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Copiloto Clínico
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Leitura inteligente do histórico do paciente — padrões, evolução e o que tende a vir a seguir
            </p>
          </div>
          <select
            className="input max-w-xs text-sm"
            value={selectedPaciente}
            onChange={e => { setSelectedPaciente(e.target.value); setMensagens([]); setConversaId(null); setError('') }}
          >
            <option value="" disabled>Selecione um paciente</option>
            {pacientes.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}
          </select>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {mensagens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Como posso ajudar na leitura do caso?</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-md">
                Pergunte sobre padrões, evolução e tendências do paciente. Selecione um paciente acima para respostas baseadas no histórico dele.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {sugestoes.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-200 rounded-lg px-3 py-2 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensagens.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm whitespace-pre-wrap leading-relaxed'
                    : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.role === 'user'
                    ? msg.content
                    : <div className="text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MD as any}>{msg.content}</ReactMarkdown></div>}
                </div>

                {msg.fontes && msg.fontes.length > 0 && (
                  <div className="mt-2">
                    <button onClick={() => setExpandedFontes(expandedFontes === idx ? null : idx)}
                      className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      {msg.fontes.length} registro{msg.fontes.length > 1 ? 's' : ''} consultado{msg.fontes.length > 1 ? 's' : ''}
                      <ChevronDown className={`w-3 h-3 transition-transform ${expandedFontes === idx ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFontes === idx && (
                      <div className="mt-2 space-y-1.5">
                        {msg.fontes.map((f, fi) => (
                          <div key={fi} className="text-xs bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-purple-700 capitalize">{f.tipo} — {f.data}</span>
                              {f.similaridade > 0 && <span className="text-purple-400">{(f.similaridade * 100).toFixed(0)}% similar</span>}
                            </div>
                            <p className="text-gray-600 truncate">{f.queixa || 'Sem queixa registrada'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Lendo o histórico e preparando a resposta...</span>
                </div>
              </div>
            </div>
          )}

          {error && (<div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg border border-red-200">{error}</div>)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={selectedPaciente ? "Faça uma pergunta clínica... (Enter para enviar, Shift+Enter para nova linha)" : "Selecione um paciente acima para começar"}
            rows={2}
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent leading-relaxed"
            disabled={loading || !selectedPaciente}
          />
          <button onClick={enviar} disabled={!input.trim() || loading || !selectedPaciente}
            className="flex-shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-2 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> Apoio ao raciocínio clínico com base no histórico do paciente — não substitui o julgamento profissional
        </p>
      </div>

      {/* Painel de memória (direita) */}
      <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-3">
        <button onClick={novaConversa}
          className="flex items-center justify-center gap-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2 transition-colors">
          <Plus className="w-4 h-4" /> Nova conversa
        </button>

        {/* Atalho para o Mapa Longitudinal do paciente */}
        {selectedPaciente && (
          <Link href={`/pacientes/${selectedPaciente}/mapa`}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-3 group">
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-wide text-white/70">Mesma inteligência</p>
              <p className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Mapa Longitudinal</p>
              <p className="text-[11px] text-white/80 mt-0.5">Padrões, conceitos e tendências de {nomePaciente(selectedPaciente)} →</p>
            </div>
            <svg viewBox="0 0 120 50" className="absolute right-0 bottom-0 w-24 opacity-30" fill="none">
              <polyline points="0,38 20,38 30,26 40,44 50,38 70,30 90,18 118,10" stroke="white" strokeWidth="2" strokeDasharray="0" strokeLinecap="round" />
            </svg>
          </Link>
        )}

        {/* Conversas anteriores */}
        <div className="flex-1 overflow-y-auto card !p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Conversas
          </p>
          {!selectedPaciente ? (
            <p className="text-xs text-gray-400 py-2">Selecione um paciente para ver as conversas.</p>
          ) : conversasPaciente.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Nenhuma conversa ainda com este paciente.</p>
          ) : (
            <div className="space-y-1">
              {conversasPaciente.map(c => (
                <button key={c.id} onClick={() => abrirConversa(c)}
                  className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors ${c.id === conversaId ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <p className="text-xs font-medium text-gray-700 truncate">{c.titulo}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{fmtQuando(c.updatedAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
