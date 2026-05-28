'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { iaApi } from '@/lib/api'
import {
  ArrowLeft, Activity, Calendar, FileText, Brain, ChevronDown, ChevronUp,
  Users, TrendingUp, AlertTriangle, MessageSquare, BarChart2, Send
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Padrao { tema: string; frequencia: number; sessoes: number[]; evolucao: string; observacao: string }
interface Pessoa { nome_papel: string; frequencia: number; sessoes: number[]; contexto: string }
interface Emocao { emocao: string; frequencia: number; intensidade: string }
interface Indicador { indicador: string; tendencia: string }
interface Analise {
  padroes: Padrao[]; pessoas_citadas: Pessoa[]; emocoes_dominantes: Emocao[]
  resumo_clinico: string; indicadores_progresso: Indicador[]; alertas_clinicos: string[]
}
interface Prontuario {
  id: string; tipo: string; data_atendimento: string; queixa_principal?: string
  anamnese?: string; hipotese_diagnostica?: string; conduta?: string
  prescricao?: string; observacoes?: string; resumo_ia?: string
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const EvolucaoBadge = ({ e }: { e: string }) => {
  const map: Record<string, string> = {
    crescente: 'bg-red-100 text-red-700', decrescente: 'bg-green-100 text-green-700',
    estável: 'bg-gray-100 text-gray-600', flutuante: 'bg-yellow-100 text-yellow-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[e] || 'bg-gray-100 text-gray-600'}`}>{e}</span>
}

const TendenciaBadge = ({ t }: { t: string }) => {
  const map: Record<string, { cls: string; icon: string }> = {
    positiva: { cls: 'text-green-600', icon: '↑' },
    negativa: { cls: 'text-red-500', icon: '↓' },
    neutra: { cls: 'text-gray-500', icon: '→' },
  }
  const v = map[t] || map.neutra
  return <span className={`text-sm font-bold ${v.cls}`}>{v.icon}</span>
}

function TimelineCard({ p, index }: { p: Prontuario; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white ring-2 ring-indigo-200 mt-1 flex-shrink-0" />
        {index >= 0 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{p.tipo}</span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />{formatDate(p.data_atendimento)}
            </span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {p.queixa_principal && <p className="mt-2 text-sm text-gray-700 font-medium">{p.queixa_principal}</p>}
        {p.resumo_ia && (
          <div className="mt-2 flex items-start gap-1.5 bg-indigo-50 rounded-lg p-2.5">
            <Brain className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">{p.resumo_ia}</p>
          </div>
        )}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
            {p.anamnese && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Anamnese</p><p className="whitespace-pre-wrap">{p.anamnese}</p></div>}
            {p.hipotese_diagnostica && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Hipótese</p><p>{p.hipotese_diagnostica}</p></div>}
            {p.conduta && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Conduta</p><p>{p.conduta}</p></div>}
            {p.prescricao && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Prescrição</p><p>{p.prescricao}</p></div>}
            {p.observacoes && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Observações</p><p>{p.observacoes}</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MapaLongitudinalPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<'analise' | 'timeline' | 'perguntas'>('analise')

  // Perguntas (mapa Q&A)
  const [mapaMsg, setMapaMsg] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [mapaPergunta, setMapaPergunta] = useState('')
  const [mapaLoading, setMapaLoading] = useState(false)
  const mapaEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (id) load() }, [id])
  useEffect(() => { mapaEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mapaMsg])

  async function load() {
    setLoading(true)
    try {
      const res = await iaApi.analiseLongitudinal(id as string)
      setData(res)
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar análise')
    } finally {
      setLoading(false)
    }
  }

  async function perguntarMapa() {
    if (!mapaPergunta.trim() || mapaLoading) return
    const pergunta = mapaPergunta.trim()
    const newMessages = [...mapaMsg, { role: 'user' as const, content: pergunta }]
    setMapaMsg(newMessages)
    setMapaPergunta('')
    setMapaLoading(true)
    try {
      const historico = mapaMsg.map(m => ({ role: m.role, content: m.content }))
      const res = await (await import('@/lib/api')).iaApi.copiloto(pergunta, id as string, historico)
      setMapaMsg([...newMessages, { role: 'assistant' as const, content: res.resposta }])
    } catch (e: any) {
      setMapaMsg([...newMessages, { role: 'assistant' as const, content: 'Erro: ' + (e.message || 'tente novamente') }])
    } finally {
      setMapaLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Activity className="w-8 h-8 text-indigo-500 animate-pulse mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Analisando histórico clínico...</p>
        <p className="text-gray-400 text-xs mt-1">Isso pode levar alguns segundos</p>
      </div>
    </div>
  )

  if (erro) return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href={`/pacientes/${id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao paciente
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{erro}</div>
    </div>
  )

  const analise: Analise | null = data?.analise
  const prontuarios: Prontuario[] = data?.prontuarios || []

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900">Mapa Longitudinal</h1>
          </div>
          {data?.paciente && <p className="text-sm text-gray-500 ml-7">{data.paciente}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">{data?.total_sessoes ?? 0}</p>
          <p className="text-xs text-indigo-600 mt-0.5">Sessões</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{analise?.padroes?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Padrões identificados</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{analise?.pessoas_citadas?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pessoas citadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {([['analise','Análise','BarChart2'],['timeline','Linha do Tempo','FileText'],['perguntas','Perguntas','MessageSquare']] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setAba(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${aba === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {key==='analise' && <BarChart2 className="w-4 h-4" />}
            {key==='timeline' && <FileText className="w-4 h-4" />}
            {key==='perguntas' && <MessageSquare className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* ── ABA: ANÁLISE ── */}
      {aba === 'analise' && (
        <div className="space-y-5">
          {!analise ? (
            <div className="text-center py-12 text-gray-400">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma análise disponível. Adicione prontuários primeiro.</p>
            </div>
          ) : (
            <>
              {/* Resumo clínico */}
              {analise.resumo_clinico && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-indigo-800">Resumo Clínico</h3>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed">{analise.resumo_clinico}</p>
                </div>
              )}

              {/* Padrões recorrentes */}
              {analise.padroes?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> Padrões Recorrentes
                  </h3>
                  <div className="space-y-3">
                    {analise.padroes.map((p, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-700">{p.frequencia}x</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-medium text-gray-900">{p.tema}</p>
                            <EvolucaoBadge e={p.evolucao} />
                          </div>
                          {p.observacao && <p className="text-xs text-gray-500">{p.observacao}</p>}
                          {p.sessoes?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">Sessões: {p.sessoes.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pessoas citadas */}
              {analise.pessoas_citadas?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" /> Pessoas Citadas
                  </h3>
                  <div className="space-y-2">
                    {analise.pessoas_citadas.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-700">{p.frequencia}x</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 capitalize">{p.nome_papel}</p>
                          <p className="text-xs text-gray-500">{p.contexto}</p>
                        </div>
                        {p.sessoes?.length > 0 && (
                          <span className="text-xs text-gray-400">Sess. {p.sessoes.join(', ')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emoções + Indicadores side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analise.emocoes_dominantes?.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Emoções Dominantes</h3>
                    <div className="space-y-2">
                      {analise.emocoes_dominantes.map((e, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, (e.frequencia / (data.total_sessoes || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-700 w-24 truncate">{e.emocao}</span>
                          <span className="text-xs text-gray-400 w-4">{e.frequencia}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analise.indicadores_progresso?.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Indicadores</h3>
                    <div className="space-y-2">
                      {analise.indicadores_progresso.map((ind, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <TendenciaBadge t={ind.tendencia} />
                          <p className="text-xs text-gray-700">{ind.indicador}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alertas clínicos */}
              {analise.alertas_clinicos?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Alertas Clínicos
                  </h3>
                  <ul className="space-y-1">
                    {analise.alertas_clinicos.map((a, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                        <span className="mt-1">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ABA: LINHA DO TEMPO ── */}
      {aba === 'timeline' && (
        <div>
          {prontuarios.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum registro clínico encontrado.</p>
            </div>
          ) : (
            prontuarios.map((p, i) => <TimelineCard key={p.id} p={p} index={i} />)
          )}
        </div>
      )}

      {/* ── ABA: PERGUNTAS ── */}
      {aba === 'perguntas' && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800">Perguntas ao Histórico</p>
            <p className="text-xs text-gray-400 mt-0.5">Ex: Quantas vezes ele citou a esposa? Houve evolução na queixa principal?</p>
          </div>
          {mapaMsg.length > 0 && (
            <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
              {mapaMsg.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <ReactMarkdown components={{
                        p: ({...props}) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props} />,
                        strong: ({...props}) => <strong className="font-semibold" {...props} />,
                        ul: ({...props}) => <ul className="text-sm list-disc ml-4 mb-2 space-y-0.5" {...props} />,
                        li: ({...props}) => <li className="text-sm" {...props} />,
                      }}>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {mapaLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              )}
              <div ref={mapaEndRef} />
            </div>
          )}
          {mapaMsg.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Faça uma pergunta sobre o histórico do paciente</p>
            </div>
          )}
          <div className="px-5 py-4 border-t border-gray-50 flex gap-2">
            <input type="text" value={mapaPergunta} onChange={e => setMapaPergunta(e.target.value)}
              onKeyDown={async e => { if (e.key === 'Enter' && !mapaLoading) await perguntarMapa() }}
              placeholder="Quantas vezes ele citou a esposa?" disabled={mapaLoading}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60" />
            <button onClick={perguntarMapa} disabled={mapaLoading || !mapaPergunta.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {mapaLoading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
