'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { request, iaApi } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, Brain, Calendar, FileText, TrendingUp,
  AlertTriangle, Star, Activity, Clock, ChevronDown, ChevronUp,
  Loader2, BookOpen, Send, RefreshCw, Trash2, MessageSquare,
  Network, BarChart2, Users, Heart, Zap
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Padrao {
  tema: string
  frequencia: number
  sessoes: number[]
  evolucao: string
  observacao: string
}

interface PessoaCitada {
  nome_papel: string
  frequencia: number
  sessoes: number[]
  contexto: string
}

interface EmocaoDominante {
  emocao: string
  frequencia: number
  intensidade: string
}

interface IndicadorProgresso {
  indicador: string
  tendencia: string
}

interface Analise {
  resumo_clinico: string
  padroes: Padrao[]
  pessoas_citadas: PessoaCitada[]
  emocoes_dominantes: EmocaoDominante[]
  indicadores_progresso: IndicadorProgresso[]
  alertas_clinicos: string[]
}

interface Prontuario {
  id: string
  tipo: string
  data_atendimento: string
  queixa_principal?: string
  anamnese?: string
  hipotese_diagnostica?: string
  conduta?: string
  prescricao?: string
  observacoes?: string
  resumo_ia?: string
}

interface MensagemChat {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface AnaliseResponse {
  paciente: string
  total_sessoes: number
  analise: Analise | null
  prontuarios: Prontuario[]
  from_cache?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tendenciaCor(t: string) {
  if (t === 'positiva') return 'text-green-600 bg-green-50 border-green-200'
  if (t === 'negativa') return 'text-red-600 bg-red-50 border-red-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

function intensidadeCor(i: string) {
  if (i === 'alta') return 'bg-red-100 text-red-700'
  if (i === 'média') return 'bg-yellow-100 text-yellow-700'
  return 'bg-blue-100 text-blue-700'
}

function evolucaoCor(e: string) {
  if (e === 'crescente') return 'text-green-600'
  if (e === 'decrescente') return 'text-red-500'
  if (e === 'flutuante') return 'text-yellow-600'
  return 'text-gray-500'
}

// ─── EntryCard (Linha do Tempo) ───────────────────────────────────────────────

function EntryCard({ p, index }: { p: Prontuario; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const has = p.queixa_principal || p.resumo_ia || p.anamnese || p.conduta

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-400 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0 z-10">
          {index + 1}
        </div>
        <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden shadow-sm">
        <div
          className={`flex items-start justify-between p-4 ${has ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => has && setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                {p.tipo}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{fmt(p.data_atendimento)}</p>
            {p.queixa_principal && <p className="text-sm text-gray-700 mt-1 truncate">{p.queixa_principal}</p>}
          </div>
          {has && (
            <button className="text-gray-400 ml-2 shrink-0">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
        {expanded && has && (
          <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
            {p.queixa_principal && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Queixa</p>
                <p className="text-sm text-gray-700">{p.queixa_principal}</p>
              </div>
            )}
            {p.anamnese && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Anamnese</p>
                <p className="text-sm text-gray-700 leading-relaxed">{p.anamnese}</p>
              </div>
            )}
            {p.conduta && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Conduta</p>
                <p className="text-sm text-gray-700">{p.conduta}</p>
              </div>
            )}
            {p.resumo_ia && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Brain className="w-3 h-3 text-primary-500" /> Resumo IA
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{p.resumo_ia}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapaLongitudinalPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [aba, setAba] = useState<'analise' | 'linha' | 'perguntas' | 'conceitos'>('analise')
  const [dados, setDados] = useState<AnaliseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState('')

  // Chat
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
  const [pergunta, setPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [salvandoHistorico, setSalvandoHistorico] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Carrega análise + histórico ao montar
  useEffect(() => {
    if (!id) return
    carregarDados(false)
    carregarHistorico()
  }, [id])

  // Scroll automático no chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function carregarDados(forceRefresh: boolean) {
    if (forceRefresh) setAtualizando(true)
    else setLoading(true)
    setErro('')
    try {
      const url = `/api/v1/ia/pacientes/${id}/analise-longitudinal${forceRefresh ? '?force_refresh=true' : ''}`
      const res = await request<AnaliseResponse>(url)
      setDados(res)
    } catch (e: unknown) {
      setErro((e as Error).message || 'Erro ao carregar análise')
    } finally {
      setLoading(false)
      setAtualizando(false)
    }
  }

  async function carregarHistorico() {
    try {
      const res = await request<{ mensagens: MensagemChat[] }>(
        `/api/v1/ia/copiloto/historico/${id}`
      )
      if (res.mensagens && res.mensagens.length > 0) {
        setMensagens(res.mensagens)
      }
    } catch {
      // silencioso — histórico vazio é ok
    }
  }

  async function salvarHistorico(msgs: MensagemChat[]) {
    setSalvandoHistorico(true)
    try {
      await request(`/api/v1/ia/copiloto/historico`, {
        method: 'POST',
        body: JSON.stringify({ paciente_id: id, mensagens: msgs }),
      })
    } catch {
      // silencioso
    } finally {
      setSalvandoHistorico(false)
    }
  }

  async function limparConversa() {
    if (!confirm('Apagar todo o histórico desta conversa?')) return
    try {
      await request(`/api/v1/ia/copiloto/historico/${id}`, { method: 'DELETE' })
      setMensagens([])
    } catch {
      // silencioso
    }
  }

  async function enviarPergunta() {
    const texto = pergunta.trim()
    if (!texto || enviando) return

    const novaMensagemUser: MensagemChat = {
      role: 'user',
      content: texto,
      timestamp: new Date().toISOString(),
    }
    const novasMsgs = [...mensagens, novaMensagemUser]
    setMensagens(novasMsgs)
    setPergunta('')
    setEnviando(true)

    try {
      const historico = novasMsgs.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await iaApi.coPiloto(texto, id, historico)
      const resposta: MensagemChat = {
        role: 'assistant',
        content: res.resposta,
        timestamp: new Date().toISOString(),
      }
      const msgsFinais = [...novasMsgs, resposta]
      setMensagens(msgsFinais)
      await salvarHistorico(msgsFinais)
    } catch (e: unknown) {
      const errMsg: MensagemChat = {
        role: 'assistant',
        content: 'Erro ao processar sua pergunta. Tente novamente.',
        timestamp: new Date().toISOString(),
      }
      const msgsErro = [...novasMsgs, errMsg]
      setMensagens(msgsErro)
    } finally {
      setEnviando(false)
    }
  }

  // ─── Loading / Erro ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando mapa longitudinal...</p>
        </div>
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{erro || 'Dados indisponíveis'}</p>
        </div>
      </div>
    )
  }

  const { analise, prontuarios, total_sessoes } = dados

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/pacientes/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Mapa Longitudinal</h1>
          <p className="text-sm text-gray-500">{dados.paciente} · {total_sessoes} sessões</p>
        </div>
        <button
          onClick={() => carregarDados(true)}
          disabled={atualizando}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
          title="Forçar regeneração da análise"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? 'animate-spin' : ''}`} />
          {atualizando ? 'Atualizando...' : 'Atualizar análise'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'analise',   label: 'Análise',       icon: BarChart2 },
          { key: 'linha',     label: 'Linha do Tempo', icon: Clock },
          { key: 'perguntas', label: 'Perguntas',      icon: MessageSquare },
          { key: 'conceitos', label: 'Conceitos',      icon: Network },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key as typeof aba)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              aba === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Aba: Análise ─────────────────────────────────────────────────────── */}
      {aba === 'analise' && (
        <div className="space-y-4">
          {!analise ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum prontuário suficiente para análise ainda.</p>
            </div>
          ) : (
            <>
              {/* Resumo clínico */}
              {analise.resumo_clinico && (
                <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-100 p-5">
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" /> Resumo Clínico
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">{analise.resumo_clinico}</p>
                </div>
              )}

              {/* Alertas */}
              {analise.alertas_clinicos?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Alertas Clínicos
                  </p>
                  <ul className="space-y-1">
                    {analise.alertas_clinicos.map((a, i) => (
                      <li key={i} className="text-sm text-amber-800">· {a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Padrões */}
              {analise.padroes?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Padrões Recorrentes</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {analise.padroes.map((p, i) => (
                      <div key={i} className="px-5 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">{p.tema}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{p.frequencia}x</span>
                            <span className={`text-xs font-medium ${evolucaoCor(p.evolucao)}`}>{p.evolucao}</span>
                          </div>
                        </div>
                        {p.observacao && <p className="text-xs text-gray-500">{p.observacao}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emoções + Pessoas lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analise.emocoes_dominantes?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <h3 className="text-sm font-semibold text-gray-800">Emoções</h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {analise.emocoes_dominantes.map((e, i) => (
                        <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${intensidadeCor(e.intensidade)}`}>
                          {e.emocao} ({e.frequencia}x)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analise.pessoas_citadas?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-semibold text-gray-800">Pessoas Citadas</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {analise.pessoas_citadas.map((p, i) => (
                        <div key={i} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{p.nome_papel}</span>
                            <span className="text-xs text-gray-400">{p.frequencia}x</span>
                          </div>
                          {p.contexto && <p className="text-xs text-gray-500 mt-0.5">{p.contexto}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Indicadores de progresso */}
              {analise.indicadores_progresso?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Indicadores de Progresso</h3>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {analise.indicadores_progresso.map((ind, i) => (
                      <span key={i} className={`text-xs px-3 py-1.5 rounded-full border font-medium ${tendenciaCor(ind.tendencia)}`}>
                        {ind.indicador}
                        <span className="ml-1 opacity-70">↗</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Aba: Linha do Tempo ──────────────────────────────────────────────── */}
      {aba === 'linha' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {prontuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Nenhuma sessão registrada ainda.</p>
            </div>
          ) : (
            prontuarios.map((p, i) => <EntryCard key={p.id} p={p} index={i} />)
          )}
        </div>
      )}

      {/* ── Aba: Perguntas (Copiloto) ────────────────────────────────────────── */}
      {aba === 'perguntas' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ minHeight: '500px' }}>
          {/* Header do chat */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Perguntas ao Histórico</h3>
              <p className="text-xs text-gray-400">Ex: Quantas vezes ele citou a esposa? Houve evolução na queixa principal?</p>
            </div>
            {mensagens.length > 0 && (
              <button onClick={limparConversa}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                title="Limpar conversa">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Faça uma pergunta sobre o histórico do paciente</p>
              </div>
            )}
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={pergunta}
                onChange={e => setPergunta(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarPergunta()}
                placeholder="Quantas vezes ele citou a esposa?"
                disabled={enviando}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
              />
              <button
                onClick={enviarPergunta}
                disabled={enviando || !pergunta.trim()}
                className="bg-primary-600 text-white rounded-xl px-4 py-2.5 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Aba: Conceitos ───────────────────────────────────────────────────── */}
      {aba === 'conceitos' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <Network className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Mapa de conceitos em desenvolvimento.</p>
        </div>
      )}

    </div>
  )
}
